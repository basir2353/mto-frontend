# MoveThisOut Android APK (Capacitor)

One APK for **customers** and **drivers**. The native shell loads the live Next.js app at `/app` (role picker → signup/login → customer booking or driver dashboard).

## Prerequisites

- Node 20+
- Android Studio (Hedgehog or newer) + Android SDK
- JDK 17
- A deployed frontend (default: `https://mto-frontend.vercel.app`)

## Install & sync

```bash
cd mto-frontend
npm install
npx cap sync android
npx cap open android
```

Optional: point the WebView at another host before sync:

```bash
# PowerShell
$env:CAPACITOR_SERVER_URL="https://your-frontend.example.com"
npx cap sync android
```

## Build APK (Android Studio)

1. Wait for Gradle sync to finish.
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)** for a debug APK.
3. Install from the IDE notification, or find:
   - `android/app/build/outputs/apk/debug/app-debug.apk`
4. For Play Store: **Build → Generate Signed Bundle / APK** (release keystore).

## Verify on device

1. Open MoveThisOut → welcome screen (**Need a move** / **Want to drive** / **Sign in**).
2. Customer: signup → `/customer-app` → plan → book.
3. Driver: `/driver-signup` or login as mover → `/driver-app`.
4. Force-close and reopen — session should persist (`localStorage`).

## Notes

- Auth tokens use `localStorage` (migrated from older `sessionStorage`).
- Backend CORS allows `capacitor://localhost`, `https://localhost`, and `http://localhost`.
- Geolocation plugin is included for driver GPS; camera/push can be added later.
