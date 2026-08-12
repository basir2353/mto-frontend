import type {
  Booking,
  BookingItem,
  Dispute,
  Message,
  MovingRequest,
  Notification,
  Payment,
  Promotion,
  Quote,
  QuoteCounteroffer,
  Review,
  SavedAddress,
  TrackingEvent,
  User,
  VehicleType,
} from "@/lib/api/types";
import { mockId, nowIso } from "./utils";

type Credential = { userId: string; password: string };

type BusinessLead = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  message?: string;
  movesPerMonth?: string;
  createdAt: string;
};

type CashOutRequest = {
  id: string;
  moverId: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  bankNote?: string;
  createdAt: string;
};

type MockDb = {
  users: User[];
  credentials: Credential[];
  requests: MovingRequest[];
  quotes: Quote[];
  counteroffers: QuoteCounteroffer[];
  bookings: Booking[];
  bookingItems: BookingItem[];
  trackingEvents: TrackingEvent[];
  messages: Message[];
  reviews: Review[];
  payments: Payment[];
  disputes: Dispute[];
  promotions: Promotion[];
  notifications: Notification[];
  savedAddresses: SavedAddress[];
  businessLeads: BusinessLead[];
  cashOutRequests: CashOutRequest[];
  vehicleTypes: VehicleType[];
  walletBalances: Record<string, number>;
  moverWalletBalances: Record<string, number>;
};

const STORAGE_KEY = "mto_mock_db_v2";

const vehicleTypes: VehicleType[] = [
  {
    id: "vt_pickup",
    name: "Pickup Truck",
    description: "Open-bed hauls, garden & bulky gear",
    basePrice: 75,
    pricePerKm: 1.5,
    maxWeightKg: 900,
    maxVolumeM3: 6,
    moverCapacity: 1,
    isActive: true,
  },
  {
    id: "vt_van",
    name: "Cargo Van",
    description: "Best for studio and one-bedroom moves",
    basePrice: 89,
    pricePerKm: 1.75,
    maxWeightKg: 800,
    maxVolumeM3: 8,
    moverCapacity: 2,
    isActive: true,
  },
  {
    id: "vt_box",
    name: "Box Truck",
    description: "Enclosed box truck for apartment and house moves",
    basePrice: 149,
    pricePerKm: 2.4,
    maxWeightKg: 2500,
    maxVolumeM3: 24,
    moverCapacity: 2,
    isActive: true,
  },
  {
    id: "vt_suv",
    name: "Car/SUV",
    description: "Small deliveries and single items only",
    basePrice: 45,
    pricePerKm: 1.25,
    maxWeightKg: 200,
    maxVolumeM3: 2,
    moverCapacity: 1,
    isActive: true,
  },
];

const moverSeeds: Array<{ businessName: string; rating: number; completed: number; vehicleTypeIds: string[]; bio: string }> = [
  { businessName: "Northline Movers", rating: 4.9, completed: 412, vehicleTypeIds: ["vt_van", "vt_box"], bio: "Cargo Van · Ford Transit 2021 · 2 helpers available" },
  { businessName: "Quickhaul Co.", rating: 4.7, completed: 268, vehicleTypeIds: ["vt_pickup"], bio: "Pickup Truck · Ram 1500 2019 · 1 helper available" },
  { businessName: "CityVan Express", rating: 4.8, completed: 355, vehicleTypeIds: ["vt_van"], bio: "Cargo Van · Mercedes Sprinter 2022 · 2 helpers available" },
  { businessName: "Big Load Bros", rating: 4.6, completed: 190, vehicleTypeIds: ["vt_box"], bio: "Box Truck · Isuzu NPR 2020 · 2 helpers available" },
  { businessName: "SwiftSUV Moves", rating: 4.9, completed: 501, vehicleTypeIds: ["vt_suv"], bio: "Car/SUV · Toyota Highlander 2021 · small deliveries only" },
  { businessName: "Metro Muscle Moving", rating: 4.5, completed: 134, vehicleTypeIds: ["vt_van", "vt_pickup"], bio: "Cargo Van · Nissan NV200 2020 · 1 helper available" },
];

function emptyDb(): MockDb {
  return {
    users: [],
    credentials: [],
    requests: [],
    quotes: [],
    counteroffers: [],
    bookings: [],
    bookingItems: [],
    trackingEvents: [],
    messages: [],
    reviews: [],
    payments: [],
    disputes: [],
    promotions: [],
    notifications: [],
    savedAddresses: [],
    businessLeads: [],
    cashOutRequests: [],
    vehicleTypes,
    walletBalances: {},
    moverWalletBalances: {},
  };
}

function seedMovers(db: MockDb) {
  moverSeeds.forEach((seed, i) => {
    const userId = mockId("user");
    db.users.push({
      id: userId,
      email: `mover${i + 1}@moveitout.demo`,
      roles: ["mover"],
      isActive: true,
      isVerified: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      moverProfile: {
        id: mockId("mover"),
        businessName: seed.businessName,
        phone: "+1 555 010" + i,
        bio: seed.bio,
        isVerified: true,
        avatarUrl: null,
        serviceAreas: ["Local area"],
        documents: [],
        availability: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], hours: "8:00-20:00" },
        latitude: null,
        longitude: null,
        userId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    });
    db.credentials.push({ userId, password: "password123" });
  });
}

function seedDemoCustomer(db: MockDb) {
  const userId = mockId("user");
  const customerProfileId = mockId("cust");
  db.users.push({
    id: userId,
    email: "demo@moveitout.demo",
    roles: ["customer"],
    isActive: true,
    isVerified: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    customerProfile: {
      id: customerProfileId,
      firstName: "Ava",
      lastName: "Morgan",
      phone: "+1 555 0100",
      avatarUrl: null,
      userId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  });
  db.credentials.push({ userId, password: "password123" });

  return { customerUserId: userId };
}

function seedHistoryBooking(db: MockDb, customerId: string) {
  const mover = db.users.find((u) => u.roles.includes("mover"));
  if (!mover) return;
  const requestId = mockId("req");
  const bookingId = mockId("book");
  const past = new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString();

  db.requests.push({
    id: requestId,
    pickupAddress: "88 Front St, your city",
    destinationAddress: "212 Elm Ave, your city",
    movingDate: past.slice(0, 10),
    items: [{ name: "Sofa", quantity: 1 }, { name: "Boxes", quantity: 8 }],
    additionalNotes: "Ground floor, no stairs",
    status: "completed",
    customerId,
    createdAt: past,
    updatedAt: past,
  });

  db.bookings.push({
    id: bookingId,
    scheduledDate: past,
    price: 168,
    estimatedPrice: 160,
    status: "completed",
    pickupAddress: { formatted: "88 Front St, your city" },
    destinationAddress: { formatted: "212 Elm Ave, your city" },
    vehicleTypeId: "vt_van",
    pricingBreakdown: { base: 55, distance: 90, helpers: 23 },
    notes: "Completed move",
    requestId,
    moverId: mover.id,
    customerId,
    createdAt: past,
    updatedAt: past,
    mover,
  });
}

let db: MockDb | null = null;

function load(): MockDb {
  if (db) return db;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        db = JSON.parse(raw) as MockDb;
        if (!db.walletBalances) db.walletBalances = {};
        if (!db.moverWalletBalances) db.moverWalletBalances = {};
        return db;
      }
    } catch {
      // fall through to fresh seed
    }
  }
  db = emptyDb();
  seedMovers(db);
  const { customerUserId } = seedDemoCustomer(db);
  seedHistoryBooking(db, customerUserId);
  persist();
  return db;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function persist() {
  if (typeof window === "undefined" || !db) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // storage full/unavailable — demo state just won't persist across reloads
    }
  }, 150);
}

export function getDb(): MockDb {
  return load();
}

export function seedVehicleTypes(): VehicleType[] {
  return load().vehicleTypes;
}

export function seedMoverProfiles() {
  return load().users.filter((u) => u.roles.includes("mover"));
}
