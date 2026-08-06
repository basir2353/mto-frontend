import { ApiError } from "@/lib/api/errors";
import type {
  Booking,
  Dispute,
  Message,
  MovingRequest,
  Payment,
  Promotion,
  Quote,
  QuoteCounteroffer,
  RequestItem,
  Review,
  SavedAddress,
  TrackingEvent,
  User,
  VehicleType,
} from "@/lib/api/types";
import type { NearbyMoversSortBy } from "@/lib/api/public";
import { DEFAULT_MAP_CENTER, estimateLocalPrice, haversineKm, type LatLng } from "@/lib/maps";
import { getDb, persist } from "./store";
import { delay, interpolate, matchPath, mockId, nowIso, offsetFrom } from "./utils";

type Ctx = { currentUser: User | null; query: URLSearchParams };
type Handler = (params: Record<string, string>, body: Record<string, unknown>, ctx: Ctx) => unknown | Promise<unknown>;
type Route = { method: string; path: string; handler: Handler };

function requireUser(ctx: Ctx): User {
  if (!ctx.currentUser) throw new ApiError(401, ["Unauthorized"]);
  return ctx.currentUser;
}

function tokensFor(userId: string) {
  return { accessToken: `mock.${userId}.access`, refreshToken: `mock.${userId}.refresh` };
}

function userIdFromToken(token: string | null): string | null {
  if (!token) return null;
  const m = /^mock\.([^.]+)\.access$/.exec(token);
  return m ? m[1] : null;
}

/* ---------------- joins ---------------- */

function joinQuote(quote: Quote): Quote {
  const db = getDb();
  return {
    ...quote,
    mover: db.users.find((u) => u.id === quote.moverId),
    counteroffers: db.counteroffers.filter((c) => c.quoteId === quote.id),
  };
}

function joinRequest(request: MovingRequest): MovingRequest {
  const db = getDb();
  return {
    ...request,
    quotes: db.quotes.filter((q) => q.requestId === request.id).map(joinQuote),
    customer: db.users.find((u) => u.id === request.customerId),
  };
}

function joinBooking(booking: Booking): Booking {
  const db = getDb();
  return {
    ...booking,
    mover: db.users.find((u) => u.id === booking.moverId),
    customer: db.users.find((u) => u.id === booking.customerId),
    request: booking.requestId ? db.requests.find((r) => r.id === booking.requestId) : undefined,
    quote: booking.quoteId ? db.quotes.find((q) => q.id === booking.quoteId) : undefined,
    items: db.bookingItems.filter((i) => i.bookingId === booking.id),
    review: db.reviews.find((r) => r.bookingId === booking.id) ?? null,
  };
}

function findRequestOr404(id: string): MovingRequest {
  const request = getDb().requests.find((r) => r.id === id);
  if (!request) throw new ApiError(404, ["Request not found"]);
  return request;
}

function buildCustomerStatement(userId: string, balance: number) {
  const db = getDb();
  const bookings = db.bookings.filter((b) => b.customerId === userId);
  const bookingIds = bookings.map((b) => b.id);
  const entries: Array<{
    id: string;
    type: string;
    direction: "credit" | "debit";
    amount: number;
    balanceAfter?: number | null;
    reason: string;
    description: string;
    source?: string | null;
    destination?: string | null;
    counterpartyName?: string | null;
    bookingId?: string | null;
    disputeId?: string | null;
    paymentId?: string | null;
    reference?: string | null;
    createdAt: string;
  }> = [];

  for (const payment of db.payments.filter((p) => p.payerId === userId && p.status === "completed")) {
    const booking = db.bookings.find((b) => b.id === payment.bookingId);
    const mover = booking ? db.users.find((u) => u.id === booking.moverId) : undefined;
    const moverName = mover?.moverProfile?.businessName ?? mover?.email ?? "Mover";
    const kind = payment.kind ?? "job";
    entries.push({
      id: `pay-${payment.id}`,
      type: kind === "tip" ? "tip_payment" : "job_payment",
      direction: "debit",
      amount: Number(payment.amount),
      reason: kind === "tip" ? "Tip payment" : "Move payment",
      description: kind === "tip" ? `Tip paid to ${moverName}` : `Move payment to ${moverName}`,
      source: "Your wallet",
      destination: moverName,
      counterpartyName: moverName,
      bookingId: payment.bookingId,
      paymentId: payment.id,
      reference: payment.transactionRef ?? payment.invoiceNumber ?? null,
      createdAt: payment.createdAt,
    });
  }

  for (const dispute of db.disputes.filter((d) => bookingIds.includes(d.bookingId) && Number(d.refundAmount ?? 0) > 0)) {
    entries.push({
      id: `dispute-${dispute.id}`,
      type: "dispute_refund",
      direction: "credit",
      amount: Number(dispute.refundAmount ?? 0),
      reason: "Dispute refund",
      description: "Dispute refund credited to your wallet",
      source: "Platform dispute resolution",
      destination: "Your wallet",
      counterpartyName: "MoveThisOut Support",
      bookingId: dispute.bookingId,
      disputeId: dispute.id,
      reference: `DISPUTE-${dispute.id.slice(0, 8).toUpperCase()}`,
      createdAt: dispute.updatedAt,
    });
  }

  entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalIn = entries.filter((e) => e.direction === "credit").reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter((e) => e.direction === "debit").reduce((s, e) => s + e.amount, 0);
  return { currentBalance: balance, totalIn, totalOut, entries };
}

function buildMoverStatement(userId: string, balance: number) {
  const db = getDb();
  const bookings = db.bookings.filter((b) => b.moverId === userId);
  const bookingIds = bookings.map((b) => b.id);
  const entries: ReturnType<typeof buildCustomerStatement>["entries"] = [];

  for (const payment of db.payments.filter((p) => bookingIds.includes(p.bookingId) && p.status === "completed")) {
    const amount = Number(payment.amount);
    const fee = Number(payment.platformCommission);
    const bookingRefunds = db.disputes
      .filter((d) => d.bookingId === payment.bookingId)
      .reduce((sum, d) => sum + Number(d.refundAmount ?? 0), 0);
    const refundRatio = amount > 0 ? Math.min(bookingRefunds / amount, 1) : 0;
    const net = Number(((amount - fee) * (1 - refundRatio)).toFixed(2));
    const booking = db.bookings.find((b) => b.id === payment.bookingId);
    const customer = booking ? db.users.find((u) => u.id === booking.customerId) : undefined;
    const customerName = customer?.customerProfile
      ? `${customer.customerProfile.firstName} ${customer.customerProfile.lastName}`.trim()
      : customer?.email ?? "Customer";
    const kind = payment.kind ?? "job";
    entries.push({
      id: `pay-${payment.id}`,
      type: kind === "tip" ? "tip_payment" : "job_payment",
      direction: "credit",
      amount: net,
      reason: kind === "tip" ? "Tip payment" : "Move payment",
      description: kind === "tip" ? `Tip received from ${customerName}` : `Job payout from ${customerName}`,
      source: customerName,
      destination: "Your mover wallet",
      counterpartyName: customerName,
      bookingId: payment.bookingId,
      paymentId: payment.id,
      reference: payment.transactionRef ?? payment.invoiceNumber ?? null,
      createdAt: payment.createdAt,
    });
  }

  for (const dispute of db.disputes.filter((d) => bookingIds.includes(d.bookingId) && Number(d.refundAmount ?? 0) > 0)) {
    const deduction = Number((Number(dispute.refundAmount ?? 0) * 0.9).toFixed(2));
    entries.push({
      id: `dispute-${dispute.id}`,
      type: "dispute_deduction",
      direction: "debit",
      amount: deduction,
      reason: "Dispute refund deduction",
      description: "Dispute refund deducted from your wallet",
      source: "Your mover wallet",
      destination: "Customer refund",
      counterpartyName: "Customer",
      bookingId: dispute.bookingId,
      disputeId: dispute.id,
      reference: `DISPUTE-${dispute.id.slice(0, 8).toUpperCase()}`,
      createdAt: dispute.updatedAt,
    });
  }

  entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalIn = entries.filter((e) => e.direction === "credit").reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter((e) => e.direction === "debit").reduce((s, e) => s + e.amount, 0);
  return { currentBalance: balance, totalIn, totalOut, entries };
}

function findBookingOr404(id: string): Booking {
  const booking = getDb().bookings.find((b) => b.id === id);
  if (!booking) throw new ApiError(404, ["Booking not found"]);
  return booking;
}

function findQuoteOr404(id: string): Quote {
  const quote = getDb().quotes.find((q) => q.id === id);
  if (!quote) throw new ApiError(404, ["Quote not found"]);
  return quote;
}

/* ---------------- simulated marketplace behavior ---------------- */

const QUOTE_LINES = [
  "Happy to help — I have a van free that day.",
  "Can do this one, flexible on timing.",
  "I've got the right vehicle for this, let's talk details.",
  "Available and nearby — quick turnaround.",
];

function scheduleQuotes(requestId: string) {
  const db = getDb();
  const movers = db.users.filter((u) => u.roles.includes("mover"));
  const count = 2 + Math.floor(Math.random() * 3);
  const chosen = [...movers].sort(() => Math.random() - 0.5).slice(0, Math.min(count, movers.length));

  chosen.forEach((mover, i) => {
    const delayMs = 4000 + i * 4500 + Math.random() * 2000;
    setTimeout(() => {
      const request = getDb().requests.find((r) => r.id === requestId);
      if (!request || request.status !== "open") return;
      const distanceKm = 3 + Math.random() * 27;
      const vehicleTypeIds = moverSeedVehicleTypeIds(mover.moverProfile?.businessName);
      const type = getDb().vehicleTypes.find((t) => vehicleTypeIds.includes(t.id));
      const price = Math.round(
        estimateLocalPrice(distanceKm, type?.basePrice, type?.pricePerKm) * (0.9 + Math.random() * 0.2),
      );
      const quote: Quote = {
        id: mockId("quote"),
        price,
        estimatedHours: Math.round(1 + distanceKm / 15),
        notes: QUOTE_LINES[i % QUOTE_LINES.length],
        status: "pending",
        requestId,
        moverId: mover.id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().quotes.push(quote);
      persist();
    }, delayMs);
  });
}

const TRACKING_STEPS: Array<{ status: string; title: string; note: string }> = [
  { status: "en_route", title: "Driver en route to pickup", note: "On the way to you" },
  { status: "loading", title: "Loading your items", note: "Loading at pickup location" },
  { status: "in_transit", title: "In transit to destination", note: "On the road" },
  { status: "delivered", title: "Delivered", note: "Items delivered" },
];

function scheduleTracking(bookingId: string) {
  const seed = Math.floor(Math.random() * 1000);
  const pickup = offsetFrom(DEFAULT_MAP_CENTER, seed, 8);
  const destination = offsetFrom(DEFAULT_MAP_CENTER, seed + 41, 8);

  TRACKING_STEPS.forEach((step, i) => {
    const delayMs = 6000 + i * 7000 + Math.random() * 2000;
    setTimeout(() => {
      const booking = getDb().bookings.find((b) => b.id === bookingId);
      if (!booking || booking.status === "completed" || booking.status === "cancelled") return;
      const t = (i + 1) / TRACKING_STEPS.length;
      const pos = interpolate(pickup, destination, t);
      booking.status = step.status;
      booking.currentLatitude = pos.lat;
      booking.currentLongitude = pos.lng;
      booking.updatedAt = nowIso();
      const event: TrackingEvent = {
        id: mockId("track"),
        bookingId,
        type: "status",
        status: step.title,
        note: step.note,
        latitude: pos.lat,
        longitude: pos.lng,
        createdAt: nowIso(),
      };
      getDb().trackingEvents.push(event);
      persist();
    }, delayMs);
  });
}

const REPLY_LINES = [
  "Sounds good, see you soon!",
  "On it — I'll keep you posted.",
  "Got it, thanks for the details.",
  "No problem, that works for me.",
];

function scheduleAutoReply(bookingId: string, moverId: string) {
  const delayMs = 2500 + Math.random() * 2000;
  setTimeout(() => {
    const message: Message = {
      id: mockId("msg"),
      bookingId,
      senderId: moverId,
      content: REPLY_LINES[Math.floor(Math.random() * REPLY_LINES.length)],
      isRead: false,
      createdAt: nowIso(),
    };
    getDb().messages.push(message);
    persist();
  }, delayMs);
}

/* ---------------- route handlers ---------------- */

const routes: Route[] = [
  /* AUTH */
  {
    method: "POST",
    path: "/auth/register",
    handler: (_p, body) => {
      const db = getDb();
      const email = String(body.email ?? "").toLowerCase();
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        throw new ApiError(409, ["An account with this email already exists"]);
      }
      const userId = mockId("user");
      const role = (body.role as string) === "mover" ? "mover" : (body.role as string) === "admin" ? "admin" : "customer";
      const user: User = {
        id: userId,
        email: String(body.email ?? ""),
        roles: [role as User["roles"][number]],
        isActive: true,
        isVerified: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        customerProfile:
          role === "customer"
            ? {
                id: mockId("cust"),
                firstName: String(body.firstName ?? "New"),
                lastName: String(body.lastName ?? "Customer"),
                phone: (body.phone as string) ?? null,
                avatarUrl: null,
                userId,
                createdAt: nowIso(),
                updatedAt: nowIso(),
              }
            : undefined,
        moverProfile:
          role === "mover"
            ? {
                id: mockId("mover"),
                businessName: String(body.businessName ?? `${body.firstName ?? "New"} ${body.lastName ?? "Mover"}`),
                phone: (body.phone as string) ?? null,
                bio: null,
                isVerified: false,
                avatarUrl: null,
                serviceAreas: [],
                documents: [],
                availability: null,
                latitude: null,
                longitude: null,
                userId,
                createdAt: nowIso(),
                updatedAt: nowIso(),
              }
            : undefined,
      };
      db.users.push(user);
      db.credentials.push({ userId, password: String(body.password ?? "") });
      persist();
      return { user, tokens: tokensFor(userId), verificationToken: `verify.${userId}` };
    },
  },
  {
    method: "POST",
    path: "/auth/login",
    handler: (_p, body) => {
      const db = getDb();
      const email = String(body.email ?? "").toLowerCase();
      const user = db.users.find((u) => u.email.toLowerCase() === email);
      const cred = user && db.credentials.find((c) => c.userId === user.id);
      if (!user || !cred || cred.password !== body.password) {
        throw new ApiError(401, ["Invalid email or password"]);
      }
      return { user, tokens: tokensFor(user.id) };
    },
  },
  { method: "POST", path: "/auth/logout", handler: () => ({ message: "Logged out" }) },
  { method: "GET", path: "/auth/me", handler: (_p, _b, ctx) => ctx.currentUser },
  {
    method: "POST",
    path: "/auth/verify-email",
    handler: (_p, body) => {
      const m = /^verify\.(.+)$/.exec(String(body.token ?? ""));
      const user = m && getDb().users.find((u) => u.id === m[1]);
      if (!user) throw new ApiError(400, ["Invalid verification token"]);
      user.isVerified = true;
      user.updatedAt = nowIso();
      persist();
      return { message: "Email verified", user };
    },
  },
  {
    method: "POST",
    path: "/auth/forgot-password",
    handler: (_p, body) => {
      const user = getDb().users.find((u) => u.email.toLowerCase() === String(body.email ?? "").toLowerCase());
      return {
        message: "If that email exists, a reset link was sent.",
        ...(user ? { resetToken: `reset.${user.id}` } : {}),
      };
    },
  },
  {
    method: "POST",
    path: "/auth/reset-password",
    handler: (_p, body) => {
      const m = /^reset\.(.+)$/.exec(String(body.token ?? ""));
      const cred = m && getDb().credentials.find((c) => c.userId === m[1]);
      if (!cred) throw new ApiError(400, ["Invalid reset token"]);
      cred.password = String(body.password ?? cred.password);
      persist();
      return { message: "Password reset" };
    },
  },

  /* CUSTOMERS */
  {
    method: "POST",
    path: "/customers/requests",
    handler: (_p, body, ctx) => {
      const user = requireUser(ctx);
      const request: MovingRequest = {
        id: mockId("req"),
        pickupAddress: String(body.pickupAddress ?? ""),
        destinationAddress: String(body.destinationAddress ?? ""),
        movingDate: String(body.movingDate ?? new Date().toISOString().slice(0, 10)),
        items: (body.items as RequestItem[]) ?? [],
        additionalNotes: (body.additionalNotes as string) ?? null,
        estimatedPrice: body.estimatedPrice != null ? Number(body.estimatedPrice) : null,
        distanceKm: body.distanceKm != null ? Number(body.distanceKm) : null,
        status: "open",
        customerId: user.id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().requests.push(request);
      persist();
      scheduleQuotes(request.id);
      return joinRequest(request);
    },
  },
  {
    method: "GET",
    path: "/customers/requests",
    handler: (_p, _b, ctx) => {
      const user = requireUser(ctx);
      return getDb().requests.filter((r) => r.customerId === user.id).map(joinRequest);
    },
  },
  { method: "GET", path: "/customers/requests/:id", handler: (p) => joinRequest(findRequestOr404(p.id)) },
  {
    method: "POST",
    path: "/customers/requests/:requestId/quotes/:quoteId/accept",
    handler: (p, body) => {
      const request = findRequestOr404(p.requestId);
      const quote = findQuoteOr404(p.quoteId);
      quote.status = "accepted";
      quote.updatedAt = nowIso();
      getDb().quotes.forEach((q) => {
        if (q.requestId === request.id && q.id !== quote.id && q.status !== "accepted") q.status = "declined";
      });
      request.status = "booked";
      request.updatedAt = nowIso();

      const paymentMethod =
        body?.paymentMethod === "wallet" || body?.paymentMethod === "cash_on_site"
          ? body.paymentMethod
          : "cash_on_site";

      const pickup = offsetFrom(DEFAULT_MAP_CENTER, 3, 4);
      const booking: Booking = {
        id: mockId("book"),
        scheduledDate: request.movingDate,
        price: quote.price,
        estimatedPrice: quote.price,
        status: "confirmed",
        paymentMethod,
        pickupAddress: { formatted: request.pickupAddress },
        destinationAddress: { formatted: request.destinationAddress },
        vehicleTypeId: null,
        pricingBreakdown: { quoted: quote.price },
        notes: quote.notes ?? null,
        currentLatitude: pickup.lat,
        currentLongitude: pickup.lng,
        requestId: request.id,
        moverId: quote.moverId,
        customerId: request.customerId,
        quoteId: quote.id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().bookings.push(booking);
      getDb().trackingEvents.push({
        id: mockId("track"),
        bookingId: booking.id,
        type: "status",
        status: "Booking confirmed",
        note: "Mover accepted",
        createdAt: nowIso(),
      });
      persist();
      scheduleTracking(booking.id);
      return joinBooking(booking);
    },
  },
  {
    method: "POST",
    path: "/customers/requests/:requestId/quotes/:quoteId/counteroffer",
    handler: (p, body, ctx) => {
      const user = requireUser(ctx);
      const quote = findQuoteOr404(p.quoteId);
      quote.status = "countered";
      quote.updatedAt = nowIso();
      const counter: QuoteCounteroffer = {
        id: mockId("counter"),
        quoteId: quote.id,
        authorId: user.id,
        authorRole: "customer",
        price: Number(body.price ?? quote.price),
        notes: (body.notes as string) ?? null,
        status: "pending",
        createdAt: nowIso(),
      };
      getDb().counteroffers.push(counter);
      persist();
      return counter;
    },
  },
  {
    method: "GET",
    path: "/customers/bookings",
    handler: (_p, _b, ctx) => {
      const user = requireUser(ctx);
      return getDb()
        .bookings.filter((b) => b.customerId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(joinBooking);
    },
  },
  { method: "GET", path: "/customers/bookings/:id", handler: (p) => joinBooking(findBookingOr404(p.id)) },
  {
    method: "POST",
    path: "/customers/bookings/:id/cancel",
    handler: (p, body) => {
      const booking = findBookingOr404(p.id);
      booking.status = "cancelled";
      booking.cancellationReason = (body.reason as string) ?? null;
      booking.updatedAt = nowIso();
      persist();
      return joinBooking(booking);
    },
  },
  {
    method: "POST",
    path: "/customers/bookings/:bookingId/review",
    handler: (p, body, ctx) => {
      const user = requireUser(ctx);
      const booking = findBookingOr404(p.bookingId);
      const review: Review = {
        id: mockId("review"),
        bookingId: booking.id,
        customerId: user.id,
        moverId: booking.moverId ?? "",
        rating: Number(body.rating ?? 5),
        comment: (body.comment as string) ?? null,
        createdAt: nowIso(),
      };
      getDb().reviews.push(review);
      booking.status = "completed";
      booking.updatedAt = nowIso();
      persist();
      return review;
    },
  },
  {
    method: "POST",
    path: "/customers/bookings/:bookingId/payment",
    handler: (p, body, ctx) => {
      const user = requireUser(ctx);
      const booking = findBookingOr404(p.bookingId);
      const kind = (body.kind as Payment["kind"]) ?? "job";
      if (kind === "job") {
        throw new ApiError(
          400,
          [
            (booking.paymentMethod ?? "cash_on_site") === "cash_on_site"
              ? "Cash payments must be confirmed by the mover after they receive the cash"
              : "Pay this booking from your wallet instead",
          ],
        );
      }
      const payment: Payment = {
        id: mockId("pay"),
        bookingId: p.bookingId,
        payerId: user.id,
        amount: Number(body.amount ?? booking.price ?? 0),
        platformCommission: Math.round(Number(body.amount ?? booking.price ?? 0) * 0.1 * 100) / 100,
        kind,
        method: "cash_on_site",
        status: "completed",
        transactionRef: (body.transactionRef as string) ?? `TIP-CASH-${Date.now()}`,
        invoiceNumber: `INV-${Date.now()}`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().payments.push(payment);
      persist();
      return payment;
    },
  },
  {
    method: "POST",
    path: "/movers/bookings/:bookingId/confirm-cash",
    handler: (p, _body, ctx) => {
      const user = requireUser(ctx);
      const booking = findBookingOr404(p.bookingId);
      if (booking.moverId !== user.id) throw new ApiError(403, ["Access denied"]);
      if (booking.status !== "completed") {
        throw new ApiError(400, ["Cash can only be confirmed after the move is completed"]);
      }
      if ((booking.paymentMethod ?? "cash_on_site") !== "cash_on_site") {
        throw new ApiError(400, ["This booking was set up for wallet payment, not cash on site"]);
      }
      const existing = getDb().payments.find(
        (pay) => pay.bookingId === p.bookingId && pay.kind === "job" && pay.status === "completed",
      );
      if (existing) throw new ApiError(400, ["This move has already been marked as paid"]);
      const amount = Number(booking.price ?? 0);
      const payment: Payment = {
        id: mockId("pay"),
        bookingId: p.bookingId,
        payerId: booking.customerId,
        amount,
        platformCommission: Math.round(amount * 0.1 * 100) / 100,
        kind: "job",
        method: "cash_on_site",
        status: "completed",
        transactionRef: `CASH-MOVER-${Date.now()}`,
        invoiceNumber: `INV-${Date.now()}`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().payments.push(payment);
      persist();
      return payment;
    },
  },
  {
    method: "POST",
    path: "/bookings/:id/share",
    handler: (p, body, ctx) => {
      requireUser(ctx);
      const booking = findBookingOr404(p.id);
      const shareToken = `share_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      const hours = Number(body.expiresInHours ?? 72);
      booking.shareToken = shareToken;
      booking.updatedAt = nowIso();
      persist();
      return {
        shareToken,
        expiresAt: Number.isFinite(hours) && hours > 0
          ? new Date(Date.now() + hours * 3600 * 1000).toISOString()
          : null,
      };
    },
  },
  {
    method: "GET",
    path: "/public/tracking/:token",
    handler: (p) => {
      const booking = getDb().bookings.find((b) => b.shareToken === p.token);
      if (!booking) throw new ApiError(404, ["Tracking link is invalid or has expired"]);
      return {
        bookingId: booking.id,
        status: booking.status,
        currentLocation: {
          latitude: booking.currentLatitude ?? undefined,
          longitude: booking.currentLongitude ?? undefined,
        },
        lastUpdatedAt: booking.updatedAt,
        scheduledDate: booking.scheduledDate,
        pickupAddress: booking.pickupAddress ?? null,
        destinationAddress: booking.destinationAddress ?? null,
        price: Number(booking.price),
        mover: booking.moverId
          ? {
              id: booking.moverId,
              businessName: joinBooking(booking).mover?.moverProfile?.businessName,
              avatarUrl: joinBooking(booking).mover?.moverProfile?.avatarUrl,
            }
          : undefined,
        events: getDb()
          .trackingEvents.filter((t) => t.bookingId === booking.id && t.type !== "location_update")
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    },
  },
  {
    method: "GET",
    path: "/customers/wallet",
    handler: (_p, _body, ctx) => {
      const user = requireUser(ctx);
      const db = getDb();
      const balance = db.walletBalances[user.id] ?? 0;
      const payments = db.payments.filter((pay) => pay.payerId === user.id && pay.status === "completed");
      let jobPayments = 0;
      let tipsPaid = 0;
      const rows = payments.map((p) => {
        const amount = Number(p.amount);
        if (p.kind === "tip") tipsPaid += amount;
        else jobPayments += amount;
        const booking = db.bookings.find((b) => b.id === p.bookingId);
        const mover = booking ? db.users.find((u) => u.id === booking.moverId) : undefined;
        return {
          id: p.id,
          bookingId: p.bookingId,
          kind: p.kind ?? "job",
          amount,
          status: p.status,
          transactionRef: p.transactionRef,
          invoiceNumber: p.invoiceNumber,
          createdAt: p.createdAt,
          moverName: mover?.moverProfile?.businessName ?? mover?.email ?? "Mover",
        };
      });
      return {
        balance,
        totalSpent: jobPayments + tipsPaid,
        jobPayments,
        tipsPaid,
        payments: rows.reverse(),
        statement: buildCustomerStatement(user.id, balance),
      };
    },
  },
  {
    method: "POST",
    path: "/customers/wallet/top-up",
    handler: (_p, body, ctx) => {
      const user = requireUser(ctx);
      const db = getDb();
      const amount = Number(body.amount ?? 0);
      const next = Number(((db.walletBalances[user.id] ?? 0) + amount).toFixed(2));
      db.walletBalances[user.id] = next;
      persist();
      return { balance: next, added: amount };
    },
  },
  {
    method: "GET",
    path: "/customers/bookings/:id/invoice",
    handler: (p, _body, ctx) => {
      const user = requireUser(ctx);
      const db = getDb();
      const booking = findBookingOr404(p.id);
      if (booking.customerId !== user.id) throw new ApiError(403, ["Access denied"]);
      const kind = (ctx.query.get("kind") as "job" | "tip") ?? "job";
      const amount = Number(ctx.query.get("amount") ?? (kind === "tip" ? 0 : booking.price));
      const existing = db.payments.find(
        (pay) => pay.bookingId === booking.id && pay.kind === kind && pay.status === "completed",
      );
      const balance = db.walletBalances[user.id] ?? 0;
      const request = booking.requestId ? db.requests.find((r) => r.id === booking.requestId) : undefined;
      const mover = db.users.find((u) => u.id === booking.moverId);
      const pickup = (booking.pickupAddress as { street?: string } | undefined)?.street ?? request?.pickupAddress ?? "Pickup";
      const destination = (booking.destinationAddress as { street?: string } | undefined)?.street ?? request?.destinationAddress ?? "Drop-off";
      return {
        invoiceNumber: existing?.invoiceNumber ?? `INV-${booking.id.slice(0, 8).toUpperCase()}-${kind === "tip" ? "TIP" : "JOB"}`,
        bookingId: booking.id,
        kind,
        status: existing ? "paid" : "draft",
        issuedAt: nowIso(),
        dueAt: booking.scheduledDate ?? request?.movingDate ?? null,
        customer: {
          name: user.customerProfile ? `${user.customerProfile.firstName} ${user.customerProfile.lastName}`.trim() : user.email,
          email: user.email,
          phone: user.customerProfile?.phone ?? null,
        },
        mover: { name: mover?.moverProfile?.businessName ?? mover?.email ?? "Mover", phone: mover?.moverProfile?.phone ?? null },
        route: { pickup, destination },
        lineItems: [
          {
            label: kind === "tip" ? "Tip for mover" : "Moving service",
            description: `${pickup} → ${destination}`,
            quantity: 1,
            unitPrice: amount,
            amount,
          },
        ],
        subtotal: amount,
        tax: 0,
        total: amount,
        walletBalance: balance,
        canPayFromWallet: !existing && balance >= amount,
        alreadyPaid: !!existing,
        paymentId: existing?.id ?? null,
        paidAt: existing?.createdAt ?? null,
      };
    },
  },
  {
    method: "POST",
    path: "/customers/bookings/:id/pay-wallet",
    handler: (p, body, ctx) => {
      const user = requireUser(ctx);
      const db = getDb();
      const booking = findBookingOr404(p.id);
      if (booking.customerId !== user.id) throw new ApiError(403, ["Access denied"]);
      const kind = (body.kind as Payment["kind"]) ?? "job";
      if (kind === "job" && (booking.paymentMethod ?? "cash_on_site") !== "wallet") {
        throw new ApiError(400, [
          "This booking is set for cash on site — the mover must confirm cash received",
        ]);
      }
      const amount = Number(body.amount ?? (kind === "tip" ? 0 : booking.price));
      const balance = db.walletBalances[user.id] ?? 0;
      if (balance < amount) throw new ApiError(400, [`Insufficient wallet balance. Add $${(amount - balance).toFixed(2)} to continue.`]);
      db.walletBalances[user.id] = Number((balance - amount).toFixed(2));
      const payment: Payment = {
        id: mockId("pay"),
        bookingId: booking.id,
        payerId: user.id,
        amount,
        platformCommission: Math.round(amount * 0.1 * 100) / 100,
        kind,
        method: "wallet",
        status: "completed",
        transactionRef: `WALLET-${Date.now()}`,
        invoiceNumber: `INV-${Date.now()}`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.payments.push(payment);
      if (booking.moverId) {
        const moverNet = Number((amount - payment.platformCommission).toFixed(2));
        db.moverWalletBalances[booking.moverId] = Number(
          ((db.moverWalletBalances[booking.moverId] ?? 0) + moverNet).toFixed(2),
        );
      }
      persist();
      const request = booking.requestId ? db.requests.find((r) => r.id === booking.requestId) : undefined;
      const mover = db.users.find((u) => u.id === booking.moverId);
      const pickup = (booking.pickupAddress as { street?: string } | undefined)?.street ?? request?.pickupAddress ?? "Pickup";
      const destination = (booking.destinationAddress as { street?: string } | undefined)?.street ?? request?.destinationAddress ?? "Drop-off";
      return {
        payment,
        balance: db.walletBalances[user.id],
        invoice: {
          invoiceNumber: payment.invoiceNumber,
          bookingId: booking.id,
          kind,
          status: "paid",
          issuedAt: payment.createdAt,
          dueAt: booking.scheduledDate ?? request?.movingDate ?? null,
          customer: { name: user.email, email: user.email, phone: null },
          mover: { name: mover?.moverProfile?.businessName ?? "Mover", phone: null },
          route: { pickup, destination },
          lineItems: [{ label: kind === "tip" ? "Tip for mover" : "Moving service", description: `${pickup} → ${destination}`, quantity: 1, unitPrice: amount, amount }],
          subtotal: amount,
          tax: 0,
          total: amount,
          walletBalance: db.walletBalances[user.id],
          canPayFromWallet: false,
          alreadyPaid: true,
          paymentId: payment.id,
          paidAt: payment.createdAt,
        },
      };
    },
  },
  {
    method: "POST",
    path: "/customers/bookings/:bookingId/dispute",
    handler: (p, body, ctx) => {
      const user = requireUser(ctx);
      const dispute: Dispute = {
        id: mockId("dispute"),
        bookingId: p.bookingId,
        raisedById: user.id,
        reason: String(body.reason ?? ""),
        evidenceUrls: Array.isArray(body.evidenceUrls) ? body.evidenceUrls.map(String) : [],
        status: "open",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().disputes.push(dispute);
      persist();
      return { id: dispute.id };
    },
  },

  /* BOOKINGS (generic + messages) */
  {
    method: "POST",
    path: "/bookings/estimate",
    handler: (_p, body) => {
      const distanceKm = Number(body.distanceKm ?? 3 + Math.random() * 20);
      return { distanceKm, total: estimateLocalPrice(distanceKm) };
    },
  },
  {
    method: "POST",
    path: "/bookings/preview",
    handler: (_p, body) => {
      const distanceKm = Number(body.distanceKm ?? 3 + Math.random() * 20);
      return { distanceKm, total: estimateLocalPrice(distanceKm) };
    },
  },
  { method: "GET", path: "/bookings/:id", handler: (p) => joinBooking(findBookingOr404(p.id)) },
  {
    method: "GET",
    path: "/bookings/:id/tracking",
    handler: (p) => {
      const booking = findBookingOr404(p.id);
      return {
        bookingId: booking.id,
        status: booking.status,
        currentLocation: { latitude: booking.currentLatitude ?? undefined, longitude: booking.currentLongitude ?? undefined },
        events: getDb()
          .trackingEvents.filter((t) => t.bookingId === booking.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    },
  },
  {
    method: "GET",
    path: "/bookings/:id/location",
    handler: (p) => {
      const booking = findBookingOr404(p.id);
      return {
        bookingId: booking.id,
        latitude: booking.currentLatitude ?? undefined,
        longitude: booking.currentLongitude ?? undefined,
        pickupAddress: booking.pickupAddress ?? undefined,
        destinationAddress: booking.destinationAddress ?? undefined,
        updatedAt: booking.updatedAt,
      };
    },
  },
  {
    method: "GET",
    path: "/bookings/:id/status",
    handler: (p) => {
      const booking = findBookingOr404(p.id);
      return { bookingId: booking.id, status: booking.status, scheduledDate: booking.scheduledDate, updatedAt: booking.updatedAt };
    },
  },
  {
    method: "POST",
    path: "/bookings/:id/rebook",
    handler: (p) => {
      const original = findBookingOr404(p.id);
      const rebooked: Booking = {
        ...original,
        id: mockId("book"),
        status: "confirmed",
        scheduledDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        currentLatitude: undefined,
        currentLongitude: undefined,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().bookings.push(rebooked);
      persist();
      return joinBooking(rebooked);
    },
  },
  { method: "GET", path: "/bookings/:id/items", handler: (p) => getDb().bookingItems.filter((i) => i.bookingId === p.id) },
  {
    method: "GET",
    path: "/messages/conversations",
    handler: (_p, _b, ctx) => {
      const user = requireUser(ctx);
      const db = getDb();
      const bookings = db.bookings.filter(
        (b) =>
          b.customerId === user.id ||
          b.moverId === user.id ||
          (user.roles.includes("admin") && db.disputes.some((d) => d.bookingId === b.id)),
      );

      const conversations = bookings
        .filter((b) => b.moverId || db.messages.some((m) => m.bookingId === b.id))
        .map((booking) => {
          const thread = db.messages
            .filter((m) => m.bookingId === booking.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          const lastMessage = thread[0] ?? null;
          const unreadCount = thread.filter((m) => m.senderId !== user.id && !m.isRead).length;
          const partnerUser =
            booking.customerId === user.id
              ? db.users.find((u) => u.id === booking.moverId)
              : db.users.find((u) => u.id === booking.customerId);
          const partnerName =
            partnerUser?.moverProfile?.businessName ??
            (partnerUser?.customerProfile
              ? `${partnerUser.customerProfile.firstName} ${partnerUser.customerProfile.lastName}`.trim()
              : partnerUser?.email ?? "User");
          const pickup = (booking.pickupAddress as { street?: string } | undefined)?.street ?? booking.request?.pickupAddress ?? "Pickup";
          const destination =
            (booking.destinationAddress as { street?: string } | undefined)?.street ??
            booking.request?.destinationAddress ??
            "Drop-off";

          return {
            bookingId: booking.id,
            partner: partnerUser,
            partnerName,
            routePreview: `${pickup} → ${destination}`,
            bookingStatus: booking.status,
            hasDispute: db.disputes.some((d) => d.bookingId === booking.id && d.status === "open"),
            disputeId: db.disputes.find((d) => d.bookingId === booking.id)?.id ?? null,
            unreadCount,
            lastMessage: lastMessage
              ? {
                  id: lastMessage.id,
                  content: lastMessage.content,
                  senderId: lastMessage.senderId,
                  isSystem: lastMessage.isSystem,
                  createdAt: lastMessage.createdAt,
                }
              : null,
            updatedAt: lastMessage?.createdAt ?? booking.updatedAt ?? booking.createdAt,
          };
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

      return conversations;
    },
  },
  {
    method: "GET",
    path: "/bookings/:id/messages",
    handler: (p) =>
      getDb()
        .messages.filter((m) => m.bookingId === p.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  },
  {
    method: "POST",
    path: "/bookings/:id/messages",
    handler: (p, body, ctx) => {
      const user = requireUser(ctx);
      const message: Message = {
        id: mockId("msg"),
        bookingId: p.id,
        senderId: user.id,
        content: String(body.content ?? ""),
        messageType: (body.messageType as Message["messageType"]) ?? (body.attachmentUrl ? "image" : "text"),
        attachmentUrl: body.attachmentUrl ? String(body.attachmentUrl) : null,
        attachmentMimeType: body.attachmentMimeType ? String(body.attachmentMimeType) : null,
        isRead: false,
        createdAt: nowIso(),
      };
      getDb().messages.push(message);
      persist();
      const booking = getDb().bookings.find((b) => b.id === p.id);
      if (booking?.moverId && booking.moverId !== user.id) scheduleAutoReply(p.id, booking.moverId);
      return message;
    },
  },
  {
    method: "PATCH",
    path: "/bookings/:id/messages/read",
    handler: (p, _b, ctx) => {
      const user = requireUser(ctx);
      getDb()
        .messages.filter((m) => m.bookingId === p.id && m.senderId !== user.id)
        .forEach((m) => (m.isRead = true));
      persist();
      return { message: "ok" };
    },
  },

  /* MOVERS */
  {
    method: "POST",
    path: "/movers/profile",
    handler: (_p, body, ctx) => upsertMoverProfile(requireUser(ctx), body),
  },
  {
    method: "PUT",
    path: "/movers/profile",
    handler: (_p, body, ctx) => upsertMoverProfile(requireUser(ctx), body),
  },
  {
    method: "GET",
    path: "/movers/profile",
    handler: (_p, _b, ctx) => {
      const user = requireUser(ctx);
      if (!user.moverProfile) throw new ApiError(404, ["Mover profile not found"]);
      return user.moverProfile;
    },
  },
  {
    method: "PUT",
    path: "/movers/presence",
    handler: (_p, body, ctx) => {
      const user = requireUser(ctx);
      if (user.moverProfile) {
        if (body.latitude != null) user.moverProfile.latitude = Number(body.latitude);
        if (body.longitude != null) user.moverProfile.longitude = Number(body.longitude);
        user.moverProfile.updatedAt = nowIso();
      }
      persist();
      return user.moverProfile;
    },
  },
  {
    method: "GET",
    path: "/movers/available-requests",
    handler: (_p, _b, ctx) => {
      const user = requireUser(ctx);
      return getDb()
        .requests.filter((r) => r.status === "open" && !getDb().quotes.some((q) => q.requestId === r.id && q.moverId === user.id))
        .map(joinRequest);
    },
  },
  {
    method: "POST",
    path: "/movers/requests/:requestId/quote",
    handler: (p, body, ctx) => {
      const user = requireUser(ctx);
      const quote: Quote = {
        id: mockId("quote"),
        price: Number(body.price ?? 0),
        estimatedHours: body.estimatedHours != null ? Number(body.estimatedHours) : null,
        notes: (body.notes as string) ?? null,
        status: "pending",
        requestId: p.requestId,
        moverId: user.id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().quotes.push(quote);
      persist();
      return joinQuote(quote);
    },
  },
  {
    method: "POST",
    path: "/movers/quotes/:quoteId/counteroffer",
    handler: (p, body, ctx) => {
      const user = requireUser(ctx);
      const quote = findQuoteOr404(p.quoteId);
      quote.status = "countered";
      quote.updatedAt = nowIso();
      const counter: QuoteCounteroffer = {
        id: mockId("counter"),
        quoteId: quote.id,
        authorId: user.id,
        authorRole: "mover",
        price: Number(body.price ?? quote.price),
        notes: (body.notes as string) ?? null,
        status: "pending",
        createdAt: nowIso(),
      };
      getDb().counteroffers.push(counter);
      persist();
      return counter;
    },
  },
  {
    method: "POST",
    path: "/movers/quotes/:quoteId/counteroffer/respond",
    handler: (p, body) => {
      const quote = findQuoteOr404(p.quoteId);
      const counters = getDb().counteroffers.filter((c) => c.quoteId === quote.id);
      const latest = counters[counters.length - 1];
      if (latest) {
        latest.status = body.accept ? "accepted" : "rejected";
        if (body.accept) quote.price = latest.price;
      }
      quote.status = body.accept ? "pending" : quote.status;
      quote.updatedAt = nowIso();
      persist();
      return { quote: joinQuote(quote), counteroffer: latest };
    },
  },
  {
    method: "GET",
    path: "/movers/bookings",
    handler: (_p, _b, ctx) => {
      const user = requireUser(ctx);
      return getDb()
        .bookings.filter((b) => b.moverId === user.id)
        .map(joinBooking);
    },
  },
  {
    method: "GET",
    path: "/movers/wallet",
    handler: (_p, _b, ctx) => {
      const user = requireUser(ctx);
      const db = getDb();
      const bookings = db.bookings.filter((b) => b.moverId === user.id);
      const bookingIds = bookings.map((b) => b.id);
      const payments = db.payments.filter(
        (p) => bookingIds.includes(p.bookingId) && p.status === "completed",
      );
      let jobGross = 0;
      let tipGross = 0;
      let platformFees = 0;
      const rows = payments.map((p) => {
        const amount = Number(p.amount);
        const fee = Number(p.platformCommission);
        const bookingRefunds = db.disputes
          .filter((d) => d.bookingId === p.bookingId)
          .reduce((sum, d) => sum + Number(d.refundAmount ?? 0), 0);
        const refundRatio = amount > 0 ? Math.min(bookingRefunds / amount, 1) : 0;
        const net = Number(((amount - fee) * (1 - refundRatio)).toFixed(2));
        if (p.kind === "tip") tipGross += amount;
        else jobGross += amount;
        platformFees += fee;
        const booking = db.bookings.find((b) => b.id === p.bookingId);
        const customer = booking ? db.users.find((u) => u.id === booking.customerId) : undefined;
        const request = booking?.requestId ? db.requests.find((r) => r.id === booking.requestId) : undefined;
        return {
          id: p.id,
          bookingId: p.bookingId,
          kind: p.kind ?? "job",
          amount,
          platformCommission: fee,
          net,
          status: p.status,
          transactionRef: p.transactionRef,
          invoiceNumber: p.invoiceNumber,
          createdAt: p.createdAt,
          customerName: customer?.customerProfile
            ? `${customer.customerProfile.firstName} ${customer.customerProfile.lastName}`.trim()
            : customer?.email ?? "Customer",
          route: booking
            ? {
                pickup: (booking.pickupAddress as { street?: string } | undefined)?.street ?? request?.pickupAddress ?? "Pickup",
                destination: (booking.destinationAddress as { street?: string } | undefined)?.street ?? request?.destinationAddress ?? "Drop-off",
              }
            : null,
        };
      });
      const lifetimeGross = jobGross + tipGross;
      let availableBalance = db.moverWalletBalances[user.id];
      if (availableBalance == null) {
        availableBalance = Number(
          rows.reduce((sum, row) => sum + Number(row.net), 0).toFixed(2),
        );
        db.moverWalletBalances[user.id] = availableBalance;
        persist();
      }
      return {
        availableBalance: Number(availableBalance.toFixed(2)),
        lifetimeEarnings: Number(lifetimeGross.toFixed(2)),
        jobEarnings: Number(jobGross.toFixed(2)),
        tipEarnings: Number(tipGross.toFixed(2)),
        platformFees: Number(platformFees.toFixed(2)),
        pendingJobs: bookings.filter((b) => ["confirmed", "in_progress"].includes(b.status)).length,
        completedJobs: bookings.filter((b) => b.status === "completed").length,
        payments: rows.reverse(),
        statement: buildMoverStatement(user.id, Number(availableBalance.toFixed(2))),
      };
    },
  },
  {
    method: "GET",
    path: "/movers/payments/:paymentId/invoice",
    handler: (p, _b, ctx) => {
      const user = requireUser(ctx);
      const db = getDb();
      const payment = db.payments.find((pay) => pay.id === p.paymentId);
      if (!payment || payment.status !== "completed") throw new ApiError(404, ["Payment not found"]);
      const booking = db.bookings.find((b) => b.id === payment.bookingId);
      if (!booking || booking.moverId !== user.id) throw new ApiError(403, ["Access denied"]);
      const request = booking.requestId ? db.requests.find((r) => r.id === booking.requestId) : undefined;
      const customer = db.users.find((u) => u.id === booking.customerId);
      const amount = Number(payment.amount);
      const platformFee = Number(payment.platformCommission);
      const kind = payment.kind ?? "job";
      const pickup = (booking.pickupAddress as { street?: string } | undefined)?.street ?? request?.pickupAddress ?? "Pickup";
      const destination = (booking.destinationAddress as { street?: string } | undefined)?.street ?? request?.destinationAddress ?? "Drop-off";
      return {
        invoiceNumber: payment.invoiceNumber ?? `INV-${payment.id.slice(0, 8).toUpperCase()}`,
        bookingId: booking.id,
        kind,
        status: "paid",
        issuedAt: payment.createdAt,
        dueAt: booking.scheduledDate ?? request?.movingDate ?? null,
        customer: {
          name: customer?.customerProfile
            ? `${customer.customerProfile.firstName} ${customer.customerProfile.lastName}`.trim()
            : customer?.email,
          email: customer?.email ?? null,
          phone: customer?.customerProfile?.phone ?? null,
        },
        mover: { name: user.moverProfile?.businessName ?? user.email, phone: user.moverProfile?.phone ?? null },
        route: { pickup, destination },
        lineItems: [
          {
            label: kind === "tip" ? "Tip from customer" : "Moving service",
            description: `${pickup} → ${destination}`,
            quantity: 1,
            unitPrice: amount,
            amount,
          },
          {
            label: "Platform fee (10%)",
            description: "Deducted from your payout",
            quantity: 1,
            unitPrice: -platformFee,
            amount: -platformFee,
          },
        ],
        subtotal: amount,
        tax: 0,
        total: amount,
        platformFee,
        netEarnings: Number((amount - platformFee).toFixed(2)),
        viewerRole: "mover",
        alreadyPaid: true,
        paymentId: payment.id,
        paidAt: payment.createdAt,
      };
    },
  },
  {
    method: "POST",
    path: "/movers/bookings/:bookingId/accept",
    handler: (p) => {
      const booking = findBookingOr404(p.bookingId);
      booking.status = "confirmed";
      booking.updatedAt = nowIso();
      persist();
      return joinBooking(booking);
    },
  },
  {
    method: "POST",
    path: "/movers/bookings/:bookingId/update-status",
    handler: (p, body) => {
      const booking = findBookingOr404(p.bookingId);
      booking.status = String(body.status ?? booking.status);
      booking.updatedAt = nowIso();
      getDb().trackingEvents.push({
        id: mockId("track"),
        bookingId: booking.id,
        type: "status",
        status: String(body.status ?? booking.status),
        note: (body.note as string) ?? null,
        createdAt: nowIso(),
      });
      persist();
      return joinBooking(booking);
    },
  },
  {
    method: "POST",
    path: "/movers/bookings/:bookingId/tracking",
    handler: (p, body) => {
      const event: TrackingEvent = {
        id: mockId("track"),
        bookingId: p.bookingId,
        type: String(body.type ?? "status"),
        status: String(body.status ?? ""),
        note: (body.note as string) ?? null,
        latitude: body.latitude != null ? Number(body.latitude) : null,
        longitude: body.longitude != null ? Number(body.longitude) : null,
        createdAt: nowIso(),
      };
      getDb().trackingEvents.push(event);
      const booking = getDb().bookings.find((b) => b.id === p.bookingId);
      if (booking && event.latitude != null && event.longitude != null) {
        booking.currentLatitude = event.latitude;
        booking.currentLongitude = event.longitude;
      }
      persist();
      return event;
    },
  },
  {
    method: "GET",
    path: "/movers/bookings/:bookingId/tracking",
    handler: (p) =>
      getDb()
        .trackingEvents.filter((t) => t.bookingId === p.bookingId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  },

  /* PUBLIC */
  { method: "GET", path: "/vehicle-types", handler: () => getDb().vehicleTypes },
  {
    method: "GET",
    path: "/vehicle-types/:id",
    handler: (p) => {
      const type = getDb().vehicleTypes.find((v) => v.id === p.id);
      if (!type) throw new ApiError(404, ["Vehicle type not found"]);
      return type;
    },
  },
  {
    method: "POST",
    path: "/vehicle-recommendations/calculate",
    handler: (_p, body) => {
      const items = (body.items as Array<{ quantity?: number }>) ?? [];
      const distanceKm = Number(body.distanceKm ?? 10);
      const totalQty = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);
      const weightKg = totalQty * 20;
      const volumeM3 = totalQty * 0.3;
      const types = getDb().vehicleTypes;
      const vehicleType: VehicleType =
        types.find((t) => (t.maxWeightKg ?? Infinity) >= weightKg && (t.maxVolumeM3 ?? Infinity) >= volumeM3) ??
        types[types.length - 1];
      return {
        totals: { weightKg, volumeM3 },
        vehicleType,
        estimatedPrice: estimateLocalPrice(distanceKm, vehicleType.basePrice, vehicleType.pricePerKm),
        alternatives: types.filter((t) => t.id !== vehicleType.id),
      };
    },
  },
  {
    method: "GET",
    path: "/zones/check",
    handler: () => ({ covered: true, zones: [] }),
  },
  {
    method: "GET",
    path: "/zones/pricing",
    handler: (_p, _b, ctx) => {
      const distanceKm = ctx.query.get("distanceKm");
      return { total: estimateLocalPrice(distanceKm ? Number(distanceKm) : null) };
    },
  },
  {
    method: "GET",
    path: "/movers/nearby",
    handler: (_p, _b, ctx) => {
      const latitude = Number(ctx.query.get("latitude"));
      const longitude = Number(ctx.query.get("longitude"));
      const vehicleTypeId = ctx.query.get("vehicleTypeId") ?? undefined;
      const sortBy = (ctx.query.get("sortBy") as NearbyMoversSortBy) ?? "distance";
      const center: LatLng = Number.isFinite(latitude) && Number.isFinite(longitude) ? { lat: latitude, lng: longitude } : DEFAULT_MAP_CENTER;

      const moverUsers = getDb().users.filter((u) => u.roles.includes("mover"));
      const withPositions = moverUsers.map((u, i) => {
        const pos = offsetFrom(center, i);
        const seedTypes = moverSeedVehicleTypeIds(u.moverProfile?.businessName);
        return { user: u, pos, vehicleTypeIds: seedTypes };
      });

      const filtered = vehicleTypeId ? withPositions.filter((m) => m.vehicleTypeIds.includes(vehicleTypeId)) : withPositions;

      const movers = filtered.map((m) => {
        const distanceKm = haversineKm({ address: "", lat: center.lat, lng: center.lng }, { address: "", lat: m.pos.lat, lng: m.pos.lng }) ?? 0;
        const type = getDb().vehicleTypes.find((t) => m.vehicleTypeIds.includes(t.id));
        return {
          id: m.user.id,
          businessName: m.user.moverProfile?.businessName ?? "Mover",
          avatarUrl: m.user.moverProfile?.avatarUrl ?? null,
          vehicleTypes: getDb()
            .vehicleTypes.filter((t) => m.vehicleTypeIds.includes(t.id))
            .map((t) => ({ id: t.id, name: t.name })),
          latitude: m.pos.lat,
          longitude: m.pos.lng,
          distanceKm: Math.round(distanceKm * 10) / 10,
          estimatedFrom: type ? Math.round(estimateLocalPrice(distanceKm, type.basePrice, type.pricePerKm)) : Math.round(estimateLocalPrice(distanceKm)),
          estimatedMinutes: Math.round(distanceKm * 2 + 5),
          averageRating: 4.5 + Math.random() * 0.5,
          completedMoves: 100 + Math.round(Math.random() * 400),
        };
      });

      const sorted = [...movers].sort((a, b) => {
        if (sortBy === "price") return a.estimatedFrom - b.estimatedFrom;
        if (sortBy === "rating") return b.averageRating - a.averageRating;
        if (sortBy === "arrival") return a.estimatedMinutes - b.estimatedMinutes;
        return a.distanceKm - b.distanceKm;
      });

      return {
        summary: {
          total: sorted.length,
          onlineCount: sorted.length,
          averageArrivalMinutes: sorted.length ? Math.round(sorted.reduce((s, m) => s + m.estimatedMinutes, 0) / sorted.length) : 0,
        },
        movers: sorted,
        pagination: { limit: 20, offset: 0, hasMore: false },
      };
    },
  },

  /* USERS */
  { method: "GET", path: "/users/profile", handler: (_p, _b, ctx) => requireUser(ctx) },
  {
    method: "PATCH",
    path: "/users/profile",
    handler: (_p, body, ctx) => {
      const user = requireUser(ctx);
      if (user.customerProfile) {
        if (body.firstName != null) user.customerProfile.firstName = String(body.firstName);
        if (body.lastName != null) user.customerProfile.lastName = String(body.lastName);
        if (body.phone != null) user.customerProfile.phone = String(body.phone);
        if (body.avatarUrl != null) user.customerProfile.avatarUrl = String(body.avatarUrl);
        user.customerProfile.updatedAt = nowIso();
      }
      user.updatedAt = nowIso();
      persist();
      return user;
    },
  },
  {
    method: "GET",
    path: "/saved-addresses",
    handler: (_p, _b, ctx) => getDb().savedAddresses.filter((a) => a.userId === requireUser(ctx).id),
  },
  {
    method: "GET",
    path: "/saved-addresses/default",
    handler: (_p, _b, ctx) => {
      const found = getDb().savedAddresses.find((a) => a.userId === requireUser(ctx).id && a.isDefault);
      if (!found) throw new ApiError(404, ["No default address"]);
      return found;
    },
  },
  {
    method: "POST",
    path: "/saved-addresses",
    handler: (_p, body, ctx) => {
      const user = requireUser(ctx);
      const address: SavedAddress = {
        id: mockId("addr"),
        userId: user.id,
        label: String(body.label ?? "Address"),
        street: String(body.street ?? ""),
        city: String(body.city ?? ""),
        province: (body.province as string) ?? null,
        postalCode: (body.postalCode as string) ?? null,
        country: (body.country as string) ?? null,
        latitude: body.latitude != null ? Number(body.latitude) : null,
        longitude: body.longitude != null ? Number(body.longitude) : null,
        instructions: (body.instructions as string) ?? null,
        isDefault: Boolean(body.isDefault),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().savedAddresses.push(address);
      persist();
      return address;
    },
  },
  {
    method: "GET",
    path: "/notifications",
    handler: (_p, _b, ctx) => getDb().notifications.filter((n) => n.userId === requireUser(ctx).id),
  },
  {
    method: "PATCH",
    path: "/notifications/:id/read",
    handler: (p) => {
      const notification = getDb().notifications.find((n) => n.id === p.id);
      if (!notification) throw new ApiError(404, ["Notification not found"]);
      notification.isRead = true;
      persist();
      return notification;
    },
  },
  {
    method: "PATCH",
    path: "/notifications/read-all",
    handler: (_p, _b, ctx) => {
      const user = requireUser(ctx);
      getDb()
        .notifications.filter((n) => n.userId === user.id)
        .forEach((n) => (n.isRead = true));
      persist();
      return { message: "ok" };
    },
  },
  {
    method: "POST",
    path: "/notifications/push-subscriptions",
    handler: (_p, body, ctx) => ({
      id: `push-${requireUser(ctx).id}`,
      userId: requireUser(ctx).id,
      ...body,
    }),
  },
  {
    method: "DELETE",
    path: "/notifications/push-subscriptions",
    handler: () => ({ message: "Push subscription removed" }),
  },

  /* UPLOADS */
  {
    method: "POST",
    path: "/uploads",
    handler: (_p, body) => {
      const formData = body as unknown as FormData;
      const file = typeof formData?.get === "function" ? (formData.get("file") as File | null) : null;
      if (!file) throw new ApiError(400, ["No file provided"]);
      return { url: URL.createObjectURL(file), filename: file.name };
    },
  },

  /* ADMIN */
  {
    method: "GET",
    path: "/admin/analytics",
    handler: () => {
      const db = getDb();
      const completed = db.bookings.filter((b) => b.status === "completed");
      const totalRevenue = completed.reduce((s, b) => s + b.price, 0);
      return {
        users: {
          total: db.users.length,
          customers: db.users.filter((u) => u.roles.includes("customer")).length,
          movers: db.users.filter((u) => u.roles.includes("mover")).length,
        },
        marketplace: {
          requests: db.requests.length,
          quotes: db.quotes.length,
          bookings: db.bookings.length,
          completedBookings: completed.length,
        },
        revenue: { totalRevenue, totalCommission: Math.round(totalRevenue * 0.15 * 100) / 100 },
        quality: {
          totalReviews: db.reviews.length,
          averageRating: db.reviews.length ? db.reviews.reduce((s, r) => s + r.rating, 0) / db.reviews.length : 0,
          openDisputes: db.disputes.filter((d) => d.status === "open").length,
        },
      };
    },
  },
  { method: "GET", path: "/admin/users", handler: () => getDb().users },
  {
    method: "PUT",
    path: "/admin/users/:userId/documents/:type/review",
    handler: (p, body) => {
      const user = getDb().users.find((u) => u.id === p.userId);
      if (!user) throw new ApiError(404, ["User not found"]);
      if (!user.moverProfile) throw new ApiError(400, ["User is not a mover"]);
      const status = String(body.status ?? "");
      if (!["pending", "verified", "rejected"].includes(status)) {
        throw new ApiError(400, ["Invalid document status"]);
      }
      const docs = user.moverProfile.documents ?? [];
      const idx = docs.findIndex((d) => d.type === p.type);
      if (idx < 0 || !docs[idx]?.url) {
        throw new ApiError(400, [`Document "${p.type}" has not been uploaded yet`]);
      }
      docs[idx] = { ...docs[idx], status };
      user.moverProfile.documents = [...docs];
      if (status !== "verified") user.moverProfile.isVerified = false;
      user.updatedAt = nowIso();
      persist();
      return user;
    },
  },
  {
    method: "PUT",
    path: "/admin/users/:userId/verify",
    handler: (p) => {
      const user = getDb().users.find((u) => u.id === p.userId);
      if (!user) throw new ApiError(404, ["User not found"]);
      const required = ["licence", "insurance", "vehiclePhoto"];
      if (user.moverProfile) {
        const docs = user.moverProfile.documents ?? [];
        const missing = required.filter((t) => !docs.some((d) => d.type === t && d.url));
        if (missing.length) {
          throw new ApiError(400, [
            `Cannot verify mover until all documents are uploaded. Missing: ${missing.join(", ")}`,
          ]);
        }
        const pending = required.filter(
          (t) => docs.find((d) => d.type === t)?.status !== "verified",
        );
        if (pending.length) {
          throw new ApiError(400, [
            `Cannot verify mover until each document is verified. Still pending: ${pending.join(", ")}`,
          ]);
        }
        user.moverProfile.isVerified = true;
        user.moverProfile.documents = docs.map((d) =>
          required.includes(d.type) ? { ...d, status: "verified" } : d,
        );
      }
      user.isVerified = true;
      user.updatedAt = nowIso();
      persist();
      return user;
    },
  },
  { method: "GET", path: "/admin/bookings", handler: () => getDb().bookings.map(joinBooking) },
  {
    method: "GET",
    path: "/admin/transactions",
    handler: () => {
      const db = getDb();
      const entries: Array<ReturnType<typeof buildCustomerStatement>["entries"][number] & { userId: string; accountType: "customer" | "mover" }> = [];
      for (const user of db.users) {
        if (user.roles.includes("customer")) {
          const statement = buildCustomerStatement(user.id, db.walletBalances[user.id] ?? 0);
          for (const entry of statement.entries) {
            entries.push({ ...entry, userId: user.id, accountType: "customer" });
          }
        }
        if (user.roles.includes("mover")) {
          const statement = buildMoverStatement(user.id, db.moverWalletBalances[user.id] ?? 0);
          for (const entry of statement.entries) {
            entries.push({ ...entry, userId: user.id, accountType: "mover" });
          }
        }
      }
      return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  },
  { method: "GET", path: "/admin/disputes", handler: () => getDb().disputes },
  {
    method: "POST",
    path: "/admin/disputes/:disputeId/refund",
    handler: (p, body) => {
      const db = getDb();
      const dispute = db.disputes.find((d) => d.id === p.disputeId);
      if (!dispute) throw new ApiError(404, ["Dispute not found"]);
      const amount = Number(body.amount ?? 0);
      if (amount <= 0) throw new ApiError(400, ["Refund amount must be greater than zero"]);

      const booking = db.bookings.find((b) => b.id === dispute.bookingId);
      const payment = db.payments.find(
        (pay) =>
          pay.bookingId === dispute.bookingId &&
          pay.kind !== "tip" &&
          pay.status === "completed",
      );
      if (!payment) throw new ApiError(400, ["No completed payment found for this booking"]);

      const priorRefund = Number(dispute.refundAmount ?? 0);
      const maxRefund = Number(payment.amount);
      if (priorRefund + amount > maxRefund) {
        throw new ApiError(400, [`Total refund cannot exceed $${maxRefund.toFixed(2)}`]);
      }

      const customerId = booking?.customerId;
      if (customerId) {
        const nextCustomer = Number(((db.walletBalances[customerId] ?? 0) + amount).toFixed(2));
        db.walletBalances[customerId] = nextCustomer;
      }

      const moverDeduction = Number((amount * 0.9).toFixed(2));
      if (booking?.moverId) {
        const nextMover = Number(((db.moverWalletBalances[booking.moverId] ?? 0) - moverDeduction).toFixed(2));
        db.moverWalletBalances[booking.moverId] = nextMover;
      }

      if (priorRefund + amount >= maxRefund) {
        payment.status = "refunded";
      }

      dispute.refundAmount = Number((priorRefund + amount).toFixed(2));
      dispute.updatedAt = nowIso();
      persist();
      return {
        dispute,
        balance: customerId ? db.walletBalances[customerId] : 0,
        refundedAmount: amount,
        moverDeduction,
        moverBalance: booking?.moverId ? db.moverWalletBalances[booking.moverId] : null,
      };
    },
  },
  {
    method: "POST",
    path: "/admin/disputes/:disputeId/resolve",
    handler: (p, body) => {
      const dispute = getDb().disputes.find((d) => d.id === p.disputeId);
      if (!dispute) throw new ApiError(404, ["Dispute not found"]);
      dispute.status = "resolved";
      dispute.resolution = String(body.resolution ?? "");
      dispute.updatedAt = nowIso();
      persist();
      return dispute;
    },
  },
  {
    method: "POST",
    path: "/admin/promotions",
    handler: (_p, body) => {
      const promotion: Promotion = {
        id: mockId("promo"),
        code: String(body.code ?? ""),
        title: String(body.title ?? ""),
        description: (body.description as string) ?? null,
        discountPercent: body.discountPercent != null ? Number(body.discountPercent) : null,
        discountAmount: body.discountAmount != null ? Number(body.discountAmount) : null,
        validFrom: String(body.validFrom ?? nowIso()),
        validTo: String(body.validTo ?? nowIso()),
        isActive: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      getDb().promotions.push(promotion);
      persist();
      return promotion;
    },
  },
  { method: "GET", path: "/admin/promotions", handler: () => getDb().promotions },
  {
    method: "POST",
    path: "/admin/payments/:paymentId/refund",
    handler: (p) => {
      const payment = getDb().payments.find((pay) => pay.id === p.paymentId);
      if (!payment) throw new ApiError(404, ["Payment not found"]);
      payment.status = "refunded";
      payment.updatedAt = nowIso();
      persist();
      return { message: "Refund issued" };
    },
  },

  /* BUSINESS */
  {
    method: "POST",
    path: "/business/leads",
    handler: (_p, body) => {
      getDb().businessLeads.push({
        id: mockId("lead"),
        companyName: String(body.company ?? body.companyName ?? ""),
        contactName: String(body.contactName ?? ""),
        email: String(body.workEmail ?? body.email ?? ""),
        phone: (body.phone as string) ?? undefined,
        message: (body.message as string) ?? undefined,
        movesPerMonth: (body.movesPerMonth as string) ?? undefined,
        createdAt: nowIso(),
      });
      persist();
      return { message: "Thanks — a specialist will reach out within one business day." };
    },
  },

  /* MOVER CASH-OUT */
  {
    method: "POST",
    path: "/movers/wallet/cash-out",
    handler: (_p, body, ctx) => {
      const user = requireUser(ctx);
      const amount = Number(body.amount ?? 0);
      if (!(amount > 0)) throw new ApiError(400, ["Amount must be greater than zero"]);
      const balance = getDb().moverWalletBalances[user.id] ?? 0;
      if (amount > balance) throw new ApiError(400, [`Insufficient wallet balance. Available: $${balance.toFixed(2)}`]);
      const request = {
        id: mockId("cashout"),
        moverId: user.id,
        amount,
        status: "pending" as const,
        bankNote: (body.bankNote as string) || undefined,
        createdAt: nowIso(),
      };
      const db = getDb();
      if (!db.cashOutRequests) db.cashOutRequests = [];
      db.cashOutRequests.push(request);
      persist();
      return request;
    },
  },
];

function upsertMoverProfile(user: User, body: Record<string, unknown>) {
  const existing = user.moverProfile;
  user.moverProfile = {
    id: existing?.id ?? mockId("mover"),
    businessName: String(body.businessName ?? existing?.businessName ?? ""),
    phone: (body.phone as string) ?? existing?.phone ?? null,
    bio: (body.bio as string) ?? existing?.bio ?? null,
    isVerified: existing?.isVerified ?? false,
    avatarUrl: (body.avatarUrl as string) ?? existing?.avatarUrl ?? null,
    serviceAreas: (body.serviceAreas as string[]) ?? existing?.serviceAreas ?? [],
    documents: (body.documents as Array<{ type: string; url: string }>) ?? existing?.documents ?? [],
    availability: (body.availability as { days: string[]; hours: string }) ?? existing?.availability ?? null,
    latitude: body.latitude != null ? Number(body.latitude) : existing?.latitude ?? null,
    longitude: body.longitude != null ? Number(body.longitude) : existing?.longitude ?? null,
    userId: user.id,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  persist();
  return user.moverProfile;
}

function moverSeedVehicleTypeIds(businessName?: string): string[] {
  const map: Record<string, string[]> = {
    "Northline Movers": ["vt_van", "vt_box"],
    "Quickhaul Co.": ["vt_pickup"],
    "CityVan Express": ["vt_van"],
    "Big Load Bros": ["vt_box"],
    "SwiftSUV Moves": ["vt_suv"],
    "Metro Muscle Moving": ["vt_van", "vt_pickup"],
  };
  return businessName ? map[businessName] ?? ["vt_van"] : ["vt_van"];
}

/* ---------------- dispatcher ---------------- */

function parseBody(raw: RequestInit["body"]): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return raw as unknown as Record<string, unknown>;
}

export async function mockRequest<T>(path: string, options: RequestInit, token: string | null): Promise<T> {
  const [pathname, search] = path.split("?");
  const query = new URLSearchParams(search ?? "");
  const method = (options.method ?? "GET").toUpperCase();
  const body = parseBody(options.body ?? null);
  const currentUser = getDb().users.find((u) => u.id === userIdFromToken(token)) ?? null;

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = matchPath(route.path, pathname);
    if (!match) continue;
    const result = await route.handler(match.params, body, { currentUser, query });
    return delay(result) as Promise<T>;
  }
  throw new ApiError(404, [`Mock route not found: ${method} ${pathname}`]);
}
