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
- **Admin** users, bookings, disputes, zones, promotions, aur platform health manage karta hai.

Yeh repository **sirf frontend** hai: Next.js App Router app jo public marketing site + customer app + driver app + admin panel serve karti hai. Backend alag REST API hai (`NEXT_PUBLIC_API_URL`).

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
| Lint | ESLint (Next Core Web Vitals + TypeScript) |
| Deploy | Vercel |

**State management:** React Context + local `useState` / hooks. Redux / Zustand nahi hai.

**Important contexts:**

- `src/contexts/AuthContext.tsx` — login session / user
- `src/contexts/MoveFlowContext.tsx` — customer booking/API flow
- `src/contexts/MoveFormContext.tsx` — move form draft state

---

## 3. High-Level Folder Structure

```
mto_frontend/
  src/
    app/                 # Routes / pages (marketing, auth, customer, driver, admin)
    components/          # UI + feature components
    contexts/            # Auth, move form, move flow
    hooks/               # Custom hooks (chat, nearby movers, route metrics, ...)
    lib/
      api/               # REST client + resource modules + mock backend
      env.ts             # Runtime env flags
      bookingFlow.ts     # Booking status helpers
      negotiation.ts     # Quote negotiation helpers
      maps.ts            # Maps helpers
      push.ts            # Web push subscription helper
      session.ts         # Token / session storage helpers
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

API model mein **3 roles** hain:

| Role | Home app | Purpose |
| --- | --- | --- |
| `customer` | `/customer-app` | Move request, booking, track, pay, review |
| `mover` | `/driver-app` | Jobs, quotes, tracking, earnings |
| `admin` | `/admin` | Operations dashboard |

**Auth flow:**

1. Login / register on `/auth`
2. Tokens `sessionStorage` mein save hote hain
3. API calls par Bearer token attach hota hai
4. `401` par ek dafa `/auth/refresh` try hota hai
5. Protected pages `AuthGuard` use karti hain
6. Galat role hone par user apne role ke home app par redirect hota hai

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
| `/` | `src/app/page.tsx` | Landing page: quote widget, route map, marketplace explanation, vehicles, driver CTA |
| `/about` | `src/app/about/page.tsx` | Company story, values, safety, stats |
| `/business` | `src/app/business/page.tsx` | Enterprise marketing + sales lead form |
| `/help` | `src/app/help/page.tsx` | Help categories / popular articles (mostly static UI) |
| `/drive` | `src/app/drive/page.tsx` | Mover recruitment page (requirements, earnings, signup links) |
| `/auth` | `src/app/auth/page.tsx` | Login, customer register, email verify, forgot/reset password, role redirect |
| `/driver-signup` | `src/app/driver-signup/page.tsx` | 5-step mover onboarding / verification wizard |
| `/customer-wireframes` | `src/app/customer-wireframes/page.tsx` | Old customer flow design artifact (publicly reachable) |

### 5.2 Customer (protected)

| Route | File | Kya hai |
| --- | --- | --- |
| `/customer-app` | `src/app/customer-app/page.tsx` | Main customer app (plan → details → quotes → book → track + messages/wallet/history/rate) |
| `/customer-app/profile` | `src/app/customer-app/profile/page.tsx` | Profile, stats, disputes, saved addresses |
| `/customer-app/support` | `src/app/customer-app/support/page.tsx` | Customer FAQ / dispute guidance |

### 5.3 Driver / Mover (protected)

| Route | File | Kya hai |
| --- | --- | --- |
| `/driver-app` | `src/app/driver-app/page.tsx` | Jobs, active work, messaging, tracking, earnings |
| `/driver-app/settings` | `src/app/driver-app/settings/page.tsx` | Identity, vehicle, availability, location, documents, profile |

### 5.4 Admin (protected)

| Route | File | Kya hai |
| --- | --- | --- |
| `/admin` | `src/app/admin/page.tsx` | Operations dashboard |
| `/admin/profile` | `src/app/admin/profile/page.tsx` | Admin account profile |

---

## 6. Complete Functionality Map

### 6.1 Marketing Site Features

- Landing page with live quote / location widget
- Route preview on Google Maps
- Vehicle options showcase
- About / Business / Help / Drive pages
- Business enterprise contact form (`BusinessContactForm` → `businessApi`)
- Driver recruitment CTA linking to signup

### 6.2 Authentication Features

- Customer registration
- Login (role-based redirect)
- Email verification
- Forgot password / reset password
- Session restore via `/auth/me`
- Token refresh
- Logout
- **Note:** Google / Apple auth buttons currently visual only (OAuth wired nahi)

### 6.3 Customer App Features

Customer app ek multi-screen wizard + dashboard hai.

#### A) Move planning (`PlanScreen`)

- Pickup / destination Google Places autocomplete
- Move date, timing tabs, time window, timezone
- Vehicle preference / filter
- Nearby movers list (distance / price / rating / arrival sorting)
- Route metrics (distance / duration)
- Local estimate helpers

#### B) Move details (`DetailsScreen`)

- Load / inventory description
- Item suggestions
- Optional item photo uploads
- Publish moving request

#### C) Quotes (`QuotesScreen`)

- Poll for mover quotes
- Compare price / mover info
- Negotiation / counteroffers
- Select a quote

#### D) Booking confirm (`BookScreen`)

- Fee review
- Confirm booking
- Payment model presentation (see known gaps: cash vs wallet inconsistency)

#### E) Tracking (`TrackScreen`)

- Canonical job stages / timeline
- Live mover location
- Booking insights
- Delivery proof gallery
- Chat entry
- Manage actions (cancel / reschedule / share / dispute / duplicate / rebook)

#### F) Other customer screens inside `/customer-app`

- **Messages** — inbox + booking chat
- **Wallet** — top-up, checkout, invoice preview/download/share
- **Rate** — rate mover + optional tip
- **History** — past moves / bookings

#### G) Profile & support

- Account profile edit (avatar/contact/address/preferences)
- Language / privacy / notification settings
- Activity / user statistics
- Saved addresses + default address
- Customer dispute history panel
- Support FAQ / dispute guidance

### 6.4 Driver / Mover Features

#### Onboarding (`/driver-signup`)

5-step wizard:

1. Account details
2. Vehicle details
3. Licence / insurance / vehicle photo checks
4. Service location (Google Places) + schedule
5. Selfie / licence face matching → uploads → mover profile create → pending approval

#### Driver dashboard (`/driver-app`)

- Go online with browser geolocation
- Browse available moving requests
- Submit / negotiate quotes
- Accept booking
- Job progress / status events
- Continuously publish location
- Chat with customer
- Upload completion proof
- Mark delivered / completed
- Earnings, tips, wallet statements, invoices

#### Driver settings

- Identity / vehicle / availability
- Service location
- Documents
- Profile editing

### 6.5 Admin Features

- Platform analytics overview
- Platform health badge
- Users list / filter
- Mover verification
- Bookings inspection
- Dispute review / resolve
- Optional wallet refunds from chat/dispute tooling
- Platform transactions inspection
- Pricing zones create / edit / delete
- Promotions create
- Admin profile management

### 6.6 Shared Cross-App Features

| Feature | Details |
| --- | --- |
| Maps | Route display, place autocomplete, location fields, geocoding |
| Messaging | Inbox, read status, text / image / voice messages, dispute rooms |
| Notifications | Bell UI, unread filter, mark read / mark all, role-specific deep links |
| Negotiation | Customer ↔ mover counteroffers, accept/reject |
| Wallet / billing | Top-ups, job payment, statements, invoices, admin refunds |
| Disputes | Raise dispute + evidence, thread panel, admin resolution |
| Uploads | Photos, documents, chat media |
| Verification | Document / vehicle / face checks (fail-open fallbacks exist) |
| Mock mode | Local mock API for development (`NEXT_PUBLIC_USE_MOCKS=true`) |

---

## 7. Key Workflows (End-to-End)

### 7.1 Customer move lifecycle

1. Pickup / drop-off choose karo (Google Places)
2. Date, timing, vehicle preference set karo
3. Nearby movers + route metrics dekho
4. Inventory / photos add karo
5. Moving request publish karo
6. Quotes receive / compare / negotiate karo
7. Quote select + booking confirm
8. Live track + chat + delivery evidence
9. Wallet top-up / pay / invoice
10. Rate + tip
11. History mein retain
12. Optional: cancel, reschedule, duplicate, rebook, share tracking, dispute

### 7.2 Mover job lifecycle

1. Signup + verification
2. Online jao (geolocation)
3. Available jobs browse
4. Quote submit / negotiate
5. Booking accept
6. Status + location updates
7. Customer chat
8. Completion proof upload
9. Delivered / completed
10. Earnings / tips / statements check

### 7.3 Admin ops lifecycle

1. Dashboard / health dekho
2. Users / movers verify
3. Bookings inspect
4. Disputes resolve (+ refunds if needed)
5. Transactions review
6. Zones / promotions manage

---

## 8. Important Components (by domain)

### Shells / navigation

- `components/MarketingShell.tsx`
- `components/SiteNav.tsx` / `SiteFooter.tsx`
- `components/customer/CustomerAppShell.tsx`
- `components/driver/DriverDashboardShell.tsx`

### Customer move wizard

- `components/move/PlanScreen.tsx`
- `components/move/DetailsScreen.tsx`
- `components/move/QuotesScreen.tsx`
- `components/move/BookScreen.tsx`
- `components/move/TrackScreen.tsx`
- `components/move/WizardChrome.tsx`
- `components/move/MoveSheet.tsx`
- `components/move/MovesSwitcher.tsx`
- `components/move/WalletPanels.tsx`
- `components/move/JobPanels.tsx`
- `components/move/ItemSuggestionsField.tsx`

### Booking tools

- `components/booking/BookingManageActions.tsx`
- `components/booking/BookingInsightsPanel.tsx`
- `components/booking/BookingTimelinePanel.tsx`
- `components/booking/BookingDisputeBanner.tsx`
- `components/booking/VehicleCardPicker.tsx`
- `components/booking/MoveTimingTabs.tsx`
- `components/booking/TimeZoneSelect.tsx`
- `components/NegotiationPanel.tsx`

### Driver

- `components/driver/DriverWorkPanel.tsx`
- `components/driver/DriverJobProgress.tsx`
- `components/driver/DriverDashboardShell.tsx`

### Admin

- `components/admin/AdminDetailCards.tsx`
- `components/admin/AdminZonesPanel.tsx`
- `components/admin/PlatformHealthBadge.tsx`

### Messaging / disputes / notifications

- `components/messaging/MessagesInbox.tsx`
- `components/messaging/ChatComposer.tsx`
- `components/messaging/ChatMessageContent.tsx`
- `components/messaging/AdminChatRefundBar.tsx`
- `components/dispute/DisputeThreadPanel.tsx`
- `components/notifications/NotificationsBell.tsx`

### Maps / profile / forms

- `components/maps/GoogleMapsProvider.tsx`
- `components/maps/RouteMap.tsx`
- `components/maps/PlaceAutocompleteInput.tsx`
- `components/maps/LocationField.tsx`
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
| `useCustomerFlow.ts` | Customer request/booking/payment/dispute flow orchestration |
| `useChat.ts` | Socket.IO chat + mock polling fallback |
| `useNearbyMovers.ts` | Nearby movers discovery + refresh |
| `useRouteMetrics.ts` | Distance/duration calculations |
| `useGeocodedPlace.ts` | Place geocoding helper |

### Lib helpers (`src/lib`)

| File | Purpose |
| --- | --- |
| `bookingFlow.ts` | Booking status / paid / trackable helpers |
| `driverJobFlow.ts` | Driver job stage logic |
| `customerMoveNav.ts` | Customer screen navigation rules |
| `moveEstimate.ts` | Local estimate calculation |
| `moveItems.ts` | Inventory item helpers |
| `negotiation.ts` | Negotiation rules |
| `requestSchedule.ts` | Scheduling helpers |
| `quoteTiming.ts` | Quote timing helpers |
| `trackingDisplay.ts` | Tracking UI display helpers |
| `invoiceDocument.ts` | Invoice PDF download / share |
| `notificationNav.ts` | Notification deep-link routing |
| `maps.ts` | Maps utilities |
| `push.ts` | Web Push subscription helper |
| `session.ts` | Auth session storage |
| `displayNames.ts` | Customer/mover display name helpers |
| `env.ts` | Env flags (`hasGoogleMaps`, `hasWebPush`, `apiBaseUrl`) |

---

## 10. API Modules (Frontend → Backend)

Shared client: `src/lib/api/client.ts`  
Exports barrel: `src/lib/api/index.ts`

| Module | File | Covers |
| --- | --- | --- |
| Auth | `api/auth.ts` | login, register, me, refresh, password recovery, verify |
| Users | `api/users.ts` | profile, preferences, stats, saved addresses, notifications |
| Customers | `api/customers.ts` | requests, accept quote, wallet, invoices, payment, review, disputes |
| Movers | `api/movers.ts` | presence, quoting, bookings, tracking, evidence, messaging |
| Bookings | `api/bookings.ts` | booking CRUD, estimates, share, timeline, location, status, items |
| Admin | `api/admin.ts` | analytics, verification, disputes/refunds, promotions, transactions |
| Public | `api/public.ts` | vehicles, zones, nearby movers, platform health |
| Uploads | `api/uploads.ts` | file uploads |
| Business | `api/business.ts` | enterprise lead form |
| Verification | `api/verification.ts` | document / vehicle / face verification |
| Mock | `api/mock/*` | browser-persisted mock backend for local dev |

**Default API base URL:** `http://localhost:4000/api/v1`

---

## 11. Integrations

| Integration | Where | Status |
| --- | --- | --- |
| Google Maps / Places / Directions | maps components + hooks | Implemented (needs `NEXT_PUBLIC_GOOGLE_MAPS_KEY`) |
| Socket.IO chat | `useChat.ts` | Implemented (`/chat` namespace + token auth) |
| Browser geolocation | driver app | Implemented for presence/tracking |
| Camera / mic | driver signup selfie + chat voice | Implemented |
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

## 14. Known Gaps / Incomplete Areas

Yeh cheezein currently incomplete / inconsistent hain:

1. **Google / Apple auth buttons** — UI only, OAuth handlers nahi.
2. **Help page search / articles** — static presentation, real searchable content nahi.
3. **Marketing images (`ImageSlot`)** — local browser preview / placeholders; production media incomplete.
4. **Verification fail-open** — agar backend verification endpoints 404/405/501 den to frontend heuristically pass treat kar sakta hai.
5. **Web Push incomplete** — subscription helper hai, lekin service worker + app call-site wiring missing.
6. **Shared tracking route missing** — code `/track/{token}` synthesize kar sakta hai, lekin App Router page exist nahi karti.
7. **Payment messaging inconsistency** — Book screen “Cash on site” dikhata hai, baad mein wallet settlement flow hai.
8. **`/customer-wireframes` public** — internal design artifact publicly reachable hai.
9. **Automated tests missing** — unit/component/e2e framework configured nahi; sirf lint/typecheck + manual integration script.
10. **Mock mode production-disabled** — live features backend availability/compatibility par depend karti hain.

---

## 15. Quick Mental Model

```text
Public marketing site
        │
        ├── /auth ──────────────┐
        │                       │
        ├── customer  →  plan → details → quotes → book → track → pay/rate
        │                       │
        ├── mover     →  signup → online → quote → job progress → earnings
        │                       │
        └── admin     →  users / bookings / disputes / zones / promotions
```

Realtime pieces:

- Socket chat
- Polling for quotes / nearby movers / tracking (especially mock mode)
- Maps for places + route + live location display

---

## 16. Related Docs

- Short setup guide: `README.md`
- Package scripts / deps: `package.json`
- Env example: `.env.example`
- Next config: `next.config.ts`

---

*Generated from the current `mto_frontend` codebase inventory. Update this document when major routes, roles, or payment/auth flows change.*
