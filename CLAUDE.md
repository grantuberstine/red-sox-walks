# CLAUDE.md — Context for a fresh AI session

You're picking up work on the **WooSox Walk Tracker**, an internal pitching-analytics dashboard for the **Worcester Red Sox** (Boston Red Sox Triple-A affiliate). It's been iterated across 60+ versions. Read this file before doing anything substantive.

---

## What this is

A single-page web app on Vercel that:
1. Pulls daily game data from the public MLB Stats API
2. Classifies walks, strikeouts, and per-pitch velocity for every WooSox pitcher
3. Renders a multi-section dashboard (Walks / Strikeouts / Players / Team / Analytics / No Pass Fund)
4. Powers a money game called the **No Pass Fund**: players pay the fund for each walk-category trigger, coaches pay it for each K achievement

Built for the user (Grant) who plays/coaches with the team and wants a real tool — not a toy.

## The user

- **Grant Uberstine** — works at a real estate firm but plays/coaches for the Worcester Red Sox on the side. Largely non-technical. Values:
  - Concise replies. No fluff, no preamble. Get to the point.
  - Just execute simple tasks. Use plan mode only for complex multi-file changes.
  - Auto-commit after work, but **always ask before pushing to remote**.
  - Always verify UI with preview/screenshots before saying "done."
  - Strong opinions on aesthetics — banned colors over time: yellow, gold, pink, purple. Likes Sox red, navy, emerald, dark mode.

## Stack

- **Next.js 16** App Router, TypeScript, Turbopack
- **Tailwind v4** with `@theme` + class-based dark mode (`.dark` on `<html>`)
- **Vercel Blob** (free Hobby tier) — single JSON file holds all season state (~150KB)
- **Vercel Cron** — daily refresh at 12:00 UTC
- **MLB Stats API** — schedule + per-game live feed (no auth, free)
- **PWA** — manifest + apple-touch-icon for home-screen install

No database, no auth, no real-time. By design (see "intentionally not here" below).

## Data flow

```
MLB Stats API
  ↓ /api/refresh (daily cron) or /api/backfill (on-demand reset)
processGames() → fetchGameFeed + classifyWooSoxEvents per game
  ↓
applyEventsToState() merges into SeasonState
  ↓
Vercel Blob (single file: woosox-state-2026.json)
  ↑ loadState() server-side, 60s revalidate cache
  ↓
app/page.tsx → DashboardClient (dynamic ssr:false) → Dashboard
  ↓ derived via useMemo: filtered walks/Ks, fund report, aggregates
All views render from the same source. Hidden-pitcher filter, range filter,
query filter all apply uniformly. No view can drift from another.
```

## The five core data structures

- **`SeasonState`** (lib/types.ts) — the entire app state. Pitchers map, walks array, strikeouts array, velocity map (per-pitcher per-game), games list, processed gamePks, meta.
- **`WalkRecord` / `StrikeoutRecord`** — one per event, tagged with classification (`fourPitch | ohTwo | leadoff | twoOut`, `threePitch | side`).
- **`PitcherStats`** — aggregate totals per pitcher (IP, BB, K, category breakdowns).
- **`AppearanceVelo`** — per-pitcher per-game velocity + boxscore line (outs, walks, strikeouts, ER, HR, HBP, hits, byType pitch breakdown).
- **`FundReport`** — derived view of who owes what.

## The four walk categories + two K categories

Walks (player pays $1 to fund per category triggered, walk can stack):
- **4-pitch** — pitcher threw 0 strikes in the PA
- **0-2** — count reached 0-2 then walked
- **Leadoff** — first batter of any half-inning
- **2-out** — walk with **2 outs AND bases empty** (per coach correction; was "first batter after 2nd out" until v23)

Strikeouts (coach pays):
- **3-pitch K** ($2) — strikeout in exactly 3 pitches (all strikes)
- **3-up-3-down inning** ($10) — exactly 3 PAs in a half-inning, all K by the same pitcher

> **Subtle correctness note**: 3-up-3-down requires `eventType === "strikeout"` exactly. `strikeout_double_play` is intentionally excluded — SDP produces 2 outs in 1 PA, so an inning containing one cannot have 3 separate K-PAs.

## Pitcher rate stats

All computed from summed `AppearanceVelo` records:
- **ERA** = (ER × 27) / outs
- **WHIP** = (BB + H) / IP
- **FIP** = (13·HR + 3·(BB+HBP) − 2·K) / IP + 3.10 (constant ~3.10)
- **K/9** = (K × 27) / outs
- **BB/9** = (BB × 27) / outs

"Fastball avg" = the **primary fastball** (4-Seam if thrown, else most-thrown of FT/SI/FC) avg. Matches the Pitch Mix row for the same code. Don't reintroduce "weighted across all fastballs" — Grant explicitly rejected that.

## Architecture map

```
app/
  page.tsx                # Server: loadState() → DashboardClient
  DashboardClient.tsx     # Client wrapper, dynamic-imports Dashboard (ssr: false)
  Dashboard.tsx           # Main app. State (section/range/profileId/query). Routes
                          # to one of six section components. URL deep linking,
                          # scrollTop helper, theme handling. ~630 lines.
  layout.tsx              # Metadata, PWA viewport, inline theme bootstrap
  PitcherTable.tsx        # Walks + K leaderboards (sortable table + mobile cards)
  globals.css             # Tailwind v4 theme tokens. Light + dark palettes.
  icon.svg / apple-icon   # PWA icons
  manifest.ts             # PWA manifest
  api/
    refresh/route.ts      # Daily cron entry (7-day scan)
    backfill/route.ts     # Full-season rebuild (?reset=1 wipes state)
    state/route.ts        # Public read-only JSON (60s revalidate)
  components/
    AnalyticsView.tsx     # ~1.6K lines: charts, pitch mix, outings. Big but works.
    FundView.tsx          # Two filled hero cards + rules + clickable ledger
    PlayerProfile.tsx     # 10-stat strip + walk/K logs + Copy link
    PlayersGallery.tsx    # Pitcher grid with ERA/WHIP/FIP cards
    TeamView.tsx          # Record + game log + trend chart
    CategoryLeaders.tsx   # Top-3 per walk category
    StrikeoutLeaders.tsx  # Top-3 per K category
    HeroBar.tsx           # Big-number hero (Walks/Ks pages)
    Sidebar.tsx           # Desktop sidebar + mobile bottom tab bar
    PitcherPicker.tsx     # Search-able dropdown (Analytics)
    PitcherAvatar.tsx     # Next/Image-backed avatar with initials fallback
    RosterDrawer.tsx      # Show/hide individual pitchers
    FilterRow.tsx         # TimeRangePills dropdown component
    SearchInput.tsx       # Search with suggestions
    ThemeToggle.tsx       # Light/dark toggle
    WooSoxLogo.tsx        # Team logo from mlbstatic
    InningChart.tsx       # Per-inning walks/Ks chart
    TrendChart.tsx        # Time-series chart
    ViewToggle.tsx        # Table vs Cards (desktop only)
    RecentWalksFeed.tsx   # Walk feed
    StrikeoutsFeed.tsx    # K feed
lib/
  constants.ts            # Team IDs (533), sport ID (11), season dates
  mlb-api.ts              # MLB Stats API client + 3-attempt retry
  walk-classifier.ts      # 4 walk-types + 2 K-types + velocity extraction
                          # Reads play-by-play AND boxscore for full line
  storage.ts              # Vercel Blob read/write + state mutation
  process.ts              # Schedule-walking pipeline (refresh + backfill share)
  fund.ts                 # Fund report computation
  filters.ts              # Range / query / hidden-pitcher filters + aggregators.
                          # Range can be a RangeKey (today/week/month/season) OR
                          # a `series:<gamePk>`. computeSeries() groups consecutive
                          # games vs one opponent; a series filters as its date block.
  achievements.ts         # Stub (used to host gamified labels — purged v60).
                          # Still exports headshotUrl() and a no-op
                          # computeAchievements()
  preferences.ts          # localStorage hooks (hidden pitchers)
  theme.ts                # localStorage hooks (light/dark). Default: dark
  auth.ts                 # CRON_SECRET check
  types.ts                # SeasonState, WalkRecord, StrikeoutRecord, AppearanceVelo
scripts/
  probe.ts                # Local classifier validation tool
vercel.json               # Cron schedule (0 12 * * *)
next.config.ts            # Image remotePatterns for mlbstatic
```

## Key UX rules (don't violate without asking)

- **Dark mode by default**. OS preference is ignored on first load. User can toggle.
- **No yellow, gold, pink, purple** anywhere user-facing. Sox red + emerald + blue/cyan/teal family + neutrals only.
- **Pitch type colors** are functional (need to be distinct). Approved palette in `AnalyticsView.tsx::PITCH_COLORS`. SI/FC/ST were too similar before; FC is now brown (#92400e) to break the green-teal cluster.
- **Tag pills are outlined, not filled**. Rose border for walk tags, emerald for K tags.
- **Title Case for labels** ("Coaches Owe the Fund" not "Coaches owe the fund"). Articles like "the" stay lowercase.
- **Scroll to top on every nav event** (tab change, profile open/close, analytics pitcher swap). Routed through `scrollTop()` in Dashboard.
- **URL deep linking**: state encoded in `?section=&range=&pitcher=&analyticsPitcher=`. Shareable. `history.replaceState` (no history pollution).
- **Mobile tap targets ≥ 40px**. Bottom tab bar is 56px. Header buttons are 36 on desktop but bumped to 40 on mobile via `h-10 lg:h-9` pattern.
- **No cringey labels**. Achievements ("Free Pass", "Punchout", etc.) were stripped in v58/v60. Don't reintroduce.

## Free tier accounting

- **Vercel Blob**: ~150KB state file × 1 write/day = trivial. Limit is 5GB.
- **Vercel Functions**: ~30 cron invocations/month + page hits. Under 100K/month limit.
- **Vercel Cron**: 1 daily job allowed on Hobby.
- **MLB Stats API**: free, no key, ~5-10 calls per cron run.
- **Image optimization**: ~30 unique pitcher headshots, edge-cached, far under 5K free transformations/month.

## How to safely make changes

1. **Simple edits / single file**: just go. Auto-commit. Don't push without asking.
2. **Multi-file changes**: state your plan briefly, get approval.
3. **Data changes**: if you change classifier logic or add a field to `AppearanceVelo`, the user needs to run a **backfill with reset** to recompute existing records (`/api/backfill?token=$CRON_SECRET&reset=1`). Flag this.
4. **Verify UI**: use `mcp__Claude_Preview__preview_start` + `preview_resize` + `preview_eval` to check at mobile (375), tablet (768), desktop (1280). Don't just say "should work."
5. **Build before pushing**: `npx next build` to catch type errors and ensure production build succeeds.
6. **Daily cron handles updates automatically** — no manual action needed unless classifier changes.

## What's intentionally NOT here

- **No SSR for the dashboard chrome.** It's dynamic-imported with `ssr: false` in `DashboardClient.tsx`. Avoids the localStorage-hydration flicker on hidden-pitcher filtering. Initial paint shows a loading spinner.
- **No user accounts / auth.** Single shared dashboard.
- **No real-time pushes.** Cron updates daily. 7-day refresh window covers missed runs.
- **No achievement system.** All gamified labels were stripped — felt out of place next to real stats.
- **No `next/font` for Inter.** System-ui fallback is fine and saves the woff2 download.
- **No big refactors of `AnalyticsView.tsx`** (1.6K lines). Audits flagged this; works as-is and a split would be churn without runtime benefit.
- **No hits-as-WHIP support before v49.** v49 added `hits` to BoxscorePitching and AppearanceVelo specifically for WHIP. Backfill required.

## Operations cheat sheet

```bash
# Local dev
npm install
npm run dev

# Manual refresh (cron-equivalent)
curl 'https://red-sox-walks.vercel.app/api/refresh?token=$CRON_SECRET'

# Full season rebuild (preserves processedGamePks unless reset=1)
curl 'https://red-sox-walks.vercel.app/api/backfill?token=$CRON_SECRET'

# Hard reset + rebuild (use after classifier/schema changes)
curl 'https://red-sox-walks.vercel.app/api/backfill?token=$CRON_SECRET&reset=1'

# Read current state
curl 'https://red-sox-walks.vercel.app/api/state' | jq .

# Local classifier sanity check
npx tsx scripts/probe.ts 816958     # single game
npx tsx scripts/probe.ts             # season-to-date in-memory
```

CRON_SECRET lives in Vercel env vars (Settings → Environment Variables). Don't commit it.

## Common pitfalls

- **Date strings are ISO** (`2026-05-10`). `formatDate(iso)` appends `T12:00:00Z` to avoid timezone shifts.
- **Pitcher IDs are numbers** in storage but **strings** when used as object keys (`state.pitchers[String(id)]`).
- **`light-dark()` CSS function does NOT work in SVG fill attributes** (it works in CSS only). Use `useIsDark()` hook + JS to pick colors in SVG. This bit us in v30.
- **Vercel Blob `put()` with `addRandomSuffix: false`** — use `allowOverwrite: true` on @vercel/blob ≥ 2.x. Older versions required `del()` then `put()`.
- **OS `prefers-color-scheme: light` is intentionally ignored.** Default is always dark unless user explicitly toggles. v58 fixed this — don't revert.
- **The range value is `RangeValue` (`RangeKey | \`series:${number}\``), not `RangeKey`.** Filter/label fns take `RangeValue` + need `state.games`. Series filtering relies on a series being a contiguous date block (consecutive games vs one opponent) — if MLB ever schedules a same-opponent home-and-away split with a gap, revisit `computeSeries`.

## Version history TL;DR (last 20)

- v40: pitch labels inside usage bars
- v41: page caching, image optimization, dead code
- v44: PlayerProfile redesign with stat cards
- v45: Outings section as its own component
- v47: ERA/FIP/HR/K9/BB9 cards
- v48: Pitch palette respread (SI/FC/ST distinct)
- v49: WHIP everywhere + URL deep linking
- v50: Analytics top card pairs velo with rate stats
- v51: Dark mode default + scroll-to-top
- v52: Fund ledger sortable headers
- v53: Chart card fixed height on mobile
- v54: Fund ledger rows → profile
- v55-56: Copy link button
- v57: Audit pass — dark hierarchy, dead code, README
- v58: Removed achievement labels + forced dark on first load
- v59: iPad horizontal overflow fix
- v60: iPad landscape verified + nuked achievement catalog
- v61: This handoff doc
- v62: "Last 7/30 days" now calendar-relative to today (was anchored to last game date, so stale games leaked in)
- v63: Series filter — pick a specific series (consecutive games vs one opponent) from the range dropdown

Full history in `git log` and `PROMPTS.md`.
