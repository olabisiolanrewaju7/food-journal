# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Running the Dev Server

The folder name `HealthyYou!` contains an exclamation mark which **breaks webpack**. Always use Turbopack:

```bash
npm run dev   # already configured with --turbo, port 3000
```

Never run `next dev` without `--turbo`.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without building
```

## Environment

`.env.local` requires:
```
ANTHROPIC_API_KEY=...
NEXTAUTH_SECRET=...        # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

On Vercel, `NEXTAUTH_URL` is auto-derived from `VERCEL_URL` in `next.config.mjs` — do not override it there.

## Architecture

**Next.js 14 App Router** with Turso (hosted SQLite), NextAuth v4 (JWT sessions), and Claude vision.

### Authentication

- NextAuth credentials provider with bcrypt-hashed passwords (`lib/auth.ts`), cost factor 8
- `middleware.ts` redirects unauthenticated users to `/splash` — covers all routes except `/login`, `/register`, `/splash`, `/api/auth`, `/api/register`
- Session is JWT; `user.id` is stored in the token and available via `getServerSession(authOptions)` in API routes
- `types/next-auth.d.ts` extends NextAuth types to include `session.user.id` — do not remove
- All DB queries are scoped to `user_id` — never query without it
- `app/layout.tsx` exports `dynamic = 'force-dynamic'` — required for NextAuth to work on Vercel (prevents static pre-rendering which has no request URL)
- After registration, redirect with `window.location.href` not `router.push` — the latter silently fails in this context

### User Flow

1. Unauthenticated user → `/splash` (2.5s animated splash) → `/login`
2. Authenticated user → `/` (home, today's meals + macro rings)

### Data Flow

1. User photographs food → `CameraCapture.tsx` base64-encodes via `FileReader`
2. Client POSTs `{ imageBase64, mimeType }` to `/api/analyze-food`
3. Server validates MIME allowlist + magic bytes, calls Claude vision (`claude-sonnet-4-6`) → returns `{ food_name, description, calories, protein, carbs, fat, fiber }`
4. `FoodAnalysisResult` shows the result — user can tap **"Edit before logging"** to correct food name, trigger `/api/analyze-text` for AI re-analysis, or adjust macros manually
5. User confirms → POST to `/api/log` → saved to Turso with `user_id`
6. Home page refreshes from `/api/log?date=YYYY-MM-DD`; results cached in `localStorage` (`fj-entries-YYYY-MM-DD`) for instant display on revisit

### API Routes

All POST routes require `Content-Type: application/json` and a valid session. Input is validated with **Zod**.

- `POST /api/analyze-food` — rate-limited (20/min per IP); validates MIME type + magic bytes; Claude vision
- `POST /api/analyze-text` — rate-limited (20/min per IP); takes `{ food_name }` string, returns macro estimates from Claude (used for editing/re-analysis)
- `GET|POST|PATCH|DELETE /api/log` — CRUD for food entries, scoped to session user; PATCH updates macros on an existing entry
- `GET /api/daily-summary?days=N` — N clamped to 1–365
- `POST /api/advice` — rate-limited (10/min per IP); sanitises `goal` string before prompt injection
- `POST /api/register` — public; creates user with bcrypt hash (cost 8)
- `GET|POST /api/auth/[...nextauth]` — NextAuth handler

### Database (`database/db.ts`)

All functions are **async** — uses `@libsql/client` (Turso). No synchronous DB calls anywhere.

- `users` — id, name, email (unique), password_hash
- `food_entries` — scoped to `user_id`; includes `image_data` (TEXT, capped at ~8 MB via Zod)
- `lastInsertRowid` from `@libsql/client` returns `BigInt` — always wrap with `Number()` before returning in JSON responses
- Turso URL must use `https://` transport (not `libsql://`) — `getDb()` replaces the protocol automatically; WebSocket transport is unreliable on Vercel serverless
- No init/migration logic runs at request time — tables must already exist in Turso

### Rate Limiting

`lib/rateLimit.ts` is a simple in-memory store (per-process). On Vercel serverless each instance has its own counter — fine for current scale; replace with Redis/Upstash for multi-instance.

### Navigation

- `BottomNav` is hidden on `/login`, `/register`, `/splash`
- `BottomNav` is also hidden while a food analysis is pending, via `NavContext` (`lib/NavContext.tsx`) — `useNav()` provides `{ hideNav, setHideNav }`; home page sets `hideNav: true` when `pendingAnalysis` is non-null
- `BottomNav` guards with `const [mounted, setMounted] = useState(false)` and returns `null` until after hydration — prevents `usePathname()` crashing during SSR; do not remove this guard

### Caching

Home and History pages use `localStorage` as a stale-while-revalidate cache:
- Home: key `fj-entries-YYYY-MM-DD`
- History: key `fj-summary-N` (where N is the day range)

Cached data is shown instantly on mount; fresh data fetched in background and written back to cache.

### Design System

- **Background**: `#c8e6c9` (sage green)
- **Header gradient**: `linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)`
- **Macro ring colors**: Protein `#f43f5e`, Carbs `#f97316`, Fat `#8b5cf6`, Fiber `#06b6d4`
- **Cards**: white bg, `boxShadow: '0 2px 12px rgba(26,61,43,0.08)'`
- Styling uses Tailwind for layout; inline `style` props for all colour/shadow tokens

### User Goals & Profile

Stored in `localStorage`:
- `healthyyou-goals` — `{ calories, protein, carbs, fat, fiber }`
- `healthyyou-bio` — `{ name, age, height, weight, gender }`

`MacroProgressBars` and `app/settings/goals/page.tsx` both define `DEFAULT_GOALS` — keep them in sync.

### Settings Sub-pages

Settings is a menu page (`app/settings/page.tsx`) linking to:
- `/settings/goals` — nutrition targets
- `/settings/bio` — personal profile
- `/settings/payment` — Stripe placeholder (not wired up)
