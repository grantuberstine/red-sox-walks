# WooSox Walk Tracker

A dashboard that tracks Worcester Red Sox pitcher walks by category — built for the 2026 season.

Walks are classified into four overlapping buckets:

| Category | Definition |
|---|---|
| **4-pitch walk** | Pitcher threw 4 balls in a row, never recording a strike |
| **0-2 → BB** | Count reached exactly 0-2 during the PA, then the pitcher walked the batter |
| **Leadoff walk** | First batter of any half-inning gets walked |
| **2-out walk** | Walk issued with 2 outs already recorded in the inning |

A single walk can belong to multiple categories (e.g., a leadoff walk that goes 4 pitches).

## Stack

- **Next.js 16** (App Router, Server Components, Tailwind v4)
- **Vercel Blob** for state storage (single JSON file, free tier)
- **Vercel Cron** for daily refresh
- **MLB Stats API** as the data source (free, no API key)

## Deploy (one-time, ~5 minutes)

1. **Import the repo to Vercel**
   - Go to https://vercel.com/new
   - Pick this repo, click Deploy. Defaults are fine — Next.js auto-detected.

2. **Add Blob storage**
   - In the project dashboard → **Storage** tab → **Connect Database** → **Blob**.
   - Vercel auto-populates `BLOB_READ_WRITE_TOKEN` as an env var.

3. **Add `CRON_SECRET` env var**
   - Settings → Environment Variables → add `CRON_SECRET` with any long random string.
   - Apply to Production, Preview, and Development.
   - Redeploy after adding (Deployments → triple-dot → Redeploy).

4. **Backfill the season**
   - Hit this URL once (replace placeholders):
     ```
     https://<your-project>.vercel.app/api/backfill?token=<your CRON_SECRET>
     ```
   - This walks every WooSox game since opening day, classifies each walk, and saves to Blob. Takes ~30–60 seconds.

5. **Done.** Visit the project root URL to see the dashboard. Vercel Cron will auto-refresh daily at 12:00 UTC (~7-8 AM ET).

## How the daily update works

- `vercel.json` registers a cron at `0 12 * * *`.
- Vercel hits `GET /api/refresh` (with `Authorization: Bearer $CRON_SECRET`).
- That route scans the last 7 days of WooSox games, processes any games it hasn't seen yet, and writes the updated state back to Blob.
- The dashboard reads the Blob on each page load.

## Manual operations

| Action | URL |
|---|---|
| Trigger refresh manually | `GET /api/refresh?token=<CRON_SECRET>` |
| Backfill full season | `GET /api/backfill?token=<CRON_SECRET>` |
| Backfill a date range | `GET /api/backfill?token=<CRON_SECRET>&startDate=2026-04-01&endDate=2026-04-15` |
| Read raw JSON state | `GET /api/state` (public, no token needed) |

## Local development

```bash
npm install
npm run dev
```

The dashboard will render an empty state until you point it at a populated Blob. For local data testing, run the probe script:

```bash
# Test the classifier on a single gamePk
npx tsx scripts/probe.ts 816958

# Run season-to-date in-memory (no Blob writes)
npx tsx scripts/probe.ts
```

## Data integrity notes

- The classifier filters by half-inning + home/away to ensure only **WooSox pitchers** are counted. Opponent walks are dropped.
- `processedGamePks` prevents double-counting if refresh runs twice on the same game.
- The MLB Stats API serves the same data as MLB Gameday, so classification matches what you'd see scoring the game live.

## File layout

```
app/
  page.tsx              # Dashboard
  PitcherTable.tsx      # Sortable table client component
  api/
    refresh/route.ts    # Daily cron entry
    backfill/route.ts   # Full-season backfill
    state/route.ts      # Public read-only JSON
lib/
  constants.ts          # Team IDs, season dates, blob key
  mlb-api.ts            # MLB Stats API client
  walk-classifier.ts    # 4 walk-type classification logic
  storage.ts            # Vercel Blob read/write
  process.ts            # Shared schedule-walking pipeline
  auth.ts               # CRON_SECRET check
  types.ts              # Shared types
scripts/
  probe.ts              # Local validation tool
vercel.json             # Cron schedule
```
