# MoveThisOut (MTO) — Frontend

**Move anything, right now.**

MoveThisOut is an on-demand moving and delivery platform. This repository contains the frontend, a [Next.js](https://nextjs.org) application serving the public marketing site plus dedicated experiences for customers, drivers, and admins.

**Live app:** [https://mto-frontend.vercel.app/](https://mto-frontend.vercel.app/)

## Features

- **Marketing site** — landing page, about, business/enterprise contact, and help pages.
- **Customer app** — booking flow, live quote widget, move tracking, profile, and support.
- **Driver app** — driver signup, job flow, in-app messaging, and settings.
- **Admin panel** — operations dashboard and profile management.
- **Booking & negotiation** — quote estimation, price negotiation, and dispute handling.
- **Maps integration** — route display and place lookups via Google Maps.
- **Real-time updates** — Socket.IO client for live messaging/notifications.
- **Web push notifications** — via VAPID keys.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript
- [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/) for maps
- [`socket.io-client`](https://socket.io/) for real-time communication
- [`lucide-react`](https://lucide.dev/) for icons
- ESLint for linting

## Project Structure

```
src/
  app/                # App Router routes (marketing, auth, customer-app, driver-app, admin, business, drive, help, ...)
  components/          # Shared UI + feature components (booking, driver, dispute, maps, messaging, admin, ui, ...)
  contexts/             # React context providers
  hooks/                # Custom hooks
  lib/
    api/                # API client, resource modules, and mock data
    env.ts               # Runtime environment config
    ...                   # Booking flow, negotiation, maps, push, session helpers
scripts/
  use-env.mjs           # Switches active .env file between local/live/production
  integration-test.mjs
```

## Getting Started

### Prerequisites

- Node.js and npm
- A Google Maps API key (for map features)
- A backend API to point at (see [Environment Variables](#environment-variables))

### Install dependencies

```bash
npm install
```

### Configure environment

This project keeps per-environment env files under an `env/` directory (`env/local.env`, `env/production.env`) and copies the right one into place via `scripts/use-env.mjs`:

```bash
npm run env:local        # copies env/local.env -> .env.local
npm run env:live         # copies env/production.env -> .env.local
npm run env:production   # copies env/production.env -> .env.production(.local)
```

Required variables:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (defaults to `http://localhost:4000/api/v1`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps API key, enables map features |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key, enables web push notifications |
| `NEXT_PUBLIC_USE_MOCKS` | Set to `true` to use mock API data instead of a live backend |

### Run the development server

```bash
npm run dev          # starts on http://localhost:3000
npm run dev:local    # applies local env, then starts dev server
npm run dev:live     # applies live env, then starts dev server
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run dev:local` / `npm run dev:live` | Apply an env preset, then start the dev server |
| `npm run build` | Production build |
| `npm run build:live` | Apply production env, then build |
| `npm run start` / `npm run start:prod` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler with no emit |

## Deployment

The app is deployed on [Vercel](https://vercel.com) at [mto-frontend.vercel.app](https://mto-frontend.vercel.app/). See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for general guidance.

> **Note:** This project pins a Next.js version with breaking API/convention changes from what may be in general training data. Check `node_modules/next/dist/docs/` before writing new code against it.
