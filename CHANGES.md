# Recent Changes - Architecture Fix & Debug Tools

## Critical Fix: Normalized Odds vs Raw Odds

### Problem
The UI was loading **raw odds** from the API (just price data), but trying to display them as **normalized odds** (which include edge calculations, vig removal, fair pricing). This caused errors because fields like `decimal_odds`, `edge`, and `novig_probability` were missing.

### Solution
1. **Main View** (`/odds/[sport]`): Now displays ONLY normalized odds from WebSocket
   - WebSocket streams from `odds.normalized.basketball_nba` Redis Stream
   - Includes edge calculations, vig-removed probabilities, fair pricing
   - Real-time updates as Normalizer processes odds
   
2. **Debug View** (`/debug/raw-odds`): NEW separate page for raw odds
   - Displays raw odds from API Gateway for debugging
   - Shows basic price data without normalization
   - Auto-refreshes every 10 seconds
   - Clear warning banner

## Changes Made

### 1. Type System (`types/index.ts`)
- ✅ `NormalizedOdds` has **required** normalized fields (edge, decimal_odds, etc.)
- ✅ `OddsFilters.minEdge` is now `number | null` (null = "Show All")
- ✅ Clear separation between raw and normalized data

### 2. Main Odds View (`OddsTable.tsx`)
- ✅ Removed API odds fetching (was loading raw odds)
- ✅ Now loads only events from API
- ✅ Waits for normalized odds from WebSocket
- ✅ Better loading states and error messages

### 3. Dynamic Sportsbook Filter (`FilterBar.tsx`)
- ✅ Dynamically fetches available books from API
- ✅ Shows "Sharp Book" vs "Soft Book" tooltips
- ✅ "Show All" edge filter option (default)

### 4. Debug Tools
- ✅ `/debug/raw-odds` page for viewing raw odds from API
- ✅ Header navigation with "Live Odds" and "Debug" tabs
- ✅ Connection status only shows on Live Odds page

### 5. Utility Functions (`lib/utils.ts`)
- ✅ Added `americanToDecimal()` and `americanToImpliedProbability()` for debug view
- ✅ Updated `getDataAgeSeconds()` to use `normalized_at` timestamp

## How It Works

1. **Page Load**:
   - UI connects to WebSocket (`ws://localhost:8082/ws`)
   - UI fetches initial odds from API Gateway (`http://localhost:8081/api/v1/odds/current`)
   - Books filter fetches available books from API (or uses defaults)

2. **Real-time Updates**:
   - WebSocket streams normalized odds with edge calculations
   - UI updates in real-time as new data arrives

3. **Fallback**:
   - If books API is not available, uses default list of sharp and soft books
   - If initial odds fetch fails, shows error message

## Backend Status

✅ **All services running**:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Mercury: `localhost:8080` (raw odds aggregation)
- Normalizer: Processing odds in Redis Streams
- API Gateway: `localhost:8081` (REST API)
- WS Broadcaster: `localhost:8082` (WebSocket, 2 active clients)

## Testing

Open your browser to http://localhost:3000 and:

1. **Check browser console** for logs:
   - "Connecting to WebSocket: ws://localhost:8082/ws"
   - "WebSocket connection changed: true/false"
   - "Subscribing with: {...}"
   - "Fetching initial odds with filters: {...}"
   - "Loaded N initial odds"

2. **Check the Books filter**:
   - Should show all available books (Pinnacle, Circa, Bookmaker, FanDuel, DraftKings, BetMGM, Caesars, etc.)
   - Hover over each to see "Sharp Book" or "Soft Book" tooltip

3. **Check for data**:
   - Should see games populated (if odds are available)
   - If no data, check the console for errors

## If Still No Data

Run these debug commands:

```bash
# Check API Gateway has data
curl -s "http://localhost:8081/api/v1/odds/current?sport=basketball_nba&limit=5" | jq '.odds | length'

# Check WS Broadcaster health
curl -s http://localhost:8082/health | jq '.'

# Check browser console for errors
# Open DevTools (F12) -> Console tab

# Check WebSocket messages
# Open DevTools (F12) -> Network tab -> WS -> Click on connection -> Messages
```

## Next Steps

If data is flowing but not displaying:
1. The data structure from the API might differ from expected TypeScript types
2. The WebSocket message format might differ
3. We may need to add data transformation/mapping logic

