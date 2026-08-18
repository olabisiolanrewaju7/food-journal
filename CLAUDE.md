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
npm run build        # Production build (will fail locally due to folder name — Vercel is unaffected)
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
TURSO_AUTH_TOKEN=...       # full 267-char JWT — truncated tokens return HTTP 400
RESEND_API_KEY=...         # for password reset emails
```

On Vercel, set `NEXTAUTH_URL=https://food-journal-jet.vercel.app` explicitly in environment variables (Production only) — `VERCEL_URL` alone resolves to per-deployment preview URLs which breaks password reset links.

## Architecture

**Next.js 14 App Router** with Turso (hosted SQLite), NextAuth v4 (JWT sessions), Claude vision, and Resend for email.

### Authentication & Middleware

- NextAuth credentials provider with bcrypt-hashed passwords (`lib/auth.ts`), cost factor 8 (not 10 — causes cold-start timeouts on Vercel)
- `middleware.ts` redirects unauthenticated users to `/splash` — public routes: `/login`, `/register`, `/splash`, `/forgot-password`, `/reset-password`, `/privacy`, `/api/auth`, `/api/register`
- Session is JWT; `user.id` stored in the token, available via `getServerSession(authOptions)` in API routes
- `types/next-auth.d.ts` extends NextAuth types to include `session.user.id` — do not remove
- All DB queries are scoped to `user_id` — never query without it
- `app/layout.tsx` exports `dynamic = 'force-dynamic'` — required for NextAuth on Vercel
- After registration, redirect with `window.location.href` not `router.push` — the latter silently fails after NextAuth operations

### Password Reset Flow

- `/forgot-password` → POST `/api/auth/forgot-password` → generates 32-byte token, stores in `password_reset_tokens`, emails link via Resend (1-hour expiry)
- `/reset-password?token=...` → POST `/api/auth/reset-password` → validates token, bcrypt-hashes new password, marks token used
- Always returns `{ success: true }` on forgot-password even if email not found (prevents enumeration)
- **Domain `foodsjournal.online` is verified in Resend** — reset emails send from `noreply@foodsjournal.online` and deliver to all users, not just the account owner
- **`NEXTAUTH_URL` must be set to `https://food-journal-jet.vercel.app`** in Vercel (Production env) — without it, `VERCEL_URL` resolves to a per-deployment preview URL and reset links break. `next.config.mjs` previously force-overrode this with `VERCEL_URL` on every build regardless of the dashboard value — that override was removed; do not re-add it

### User Flow

1. Unauthenticated → `/splash` (2.5s animated) → `/login`
2. Authenticated → `/` (home, today's meals + macro rings)

### Data Flow — Food Logging

1. User photographs food → `CameraCapture.tsx` base64-encodes via `FileReader`
2. Client POSTs `{ imageBase64, mimeType }` to `/api/analyze-food`
3. Server validates MIME allowlist + magic bytes, calls Claude vision (`claude-sonnet-4-6`) → returns `{ food_name, description, calories, protein, carbs, fat, fiber }`
4. `FoodAnalysisResult` shows result — user can tap **"Edit before logging"** to correct food name, trigger `/api/analyze-text` for AI re-analysis, or adjust macros manually
5. User confirms → POST `/api/log` → saved to Turso with `user_id`
6. Home page refreshes from `/api/log?date=YYYY-MM-DD`; cached in `localStorage` (`fj-entries-YYYY-MM-DD`)

### API Routes

All POST routes require `Content-Type: application/json` and a valid session (except `/api/register` and `/api/auth/*`). Input validated with **Zod**. Set `export const maxDuration = 60` on any route that calls Claude.

| Route | Notes |
|-------|-------|
| `POST /api/analyze-food` | Rate-limited 20/min; MIME + magic byte validation; Claude vision |
| `POST /api/analyze-text` | Rate-limited 20/min; text-based macro estimation from food name |
| `GET\|POST\|PATCH\|DELETE /api/log` | CRUD for food entries, scoped to session user |
| `GET /api/daily-summary?days=N` | N clamped to 1–365 |
| `POST /api/advice` | Rate-limited 10/min; 6hr client cache; strips `image_data` before prompt |
| `POST /api/cravings` | Conversational craving suggestions with cuisine + goal context |
| `POST /api/recipe` | Claude generates ingredients + steps for a dish, scaled by servings |
| `POST /api/restaurants` | Claude suggests restaurants + builds Uber Eats / DoorDash deep links |
| `GET\|POST\|DELETE /api/body-stats` | Body weight/fat log, scoped to user |
| `POST /api/auth/forgot-password` | Generates reset token, sends email via Resend |
| `POST /api/auth/reset-password` | Validates token, updates password hash |
| `POST /api/register` | Public; bcrypt cost 8 |
| `POST\|DELETE /api/push/register` | Stores/removes a device's push token in `push_tokens`; see Notifications section |

### Database (`database/db.ts`)

All functions are **async** — uses `@libsql/client` (Turso). No synchronous DB calls.

- `getDb()` replaces `libsql://` with `https://` — WebSocket transport is unreliable on Vercel serverless
- `lastInsertRowid` returns `BigInt` — always wrap with `Number()` before returning in JSON
- No migration logic at request time — tables must already exist in Turso
- Tables: `users`, `food_entries` (includes `image_data` TEXT), `body_stats`, `password_reset_tokens`
- `push_tokens` (id, user_id, token UNIQUE, platform, created_at) stores device push tokens for a future server-push feature — the table exists and the registration endpoint is fully live, but there is no APNs-sending code yet (needs an Auth Key from an active Apple Developer account)

### Cravings Feature (`/cravings`)

- Voice input via Web Speech API (`continuous: true`, `interimResults: true`) — auto-sends on mic stop or when user says "send"
- Web Speech API is iOS Safari only — Chrome on iOS is detected via UA and shown an informational message instead
- Conversation history (last 10 messages) sent to `/api/cravings` on each turn
- Cuisine preferences and past choices stored in `localStorage` (`healthyyou-craving-prefs`) and fed into every Claude call
- Each suggestion card has **Make it** (recipe + grocery checklist) and **Order it** (restaurant suggestions + Uber Eats/DoorDash links) panels — only one panel open at a time
- Page uses `height: 100dvh` flex column layout (not `min-h-screen`) to keep input bar pinned on mobile

### Body Stats (`/settings/body-stats`)

- Logs weight (kg) and optional body fat % to `body_stats` table in Turso
- Three tabs: Log Stats, Progress (Recharts line chart), My Goal
- Goal (target weight, body fat %, optional date) stored in `localStorage` (`healthyyou-body-goal`)
- ETA calculated client-side from rate of change across all logged entries

### Notifications (`/settings/notifications`)

- **Local reminders** (fully functional): `@capacitor/local-notifications` schedules multiple daily-repeating notifications starting at a user-chosen time, spaced by a chosen interval (2/3/4/6/8h), stopping before midnight rather than rolling forward indefinitely — `computeReminderTimes()` generates the schedule client-side. Notification IDs are `1001` through `1001 + MAX_REMINDERS - 1` (currently 8); toggling off cancels that whole ID range regardless of how many were actually scheduled.
- **Push groundwork** (not yet sending): `@capacitor/push-notifications` registers a device token client-side and POSTs it to `/api/push/register`, which upserts into `push_tokens`. The table and endpoint are fully live — what's missing is APNs-sending code (needs an Auth Key from an active Apple Developer account) and a scheduled job deciding who/when to notify. Toggling reminders off also calls `DELETE /api/push/register?token=...` to remove the stored token.
- Both plugins are gated behind `Capacitor.isNativePlatform()` — the page shows an informational banner instead of a toggle when accessed via a browser/PWA, since neither plugin functions there.
- Preferences stored in `localStorage` (`healthyyou-notification-prefs`); loader merges over `DEFAULT_PREFS` rather than trusting stored data outright, since the schema has already changed once (single `time` → `startTime` + `intervalHours`) and un-merged old data crashes `computeReminderTimes()`.
- Registered push token cached in `localStorage` (`healthyyou-push-token`) so it can be looked up again for deletion when reminders are toggled off.

### Rate Limiting

`lib/rateLimit.ts` is in-memory per-process. On Vercel serverless each instance has its own counter — fine for current scale; replace with Redis/Upstash for multi-instance.

### Navigation

- `BottomNav` tabs: Home, History, Cravings (Flame icon), Coach, Settings
- Hidden on `/login`, `/register`, `/splash`; also hidden during photo preview and analysis via `NavContext` (`lib/NavContext.tsx`)
- `useNav()` provides `{ hideNav, setHideNav }`; home page sets `hideNav: true` when `pendingAnalysis` or `cameraHasPreview` is non-null
- `BottomNav` has `z-50` and `touchAction: manipulation` on links; guards with `useState(false)` + `useEffect` before rendering to prevent SSR crash — do not remove this guard

### Caching

localStorage as stale-while-revalidate:
- Home: `fj-entries-YYYY-MM-DD`
- History: `fj-summary-N`
- Coach advice: `fj-advice-{goal-slug}` (6-hour TTL)

### Design System

- **Background**: `#c8e6c9` (sage green)
- **Header gradient**: `linear-gradient(135deg, #004d1a 0%, #007a2e 60%, #00c853 100%)`
- **Macro colors**: Protein `#f43f5e`, Carbs `#f97316`, Fat `#8b5cf6`, Fiber `#06b6d4`
- **Cards**: white bg, `boxShadow: '0 2px 12px rgba(26,61,43,0.08)'`
- Tailwind for layout; inline `style` props for all colour/shadow tokens

### localStorage Keys

| Key | Contents |
|-----|----------|
| `healthyyou-goals` | `{ calories, protein, carbs, fat, fiber }` |
| `healthyyou-bio` | `{ name, age, height, weight, gender }` |
| `healthyyou-body-goal` | `{ target_weight_kg, target_body_fat_pct, target_date }` |
| `healthyyou-craving-prefs` | `{ cuisines, pastChoices, dietaryNotes }` |
| `healthyyou-notification-prefs` | `{ enabled, startTime, intervalHours }` |
| `healthyyou-push-token` | Registered device push token, if any (for later deletion) |
| `fj-entries-YYYY-MM-DD` | Today's food entries array |
| `fj-summary-N` | N-day history summary |
| `fj-advice-{slug}` | Cached coach advice with timestamp |

### Product Context

- Target users: health-conscious adults 20–60 who want effortless nutrition tracking
- North Star metric: Daily Active Users (DAU)
- Business model: Freemium (ads) + Pro subscription (~$9.99/mo, no ads)
- Phase 2 roadmap: smart grocery integration (Instacart/Amazon Fresh), AI menu scanner, PWA, TDEE auto-calculation, accountability partner matching
- Full PRD lives in the team Google Doc (Tab 6)

### Settings Pages

`/settings` links to: `/settings/goals` (nutrition targets), `/settings/bio` (profile), `/settings/body-stats` (weight tracking + goals), `/settings/notifications` (meal reminders, see Notifications section), `/settings/payment` (Stripe placeholder, not wired up).

`MacroProgressBars` and `app/settings/goals/page.tsx` both define `DEFAULT_GOALS` — keep them in sync.
