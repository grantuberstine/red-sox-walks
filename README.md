# WooSox Walk Tracker

A pitching analytics dashboard for the Worcester Red Sox (Triple-A, Boston affiliate). Tracks **walks**, **strikeouts**, **velocity**, and a "**No Pass Fund**" money game across the 2026 season.

Live data refreshes daily via Vercel Cron pulling the MLB Stats API.

---

## What's in the app

### Walks
Walks are classified into four overlapping buckets — a single walk can hit more than one:

| Category | Definition | Fee |
|---|---|---|
| **4-pitch walk** | Never threw a strike during the PA | $1 |
| **0-2 walk** | Count reached 0-2 then walked | $1 |
| **Leadoff walk** | First batter of any half-inning | $1 |
| **2-out walk** | Walk issued with 2 outs *and* bases empty | $1 |

### Strikeouts
Two K achievements tracked for the "Coaches Owe" side of the fund:

| Category | Definition | Coach pays |
|---|---|---|
| **3-pitch K** | Strikeout in exactly 3 pitches (all strikes) | $2 |
| **3-up-3-down inning** | All 3 outs by K, same pitcher, in a row | $10 |

### No Pass Fund
The money game: players pay the fund per walk-category trigger; coaches pay the fund per K achievement. Both sides accumulate independently — they don't cancel out. The Fund page shows totals, rules, and a per-pitcher ledger with both sides side-by-side.

### Analytics (velocity)
Per-pitcher velocity tracking pulled from Statcast pitch data:
- **Velocity** line chart — avg + max for a selected pitch type per outing
- **Pitch usage** chart — 100%-stacked bars showing pitch mix percentage per outing, with pitch codes inside each segment
- **Pitch count** line chart — total pitches thrown per outing
- Pitch-type filter, range filter, and hover tooltips throughout
- Pitch mix table + outing log with fastball-specific avg per outing

### Players
- Gallery with per-pitcher cards (filtered by hidden-pitcher list)
- Player profile: stats, walk/K breakdown, fund line, achievements, MLB.com profile link

### Team
- Win/loss record + game log with walks/Ks per game

---

## Stack

- **Next.js 16** (App Router, Server Components, Turbopack)
- **Tailwind CSS v4** with `@theme` + class-based dark mode
- **Vercel Blob** for state storage (single JSON file, free Hobby tier)
- **Vercel Cron** for daily refresh
- **MLB Stats API** as the data source (free, no API key)
- **PWA** with manifest + apple-touch-icon for home-screen install

---

## Deploy (one-time, ~5 minutes)

1. **Import the repo to Vercel**
   - Go to https://vercel.com/new
   - Pick this repo, click Deploy. Defaults are fine — Next.js is auto-detected.

2. **Add Blob storage**
   - Project dashboard → **Storage** tab → **Connect Database** → **Blob**.
   - Vercel auto-populates `BLOB_READ_WRITE_TOKEN`.

3. **Add `CRON_SECRET` env var**
   - Settings → Environment Variables → add `CRON_SECRET` (any long random string).
   - Apply to Production, Preview, and Development.
   - Redeploy after adding (Deployments → triple-dot → Redeploy).

4. **Backfill the season**
   ```
   https://<your-project>.vercel.app/api/backfill?token=<CRON_SECRET>
   ```
   Walks every WooSox game since opening day, classifies each play, saves to Blob. Takes ~30–60s.

5. **Done.** Visit the root URL. Vercel Cron auto-refreshes daily at 12:00 UTC (~7–8 AM ET).

---

## Daily update flow

- `vercel.json` registers `0 12 * * *` cron.
- Vercel hits `GET /api/refresh` with `Authorization: Bearer $CRON_SECRET`.
- The route scans the last 7 days of WooSox games, processes any unseen games (7-day window provides redundancy if a run is missed), writes updated state back to Blob.
- The dashboard reads Blob on initial render, then caches the result for 60s via `revalidate`.
- Fund / leaderboard / analytics all derive from the same `state.walks` / `state.strikeouts` / `state.velocity` arrays — no view can drift from another.

## Manual operations

| Action | URL |
|---|---|
| Trigger refresh manually | `GET /api/refresh?token=<CRON_SECRET>` |
| Backfill full season | `GET /api/backfill?token=<CRON_SECRET>` |
| Backfill a date range | `GET /api/backfill?token=<CRON_SECRET>&startDate=2026-04-01&endDate=2026-04-15` |
| Read raw JSON state | `GET /api/state` (public, no token needed; 60s cache) |

---

## Local development

```bash
npm install
npm run dev
```

The dashboard renders empty until you point it at a populated Blob. For local data testing without writing to Blob:

```bash
# Test the classifier on a single gamePk
npx tsx scripts/probe.ts 816958

# Run season-to-date in-memory
npx tsx scripts/probe.ts
```

---

## Data integrity notes

- Classifier filters by half-inning + home/away so only **WooSox pitchers** are counted. Opponent walks/Ks/velocity dropped.
- `state.processedGamePks` prevents double-counting if refresh runs twice on the same game.
- 2-out walk requires **2 outs AND bases empty** (per coach correction — was previously "first batter after 2 outs").
- 3-up-3-down inning requires exactly 3 PAs, all ending in `strikeout` (excludes `strikeout_double_play` because SDP produces 2 outs in 1 PA — can't satisfy the rule).
- Velocity pulled from `pitchData.startSpeed` per pitch, aggregated to per-appearance avg/max + per-pitch-type breakdown.
- "Fastball avg" stat shows the **primary fastball** (4-Seam preferred, else most-thrown of FT/SI/FC) so it matches the Pitch mix row exactly.

---

## Architecture quick reference

```
app/
  page.tsx                # Server entry — loadState() → DashboardClient (60s revalidate)
  layout.tsx              # Metadata, PWA, theme bootstrap
  Dashboard.tsx           # Main client component — sections + filters
  DashboardClient.tsx     # Dynamic-imports Dashboard with ssr:false (avoids localStorage hydration flicker)
  PitcherTable.tsx        # Walks + K leaderboard (sortable, mobile card view)
  icon.svg / apple-icon   # PWA icons
  manifest.ts             # PWA manifest
  globals.css             # Tailwind v4 theme tokens + dark mode
  api/
    refresh/route.ts      # Daily cron entry (7-day window)
    backfill/route.ts     # Full-season rebuild
    state/route.ts        # Public read-only JSON (60s revalidate)
  components/
    AnalyticsView.tsx     # Velocity charts + pitch mix + outing log
    FundView.tsx          # Two filled hero cards + rules + extended ledger
    PlayerProfile.tsx     # Per-pitcher detail with MLB.com link
    PlayersGallery.tsx    # Pitcher grid
    TeamView.tsx          # Record + game log
    CategoryLeaders.tsx   # Top-3 per walk category
    StrikeoutLeaders.tsx  # Top-3 per K category
    HeroBar.tsx           # Big-number hero (Walks/Ks pages)
    Sidebar.tsx           # Desktop sidebar + mobile tab bar
    PitcherPicker.tsx     # Search-able pitcher dropdown (Analytics)
    PitcherAvatar.tsx     # Next/Image-backed avatar with initials fallback
    RosterDrawer.tsx      # Show/hide individual pitchers
    FilterRow.tsx         # TimeRangePills dropdown
    SearchInput.tsx       # Search with suggestions
    ThemeToggle.tsx       # Light/dark
    WooSoxLogo.tsx        # Team logo from mlbstatic
    SearchInput / RecentWalksFeed / StrikeoutsFeed / ViewToggle ...
lib/
  constants.ts            # Team IDs (533), sport ID (11), season dates, blob key
  mlb-api.ts              # MLB Stats API client (schedule + game feed, with retry)
  walk-classifier.ts      # 4 walk-types + 2 K-types + velocity extraction
  storage.ts              # Vercel Blob read/write
  process.ts              # Schedule-walking pipeline (used by refresh + backfill)
  fund.ts                 # Fund report computation
  filters.ts              # Range / query / hidden-pitcher filters + aggregators
  achievements.ts         # Per-pitcher achievement detection
  preferences.ts          # localStorage hooks (hidden pitchers)
  theme.ts                # localStorage hooks (light/dark)
  auth.ts                 # CRON_SECRET check (Bearer header or ?token=)
  types.ts                # SeasonState, WalkRecord, StrikeoutRecord, AppearanceVelo, etc.
scripts/
  probe.ts                # Local classifier validation
vercel.json               # Cron schedule
next.config.ts            # Image remotePatterns for mlbstatic
```

---

## Free-tier sustainability

Designed to run entirely on Vercel Hobby + free MLB API:
- **Vercel Blob**: ~150KB state file × ~30 writes/month (one per cron) + page-cached reads → well under 5GB free quota.
- **Vercel Functions**: ~30 cron invocations + page hits → far under 100K/month free.
- **Vercel Cron**: Daily allowed on Hobby.
- **MLB Stats API**: free, no auth, ~5-10 calls per cron run.
- **Image optimization**: pitcher headshots served via Next/Image → AVIF/WebP from edge cache, ~50 unique images, fits 5K free transformations/month.

---

## What's intentionally not here

- No SSR for the dashboard chrome (dynamic-imported with `ssr: false`) — see `DashboardClient.tsx`. Done deliberately to avoid the localStorage hydration flicker on hidden-pitcher filtering. Initial paint shows a loading spinner, then the full UI mounts client-side with state already passed through as a prop.
- No user accounts / auth — single shared dashboard.
- No real-time pushes — data updates once daily via cron. 7-day refresh window covers any missed runs.
