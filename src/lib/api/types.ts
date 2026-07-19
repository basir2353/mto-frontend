export type UserRole = "customer" | "mover" | "admin";

export type UserStatistics = {
  userId: string;
  movingRequests: number;
  bookings: number;
};

export type UserActivity = {
  userId: string;
  activities: Array<{ type: string; description: string; createdAt: string }>;
  message?: string;
};

export type CustomerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  address?: Record<string, unknown> | null;
  preferences?: Record<string, unknown>;
  language?: string;
  notificationSettings?: Record<string, unknown>;
  privacy?: Record<string, unknown>;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type MoverProfile = {
  id: string;
  businessName: string;
  phone?: string | null;
  bio?: string | null;
  isVerified: boolean;
  avatarUrl?: string | null;
  serviceAreas: string[];
  documents: Array<{ type: string; url: string; status?: string }>;
  availability?: { days: string[]; hours: string } | null;
  latitude?: number | null;
  longitude?: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  customerProfile?: CustomerProfile | null;
  moverProfile?: MoverProfile | null;
};

export type AuthTokens = { accessToken: string; refreshToken: string };

export type RequestItem = { name: string; quantity?: number; description?: string };

export type MovingRequest = {
  id: string;
  pickupAddress: string;
  destinationAddress: string;
  movingDate: string;
  items: RequestItem[];
  additionalNotes?: string | null;
  estimatedPrice?: number | null;
  distanceKm?: number | null;
  status: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  quotes?: Quote[];
  customer?: User;
};

export type QuoteCounteroffer = {
  id: string;
  quoteId: string;
  authorId: string;
  authorRole: string;
  price: number;
  notes?: string | null;
  status: string;
  createdAt: string;
};

export type Quote = {
  id: string;
  price: number;
  estimatedHours?: number | null;
  notes?: string | null;
  status: string;
  requestId: string;
  moverId: string;
  createdAt: string;
  updatedAt: string;
  mover?: User;
  counteroffers?: QuoteCounteroffer[];
};

export type BookingItem = {
  id: string;
  bookingId: string;
  name: string;
  quantity?: number;
  weightKg?: number | null;
  volumeM3?: number | null;
  description?: string | null;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  scheduledDate: string;
  price: number;
  estimatedPrice?: number | null;
  status: string;
  pickupAddress?: Record<string, unknown> | null;
  destinationAddress?: Record<string, unknown> | null;
  vehicleTypeId?: string | null;
  pricingBreakdown?: Record<string, unknown> | null;
  notes?: string | null;
  shareToken?: string | null;
  paymentMethod?: PaymentMethod | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  requestId?: string | null;
  moverId?: string | null;
  customerId: string;
  quoteId?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  mover?: User;
  customer?: User;
  request?: MovingRequest;
  quote?: Quote;
  items?: BookingItem[];
  review?: Review | null;
  payments?: Payment[];
  disputes?: Dispute[];
  trackingEvents?: TrackingEvent[];
};

export type Review = {
  id: string;
  bookingId: string;
  customerId: string;
  moverId: string;
  rating: number;
  comment?: string | null;
  isReported?: boolean;
  isVisible?: boolean;
  createdAt: string;
};

export type MessageType = "text" | "image" | "voice";

export type Message = {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  messageType?: MessageType;
  attachmentUrl?: string | null;
  attachmentMimeType?: string | null;
  isRead: boolean;
  isSystem?: boolean;
  createdAt: string;
  sender?: User;
};

export type Conversation = {
  bookingId: string;
  partner?: User | null;
  partnerName: string;
  routePreview: string;
  bookingStatus: string;
  hasDispute: boolean;
  disputeId?: string | null;
  unreadCount: number;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    isSystem?: boolean;
    createdAt: string;
  } | null;
  updatedAt: string;
};

export type TrackingEvent = {
  id: string;
  bookingId: string;
  type: string;
  status: string;
  note?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdById?: string | null;
  createdAt: string;
  createdBy?: User;
};

export type BookingTracking = {
  bookingId: string;
  status: string;
  currentLocation: { latitude?: number; longitude?: number };
  lastUpdatedAt?: string;
  price?: number;
  scheduledDate?: string;
  pickupAddress?: Record<string, unknown> | null;
  destinationAddress?: Record<string, unknown> | null;
  mover?: {
    id: string;
    businessName?: string | null;
    phone?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  events: TrackingEvent[];
};

export type VehicleType = {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number;
  pricePerKm: number;
  maxWeightKg?: number;
  maxVolumeM3?: number;
  moverCapacity?: number;
  isActive: boolean;
};

export type SavedAddress = {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  instructions?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

export type PaymentMethod = "cash_on_site" | "wallet";

export type Payment = {
  id: string;
  bookingId: string;
  payerId: string;
  amount: number;
  platformCommission: number;
  kind?: "job" | "tip";
  method?: PaymentMethod;
  status: string;
  transactionRef?: string | null;
  invoiceNumber?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WalletStatementEntry = {
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
};

export type WalletStatement = {
  currentBalance: number;
  totalIn: number;
  totalOut: number;
  entries: WalletStatementEntry[];
};

export type AdminWalletStatementEntry = WalletStatementEntry & {
  userId: string;
  accountType: "customer" | "mover";
};

export type MoverWallet = {
  availableBalance: number;
  lifetimeEarnings: number;
  jobEarnings: number;
  tipEarnings: number;
  platformFees: number;
  pendingJobs: number;
  completedJobs: number;
  statement?: WalletStatement;
  payments: Array<{
    id: string;
    bookingId: string;
    kind: "job" | "tip";
    amount: number;
    platformCommission: number;
    net: number;
    status: string;
    transactionRef?: string | null;
    invoiceNumber?: string | null;
    createdAt: string;
    customerName: string;
    route: { pickup: string; destination: string } | null;
  }>;
};

export type CustomerWallet = {
  balance: number;
  totalSpent: number;
  jobPayments: number;
  tipsPaid: number;
  statement?: WalletStatement;
  payments: Array<{
    id: string;
    bookingId: string;
    kind: "job" | "tip";
    amount: number;
    status: string;
    transactionRef?: string | null;
    invoiceNumber?: string | null;
    createdAt: string;
    moverName: string;
  }>;
};

export type InvoiceLineItem = {
  label: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type PaymentInvoice = {
  invoiceNumber: string;
  bookingId: string;
  kind: "job" | "tip";
  status: "draft" | "paid";
  issuedAt: string;
  paidAt?: string | null;
  dueAt?: string | null;
  customer: { name?: string | null; email?: string | null; phone?: string | null };
  mover: { name: string; phone?: string | null };
  route: { pickup: string; destination: string };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  walletBalance?: number | null;
  canPayFromWallet: boolean;
  alreadyPaid: boolean;
  paymentId?: string | null;
  platformFee?: number | null;
  netEarnings?: number | null;
  viewerRole?: "customer" | "mover";
};

export type WalletTopUpResult = {
  balance: number;
  added: number;
};

export type PayFromWalletResult = {
  payment: Payment;
  balance: number;
  invoice: PaymentInvoice;
};

export type NearbyMover = {
  id: string;
  businessName: string;
  avatarUrl?: string | null;
  vehicleTypes: Array<{ id: string; name: string }>;
  latitude: number;
  longitude: number;
  distanceKm: number;
  estimatedFrom: number;
  estimatedMinutes: number;
  averageRating: number;
  completedMoves: number;
};

export type NearbyMoversResponse = {
  summary: {
    total: number;
    onlineCount: number;
    averageArrivalMinutes: number;
  };
  movers: NearbyMover[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type AdminAnalytics = {
  users: { total: number; customers: number; movers: number };
  marketplace: {
    requests: number;
    quotes: number;
    bookings: number;
    completedBookings: number;
  };
  revenue: { totalRevenue: number; totalCommission: number };
  quality: { totalReviews: number; averageRating: number; openDisputes: number };
};

export type Dispute = {
  id: string;
  bookingId: string;
  raisedById: string;
  reason: string;
  status: string;
  resolution?: string | null;
  refundAmount?: number | null;
  evidenceUrls?: string[];
  createdAt: string;
  updatedAt: string;
  booking?: Booking;
  raisedBy?: User;
};

export type Promotion = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceZone = {
  id: string;
  name: string;
  description?: string | null;
  boundary: {
    type: "polygon" | "circle";
    coordinates: number[][] | { lat: number; lng: number; radiusKm: number };
  };
  basePriceMultiplier: number;
  baseFee: number;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};
