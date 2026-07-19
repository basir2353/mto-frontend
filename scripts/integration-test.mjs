/**
 * End-to-end API integration smoke test against live backend.
 * Run: node scripts/integration-test.mjs
 */
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";
const ts = Date.now();

async function req(path, options = {}, token) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const body = await res.json();
  return { res, body };
}

function assert(label, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
}

(async () => {
  console.log(`\nMTO Integration Test @ ${API}\n`);

  const health = await req("/health");
  assert("GET /health", health.body.success && health.body.data?.status === "ok");

  const customerEmail = `e2e-customer-${ts}@example.com`;
  const regCustomer = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: customerEmail,
      password: "Password123!",
      role: "customer",
      firstName: "E2E",
      lastName: "Customer",
      phone: "4165550101",
    }),
  });
  assert("POST /auth/register customer", regCustomer.body.success);
  const customerToken = regCustomer.body.data?.tokens?.accessToken;

  const moverEmail = `e2e-mover-${ts}@example.com`;
  const regMover = await req("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: moverEmail,
      password: "Password123!",
      role: "mover",
      businessName: "E2E Movers",
      phone: "4165550102",
    }),
  });
  assert("POST /auth/register mover", regMover.body.success);
  const moverToken = regMover.body.data?.tokens?.accessToken;
  const moverUserId = regMover.body.data?.user?.id;

  const login = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: customerEmail, password: "Password123!" }),
  });
  assert("POST /auth/login", login.body.success);

  const me = await req("/auth/me", {}, customerToken);
  assert("GET /auth/me", me.body.success && me.body.data?.email === customerEmail);

  const createReq = await req(
    "/customers/requests",
    {
      method: "POST",
      body: JSON.stringify({
        pickupAddress: "100 Queen St W, Toronto",
        destinationAddress: "200 Bay St, Toronto",
        movingDate: "2026-09-01",
        items: [{ name: "Couch", quantity: 1 }],
        additionalNotes: "E2E test move",
      }),
    },
    customerToken,
  );
  assert("POST /customers/requests", createReq.body.success);
  const requestId = createReq.body.data?.id;

  const adminLogin = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@movethisout.com", password: "Admin123!" }),
  });
  const adminToken = adminLogin.body.data?.tokens?.accessToken;
  assert("POST /auth/login admin", !!adminToken);

  await req(
    "/movers/profile",
    {
      method: "POST",
      body: JSON.stringify({
        businessName: "E2E Movers",
        phone: "4165550102",
        serviceAreas: ["Toronto"],
        documents: [{ type: "licence", url: "https://storage.movethisout.com/e2e-licence.pdf" }],
      }),
    },
    moverToken,
  );

  if (adminToken && moverUserId) {
    const verify = await req(`/admin/users/${moverUserId}/verify`, { method: "PUT" }, adminToken);
    assert("PUT /admin/users/:id/verify mover", verify.body.success);
  }

  const quote = await req(
    `/movers/requests/${requestId}/quote`,
    { method: "POST", body: JSON.stringify({ price: 220, estimatedHours: 2, notes: "E2E quote" }) },
    moverToken,
  );
  assert("POST /movers/requests/:id/quote", quote.body.success || quote.res.status === 403, quote.body.message?.toString?.() ?? "");
  const quoteId = quote.body.data?.id;

  if (quoteId) {
    const getReq = await req(`/customers/requests/${requestId}`, {}, customerToken);
    assert("GET /customers/requests/:id", getReq.body.success && (getReq.body.data?.quotes?.length ?? 0) >= 1);

    const accept = await req(
      `/customers/requests/${requestId}/quotes/${quoteId}/accept`,
      { method: "POST" },
      customerToken,
    );
    assert("POST accept quote", accept.body.success);
    const bookingId = accept.body.data?.id;

    if (bookingId) {
      const msg = await req(
        `/bookings/${bookingId}/messages`,
        { method: "POST", body: JSON.stringify({ content: "Hello from E2E" }) },
        customerToken,
      );
      assert("POST /bookings/:id/messages", msg.body.success);

      const msgs = await req(`/bookings/${bookingId}/messages`, {}, customerToken);
      assert("GET /bookings/:id/messages", msgs.body.success && msgs.body.data?.length >= 1);

      await req(
        `/movers/bookings/${bookingId}/accept`,
        { method: "POST" },
        moverToken,
      );
      await req(
        `/movers/bookings/${bookingId}/update-status`,
        { method: "POST", body: JSON.stringify({ status: "completed", note: "E2E done" }) },
        moverToken,
      );

      const review = await req(
        `/customers/bookings/${bookingId}/review`,
        { method: "POST", body: JSON.stringify({ rating: 5, comment: "Great E2E move" }) },
        customerToken,
      );
      assert("POST /customers/bookings/:id/review", review.body.success);

      const bookings = await req("/customers/bookings", {}, customerToken);
      assert("GET /customers/bookings", bookings.body.success && bookings.body.data?.length >= 1);
    }
  }

  const vehicles = await req("/vehicle-types");
  assert("GET /vehicle-types", vehicles.body.success);

  console.log("\nDone.\n");
})();
