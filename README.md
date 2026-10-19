# CineTrack v2

> **Track. Rate. Remember.** A fast, installable, offline-capable personal movie and TV tracking Progressive Web App.

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vitejs.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Workbox-orange.svg)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Private Single-Owner Architecture

CineTrack v2 is configured as a **private, single-owner application**. Access is restricted strictly to one Google account (`nigotiyanaitik@gmail.com`) using defense-in-depth across three architectural layers:

1. **Database Layer (`firestore.rules` - Real Lock):**
   The helper function `isOwner()` verifies that `request.auth != null`, `request.auth.token.email_verified == true`, and `request.auth.token.email.lower() == 'nigotiyanaitik@gmail.com'`. User documents require both `isOwner()` and `request.auth.uid == userId`. All other collections and paths default-deny.
2. **Server API Layer (`OWNER_EMAIL` - API Proxy Lock):**
   The TMDB serverless proxy (`/api/tmdb`) verifies Firebase ID tokens using the Firebase Admin SDK and returns `403 FORBIDDEN` unless `decoded.email_verified === true` and `decoded.email.toLowerCase() === process.env.OWNER_EMAIL.toLowerCase()`. Never logs tokens or emails.
3. **Client UX Layer (`VITE_OWNER_EMAIL` - AuthGate):**
   The client-side `AuthGate` checks the signed-in user's email against `VITE_OWNER_EMAIL`. If a non-owner signs in, it immediately signs them out, flushes TanStack Query and IndexedDB caches, and shows a clear "This is a private app. Access denied." screen with a "Use a different account" button. (This client check is purely for friendly UX; the database and API proxy enforce actual security).

---

## Key Features

- **Private Single-Owner Model**: Strict isolation to the verified owner account across rules, proxy, and client gate.
- **Zero-Secret Client Bundle**: All TMDB metadata queries route through a serverless proxy (`/api/tmdb`) with route allow-listing and server-side token injection.
- **Atomic Multi-Document Operations**: Transactional writes (`writeBatch`, `runTransaction`) ensure history logging, status updates, and summary counters never drift.
- **TV Episode Progression**: Track shows episode-by-episode with season maps, collapsible overviews, "mark all up to here", and confetti show-completion celebrations.
- **Calendar & Planning**: Month and agenda views combining scheduled watches and upcoming episode air dates.
- **Rich Interactive Analytics**: Recharts visualizations for watch time, top genres, rating distribution, release decades, 16-week activity heatmap, and annual "Year in Review" highlights.
- **PWA & Offline Resilience**: Powered by `vite-plugin-pwa` and Workbox with `CacheFirst` strategies for posters and multi-tab IndexedDB cache for offline library and history browsing.
- **Data Tools**: Full JSON backup export, Letterboxd CSV import wizard (`watched.csv`, `ratings.csv`), and counter repair engine (`recomputeStats`).
- **Zero Search Engine Indexing**: Blocked via `<meta name="robots" content="noindex, nofollow">` and `public/robots.txt` (`Disallow: /`).

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- Firebase project (`cinetrack-v2-45db2`)
- TMDB API Read Access Token

### Environment Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure the environment variables:
```env
# Single-Owner Access Control
OWNER_EMAIL="nigotiyanaitik@gmail.com"
VITE_OWNER_EMAIL=""

# Client (VITE_ prefix is exposed to the browser)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_USE_EMULATORS="false"

# Server-only (Used in /api serverless functions, NEVER prefix with VITE_)
TMDB_READ_TOKEN=your_tmdb_read_token
FIREBASE_CLIENT_EMAIL=your_firebase_admin_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_PROJECT_ID=your_project_id
```

> **Note on Client Owner Email:** `VITE_OWNER_EMAIL` is used only for display messages in AuthGate. To ensure the owner email is never baked into production client bundles, leave it empty or configure it only in private deployment environments.

---

## Firebase Console Setup (Manual Steps)

Perform these one-time manual steps in the Firebase Console:

1. **Authentication > Sign-in method**:
   - Enable **Google** sign-in provider.
   - **DISABLE Email/Password** provider.
2. **Authentication > Settings > User actions**:
   - After the owner has logged in for the first time, navigate to **Settings > User actions**.
   - Turn **OFF** the toggle for **"Enable create (sign-up)"**.
   - *Result:* No new accounts can ever be created in Firebase Authentication.
   - *To temporarily re-enable:* Return to **Settings > User actions**, toggle "Enable create (sign-up)" back **ON**, complete account creation, and immediately turn it back **OFF**.
3. **Authentication > Settings > Authorized domains**:
   - Ensure only `localhost` and your verified production Vercel/custom domains are listed. Remove unused domains.

---

## Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Starts Vite dev server with hot module replacement |
| `build` | `npm run build` | Compiles TypeScript and builds production PWA bundle |
| `typecheck` | `npm run typecheck` | Validates strict TypeScript compilation (`tsc -b --noEmit`) |
| `lint` | `npm run lint` | Runs Oxlint across all TypeScript and CSS files |
| `test` | `npm run test` | Runs unit tests via Vitest |

---

## Attribution & Data Sources

This product uses the TMDB API but is not endorsed or certified by TMDB. All movie and TV metadata, posters, cast information, and watch provider links are provided by [The Movie Database (TMDB)](https://www.themoviedb.org/).

---

## License

MIT License. See [LICENSE](LICENSE) for details.
