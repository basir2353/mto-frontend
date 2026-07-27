# MoveThisOut Android APK (Capacitor)

One APK for **customers** and **drivers**. The native shell loads the live Next.js app at `/app`.

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (APK WebView) | https://mto-frontend-xi.vercel.app/app |
| Backend API | https://mto-backend-production.up.railway.app/api/v1 |

## Prerequisites

- Node 20+
- Android Studio (Hedgehog or newer) + Android SDK
- JDK 17

## Install & sync

```bash
cd mto-frontend
npm install
npx cap sync android
npx cap open android
```

Override host (optional):

```powershell
$env:CAPACITOR_SERVER_URL="https://mto-frontend-xi.vercel.app"
npx cap sync android
```

## Build APK (CLI)

Requires JDK **21** and Android SDK (platform 35 + build-tools).

```powershell
cd mto-frontend
$env:JAVA_HOME="D:\path\to\jdk-21"   # or any JDK 21
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:CAPACITOR_SERVER_URL="https://mto-frontend-xi.vercel.app"
npx cap sync android
cd android
.\gradlew.bat assembleDebug --no-daemon
```

Output:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- Also copied to `dist/MoveThisOut-debug.apk` after a local build

## Build APK (Android Studio)

1. `npm run apk:open`
2. Wait for Gradle sync.
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. Install `app-debug.apk` on a device/emulator.

## Verify on device

1. Open MoveThisOut → **Need a move** / **Want to drive** / **Sign in**
2. Customer: signup → book a move (API → Railway backend)
3. Driver: signup/login → driver dashboard
4. Force-close and reopen — session should persist

## Notes

- Capacitor `server.url` defaults to `https://mto-frontend-xi.vercel.app/app`
- Frontend production env already points API at Railway
- Backend CORS allows Capacitor WebView origins + the Vercel frontend
