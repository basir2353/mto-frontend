# MoveThisOut (MTO) — Complete Project Document

**Product tagline:** Move anything, right now.

**Live app:** https://mto-frontend.vercel.app/

Yeh document `mto_frontend` repository ki complete detail hai: project kya hai, andar kya kya modules hain, kaunsi functionalities kaam karti hain, roles, workflows, APIs, integrations, setup, aur known gaps.

---

## 1. Project Overview

**MoveThisOut** ek on-demand moving aur delivery marketplace hai.

Is platform par:

- **Customer** apna move/request publish karta hai (pickup → destination).
- Nearby **movers/drivers** quotes bhejte hain.
- Customer quote compare/negotiate karke booking confirm karta hai.
- Live tracking, chat, wallet payment, invoice, review, tip, aur dispute support available hai.

Yeh repository **public marketing site + customer app shell** hai (Next.js App Router). The full customer booking experience, driver app, and admin panel are separate deployments (see §2 — `appUrls`). This repo:

- Serves the public marketing site (landing, about, business, help, drive-recruitment marketing).
- Hosts the customer account/profile/support pages and `AuthGuard`-protected routes.
- Redirect-stubs (`/app`, `/auth`, `/customer-app`, etc.) that hand off to the separate customer app deployment (`NEXT_PUBLIC_CUSTOMER_APP_URL`).

The driver app and admin dashboard used to live in this repo too; they've been split into their own deployments and all driver/admin-only code has been removed from here (see §14).

---

## 2. Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js **16.2** (App Router) |
| UI library | React **19.2** |
| Language | TypeScript (strict) |
| Maps | `@vis.gl/react-google-maps` + Google Maps JS (Places, Directions, Geocoding, Geometry) |
| Realtime | `socket.io-client` (chat namespace `/chat`) |
| Icons | `lucide-react` |
| Styling | CSS modules, global CSS, component-level inline styles |
| Lint | ESLint (Next Core Web Vitals + TypeScript + React Compiler rules) |
| Deploy | Vercel |

**State management:** React Context + local `useState` / hooks. Redux / Zustand nahi hai.

**Important contexts:**

- `src/contexts/AuthContext.tsx` — login session / user

**Sibling deployments** (`src/lib/theme/apps.ts` → `appUrls`), not part of this repo:

| Key | Purpose |
| --- | --- |
| `admin` | Admin operations dashboard |
| `driverWeb` | Driver marketing / signup / login web |
| `customerApp` | Customer app (Expo/React Native) |
| `driverApp` | Driver app (Expo/React Native) |

---

## 3. High-Level Folder Structure

```
mto_frontend/
  src/
    app/                 # Routes / pages (marketing + customer-facing only)
    components/          # UI + feature components
    contexts/             # Auth context
    hooks/                # Custom hooks (chat, geocoding, route metrics, ...)
    lib/
      api/               # REST client + resource modules + mock backend
      env.ts             # Runtime env flags
      bookingFlow.ts     # Booking status helpers
      negotiation.ts     # Quote negotiation helpers
      maps.ts            # Maps helpers
      push.ts            # Web push subscription helper
      session.ts         # Token / session storage helpers
      theme/             # Theme tokens + sibling-app URLs (appUrls)
  scripts/
    use-env.mjs          # local/live/production env switcher
    integration-test.mjs # Backend smoke test
  env/
    local.env
    production.env
  public/                # Static assets
```

---

## 4. User Roles & Access Control

The backend API models 3 roles (`customer`, `mover`, `admin`), but **this repo only serves the `customer` role**. Mover and admin accounts use the separate `driverWeb`/`driverApp` and `admin` deployments.

**Auth flow:**

1. Login / register on the customer app (`NEXT_PUBLIC_CUSTOMER_APP_URL`) — `/auth` in this repo is a redirect stub pointing there.
2. Tokens stored via `src/lib/session.ts` (localStorage, migrated from legacy sessionStorage).
3. API calls attach a Bearer token.
4. `401` triggers one `/auth/refresh` attempt.
5. Protected pages (`/customer-app/profile`, `/customer-app/support`) use `AuthGuard` with `roles={["customer"]}`.
6. On a role mismatch, `AuthGuard` redirects to `/customer-app`.

Files:

- `src/components/AuthGuard.tsx`
- `src/contexts/AuthContext.tsx`
- `src/lib/session.ts`
- `src/lib/api/auth.ts`
- `src/lib/api/client.ts`

---

## 5. All Routes / Pages

### 5.1 Public / Marketing

| Route | File | Kya hai |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Landing page: quote widget, route map, marketplace explanation, vehicles, driver-recruitment CTA (links out to `driverWeb`) |
| `/about` | `src/app/about/page.tsx` | Company story, values, safety, stats |
| `/business` | `src/app/business/page.tsx` | Enterprise marketing + sales lead form |
| `/help` | `src/app/help/page.tsx` | Help categories / popular articles |
| `/help/[slug]` | `src/app/help/[slug]/page.tsx` | Individual help article |
| `/auth` | `src/app/auth/page.tsx` | Redirect stub → customer app auth |
| `/privacy`, `/terms` | `src/app/privacy`, `src/app/terms` | Legal pages |
| `/track/[token]` | `src/app/track/[token]/page.tsx` | Shared move-tracking link target |

### 5.2 Customer (protected)

| Route | File | Kya hai |
| --- | --- | --- |
| `/app`, `/app/customer`, `/customer-app` | redirect stubs | All hand off to the customer app deployment |
| `/customer-app/profile` | `src/app/customer-app/profile/page.tsx` | Profile, stats, disputes, saved addresses (`AuthGuard roles={["customer"]}`) |
| `/customer-app/support` | `src/app/customer-app/support/page.tsx` | Customer FAQ / dispute guidance (`AuthGuard roles={["customer"]}`) |

There is no `/driver-app`, `/admin`, `/driver-signup`, or `/drive` route in this repo anymore — those surfaces live in the separate deployments linked via `appUrls`.

---

## 6. Complete Functionality Map

### 6.1 Marketing Site Features

- Landing page with live quote / location widget
- Route preview on Google Maps
- Vehicle options showcase
- About / Business / Help pages
- Business enterprise contact form (`BusinessContactForm` → `businessApi`)
- Driver-recruitment CTAs linking out to the external driver site (`appUrls.driverWeb`)
- `AppPromptPopup` — bottom-corner nudge to open the customer app or the driver site

### 6.2 Authentication Features

- Session restore via `/auth/me` (`AuthContext`)
- Token refresh
- Logout
- Role-gated routing via `AuthGuard` (customer-only in this repo)

### 6.3 Customer Profile & Support (`/customer-app/*`)

- Account profile edit (avatar/contact/address/preferences) — `AccountProfileForm`
- Saved addresses + default address — `SavedAddressesPanel`
- Activity / user statistics — `UserStatsPanel`
- Customer dispute history + in-thread chat — `CustomerDisputesPanel` → `DisputeThreadPanel`
- Support FAQ / dispute guidance

### 6.4 Shared Cross-App Primitives (kept for the customer surface)

| Feature | Details |
| --- | --- |
| Maps | Route display, place autocomplete, geocoding — `components/maps/*` |
| Messaging | Dispute-room chat: text / image / voice messages — `ChatComposer`, `ChatMessageContent`, `useChat` |
| Disputes | Raise/view dispute thread + evidence — `BookingDisputeBanner`, `DisputeThreadPanel` |
| Notifications | Bell UI, unread filter, mark read / mark all — `NotificationsBell` |
| Mock mode | Local mock API for development (`NEXT_PUBLIC_USE_MOCKS=true`) |

The customer booking wizard (plan → details → quotes → book → track), the driver dashboard, and the admin panel are **not** part of this repo — they live in the separate customer app, driver app, and admin deployments.

---

## 7. Key Workflows (End-to-End, as seen from this repo)

1. Visitor lands on `/`, gets a quote widget preview, and is funneled to `appUrls.customerApp` to actually book.
2. A prospective driver clicks a "Become a driver" CTA (nav, footer, or homepage) and is sent to `appUrls.driverWeb`.
3. A logged-in customer visits `/customer-app/profile` or `/customer-app/support` for account management, saved addresses, and dispute threads.
4. Shared tracking links (`/track/{token}`) resolve in this repo for anyone with the link.

The full move lifecycle (publish request → quotes → negotiate → book → track → pay → rate) happens in the separate customer app deployment, not in this repository.

---

## 8. Important Components (by domain)

### Shells / navigation

- `components/MarketingShell.tsx`
- `components/SiteNav.tsx` / `SiteFooter.tsx`
- `components/AppPromptPopup.tsx`

### Booking / dispute (shared with the customer profile pages)

- `components/booking/BookingDisputeBanner.tsx`
- `components/dispute/DisputeThreadPanel.tsx`
- `components/NegotiationPanel.tsx` (used only if re-wired — currently unreferenced pending the booking wizard's return)

### Messaging / notifications

- `components/messaging/ChatComposer.tsx`
- `components/messaging/ChatMessageContent.tsx`
- `components/notifications/NotificationsBell.tsx`

### Maps / profile / forms

- `components/maps/GoogleMapsProvider.tsx`
- `components/maps/RouteMap.tsx`
- `components/maps/PlaceAutocompleteInput.tsx`
- `components/profile/AccountProfileForm.tsx`
- `components/profile/SavedAddressesPanel.tsx`
- `components/profile/UserStatsPanel.tsx`
- `components/profile/CustomerDisputesPanel.tsx`
- `components/QuoteWidget.tsx`
- `components/BusinessContactForm.tsx`
- `components/PhoneInput.tsx`, `DatePicker.tsx`, `FormControls.tsx`

---

## 9. Hooks & Domain Helpers

### Hooks (`src/hooks`)

| Hook | Purpose |
| --- | --- |
| `useChat.ts` | Socket.IO chat + mock polling fallback (used by dispute threads) |
| `useGeocodedPlace.ts` | Place geocoding helper |
| `useRouteMetrics.ts` | Distance/duration calculations |

### Lib helpers (`src/lib`)

| File | Purpose |
| --- | --- |
| `bookingFlow.ts` | Booking status / paid / trackable helpers |
| `negotiation.ts` | Negotiation rules |
| `trackingDisplay.ts` | Tracking UI display helpers |
| `invoiceDocument.ts` | Invoice PDF download / share |
| `notificationNav.ts` | Notification deep-link routing |
| `maps.ts` | Maps utilities |
| `push.ts` | Web Push subscription helper |
| `session.ts` | Auth session storage |
| `appRole.ts` | Customer auth-path helpers (`appHomePath`, `appAuthPath`) |
| `displayNames.ts` | Customer/mover display name helpers |
| `env.ts` | Env flags (`hasGoogleMaps`, `hasWebPush`, `apiBaseUrl`) |
| `theme/apps.ts` | `appUrls` — URLs of the sibling marketing/admin/driver/customer-app/driver-app deployments |

---

## 10. API Modules (Frontend → Backend)

Shared client: `src/lib/api/client.ts`
Exports barrel: `src/lib/api/index.ts`

| Module | File | Covers |
| --- | --- | --- |
| Auth | `api/auth.ts` | login, register, me, refresh, password recovery, verify |
| Users | `api/users.ts` | profile, preferences, stats, saved addresses, notifications |
| Customers | `api/customers.ts` | requests, accept quote, wallet, invoices, payment, review, disputes |
| Bookings | `api/bookings.ts` | booking CRUD, estimates, share, timeline, location, status, items |
| Public | `api/public.ts` | vehicles, zones, nearby movers, platform health |
| Uploads | `api/uploads.ts` | file uploads |
| Business | `api/business.ts` | enterprise lead form |
| Verification | `api/verification.ts` | document / vehicle / face verification |
| Messages | `api/messages.ts` | dispute-room chat: list, send, mark read |
| Mock | `api/mock/*` | browser-persisted mock backend for local dev |

`api/movers.ts` and `api/admin.ts` (driver/admin-only endpoints) have been removed from this repo along with the driver/admin UI that called them.

**Default API base URL:** `http://localhost:4000/api/v1`

---

## 11. Integrations

| Integration | Where | Status |
| --- | --- | --- |
| Google Maps / Places / Directions | maps components + hooks | Implemented (needs `NEXT_PUBLIC_GOOGLE_MAPS_KEY`) |
| Socket.IO chat | `useChat.ts` | Implemented (`/chat` namespace + token auth) |
| Web Push (VAPID) | `lib/push.ts` | Helper only — full app wiring / service worker missing |
| Mock API | `api/mock/*` | Dev-only; production mein disable |

---

## 12. Environment Variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps key (maps enable karta hai) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push public key |
| `NEXT_PUBLIC_USE_MOCKS` | `true` → mock APIs (prod mein avoid) |
| `NEXT_PUBLIC_MARKETING_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_DRIVER_WEB_URL`, `NEXT_PUBLIC_CUSTOMER_APP_URL`, `NEXT_PUBLIC_DRIVER_APP_URL` | Sibling-deployment URLs consumed via `appUrls` |

Env presets:

- `env/local.env`
- `env/production.env`

Switcher script: `scripts/use-env.mjs`

```bash
npm run env:local
npm run env:live
npm run env:production
```

---

## 13. Setup / Run / Build Commands

```bash
# Install
npm install

# Dev
npm run dev
npm run dev:local
npm run dev:live

# Build / start
npm run build
npm run build:live
npm run start
npm run start:prod

# Quality
npm run lint
npm run typecheck

# Manual backend smoke test
node scripts/integration-test.mjs
```

App locally: http://localhost:3000

---

## 14. Known Gaps / Incomplete Areas / Recent Changes

1. **Driver app & admin panel removed from this repo.** They previously lived here as `/driver-app` and `/admin` (plus a large shared `components/move/*` booking-wizard tree). All driver/admin-exclusive code, and code that was already orphaned (unreachable from any live route) has been deleted. Driver and admin now live in separate deployments referenced via `appUrls`.
2. **Android/Capacitor removed.** This repo previously also shipped an `android/` Capacitor wrapper for building customer/driver APKs; that's been removed — this is a pure web app now.
3. **Google / Apple auth buttons** — not present in this repo (auth happens in the separate customer app).
4. **Help page search / articles** — static presentation, real searchable content nahi.
5. **Marketing images (`ImageSlot`)** — local browser preview / placeholders; production media incomplete.
6. **Web Push incomplete** — subscription helper hai, lekin service worker + app call-site wiring missing.
7. **Automated tests missing** — unit/component/e2e framework configured nahi; sirf lint/typecheck + manual integration script.
8. **Mock mode production-disabled** — live features backend availability/compatibility par depend karti hain.

---

## 15. Quick Mental Model

```text
Public marketing site (this repo)
        │
        ├── /  ────────────────── quote widget → sends visitor to customerApp
        ├── /drive CTAs ────────── sends visitor to driverWeb
        ├── /auth ──────────────── redirect stub → customerApp
        ├── /app, /app/customer,
        │   /customer-app ──────── redirect stubs → customerApp
        ├── /customer-app/profile,
        │   /customer-app/support ─ real pages, AuthGuard-protected, customer role only
        └── /track/[token] ─────── shared tracking link target

Sibling deployments (NOT in this repo): admin dashboard, driverWeb, driverApp, customerApp
```

Realtime pieces still present here:

- Dispute-room chat (Socket.IO + polling fallback)
- Maps for places + route display

---

## 16. Related Docs

- Short setup guide: `README.md`
- Package scripts / deps: `package.json`
- Env example: `.env.example`
- Next config: `next.config.ts`

---

*Generated from the current `mto_frontend` codebase inventory. Update this document when major routes, roles, or payment/auth flows change.*
