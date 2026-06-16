# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Running the Dev Server

The folder name `HealthyYou!` contains an exclamation mark which **breaks webpack**. Always use Turbopack:

```bash
npm run dev          # already configured with --turbo
```

Never run `next dev` without `--turbo` — it will crash with a webpack path validation error.

## Commands

```bash
npm run dev          # Start dev server (Turbopack, port 3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without building
```

## Architecture

**Next.js 14 App Router** — all routes live in `app/`. API routes and UI pages coexist.

### Data Flow

1. User captures/uploads a food photo → `CameraCapture.tsx` base64-encodes it via `FileReader`
2. Client POSTs `{ imageBase64, mimeType }` to `/api/analyze-food`
3. Server calls Claude vision (`claude-sonnet-4-6`) → returns structured JSON with `{ food_name, description, calories, protein, carbs, fat, fiber }`
4. User confirms → POST to `/api/log` → saved to SQLite
5. Home page refreshes entries from `/api/log?date=YYYY-MM-DD`

### Key Directories

- `app/api/` — four routes: `analyze-food`, `log` (GET/POST/DELETE), `daily-summary`, `advice`
- `components/` — all UI components, all client-side (`'use client'`)
- `database/db.ts` — SQLite singleton via `better-sqlite3`; exports prepared statement helpers (`insertEntry`, `getEntriesByDate`, `getAllEntries`, `deleteEntry`, `getDailySummaries`, `getRecentEntries`)
- `lib/anthropic.ts` — Anthropic client singleton
- `types/index.ts` — shared interfaces: `FoodEntry`, `DailySummary`, `FoodAnalysis`

### Database

SQLite file at `healthyyou.db` in the project root (auto-created on first run). Single table `food_entries`. `better-sqlite3` is synchronous — no async/await needed in DB calls.

`next.config.mjs` must include `serverComponentsExternalPackages: ['better-sqlite3']` to prevent Next.js from bundling this native module for the browser.

### User Goals

Daily macro goals (calories, protein, carbs, fat, fiber) are stored in `localStorage` under the key `healthyyou-goals`. `MacroProgressBars` and `Settings` page both read/write this key. Default values are defined inline in both files — keep them in sync.

### Design System

- **Background**: `#f5f0e8` (warm cream)
- **Header gradient**: `linear-gradient(135deg, #1a3d2b 0%, #2d6a4f 60%, #40916c 100%)`
- **Macro colors**: Protein `#ec4899`, Carbs `#f97316`, Fat `#8b5cf6`, Fiber `#40916c`, Calories `#f97316`
- **Cards**: white with `boxShadow: '0 2px 12px rgba(26,61,43,0.08)'` and `border: '1px solid #f0ebe3'`
- All styling uses inline `style` props for non-Tailwind values (colors, shadows)

### BottomNav SSR Fix

`BottomNav` uses `usePathname()` which must be wrapped in `<Suspense>` in `app/layout.tsx` to prevent a server-side render crash when navigating to pages with error boundaries.

## Environment

Requires `ANTHROPIC_API_KEY` in `.env.local`. Claude model used: `claude-sonnet-4-6`.
