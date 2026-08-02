# MoveThisOut Android APKs (Capacitor)

Two separate apps:

| APK | Package ID | Starts at |
|-----|------------|-----------|
| **Customer** | `com.movethisout.customer` | `/app/customer` |
| **Driver** | `com.movethisout.driver` | `/app/driver` |

Both load the live Next.js site (default `https://mto-frontend-xi.vercel.app`).

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://mto-frontend-xi.vercel.app |
| Backend API | https://mto-backend-production.up.railway.app/api/v1 |

## Build both debug APKs

Requires JDK **21** and Android SDK.

```powershell
cd mto-frontend
$env:JAVA_HOME="D:\path\to\jdk-21"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
npm run apk:debug
```

Outputs:

- `dist/MoveThisOut-Customer-debug.apk`
- `dist/MoveThisOut-Driver-debug.apk`

Build one flavor:

```powershell
npm run apk:debug:customer
npm run apk:debug:driver
```

## Notes

- Demo login credentials and fake Google/Apple buttons are removed from auth.
- Customer APK has no “Want to drive” entry; Driver APK has no customer booking entry.
- Logout returns to the matching `/app/customer` or `/app/driver` welcome screen.
