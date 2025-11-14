# Architecture Fix: Normalized Odds vs Raw Odds

## Problem Identified

The UI was attempting to display **raw odds** from the API Gateway, which don't include:
- Edge calculations
- Vig removal (novig_probability)
- Fair price calculations  
- Market type classifications
- Processing metadata

## Correct Data Flow

```
Mercury (Raw Odds)
    ↓
Normalizer (Adds edge calculations, vig removal, consensus)
    ↓
Redis Stream: odds.normalized.basketball_nba
    ↓
WS Broadcaster (Streams to clients)
    ↓
UI (Displays normalized odds with edges)
```

## Changes Made

### 1. **Main Odds View** (`/odds/[sport]`)
- ✅ Now displays ONLY normalized odds from WebSocket
- ✅ Includes edge calculations, fair pricing, vig-removed probabilities
- ✅ Loads events from API, but waits for normalized odds from WS Broadcaster
- ✅ Type-safe with required normalized fields

### 2. **Debug View** (`/debug/raw-odds`)
- ✅ NEW: Separate page for viewing raw odds from API Gateway
- ✅ Shows raw price data without normalization
- ✅ Useful for debugging Mercury → API Gateway pipeline
- ✅ Auto-refresh every 10 seconds
- ✅ Clear warning banner explaining it's debug mode

### 3. **Header Navigation**
- ✅ Added "Live Odds" and "Debug" tabs
- ✅ Connection status only shows on Live Odds page
- ✅ Active tab highlighting

### 4. **Type Safety**
- ✅ `NormalizedOdds` interface has required fields (decimal_odds, edge, etc.)
- ✅ `RawOdds` interface for API data (just price, no calculations)
- ✅ Clear separation between raw and normalized data types

## How to Use

### Main View (Normalized Odds with Edge)
1. Navigate to `/odds/basketball_nba`
2. WebSocket connects to `ws://localhost:8082/ws`
3. Subscribes to `odds.normalized.basketball_nba` stream
4. Displays odds with edge calculations in real-time

### Debug View (Raw Odds from API)
1. Navigate to `/debug/raw-odds`
2. Fetches raw odds from `http://localhost:8081/api/v1/odds/current`
3. Shows basic price data without normalization
4. Auto-refreshes every 10 seconds

## WebSocket Stream

The WS Broadcaster consumes from:
- **Stream**: `odds.normalized.basketball_nba`
- **Producer**: Normalizer service
- **Data**: Fully normalized odds with:
  - `decimal_odds`
  - `implied_probability`
  - `novig_probability`
  - `edge` (vs sharp consensus)
  - `fair_price`
  - `market_type`
  - `vig_method`
  - `normalized_at` timestamp
  - `processing_latency_ms`

## Testing

Check browser console on `/odds/basketball_nba`:
```
Fetching initial events for sport: basketball_nba
Loaded X events. Waiting for normalized odds from WebSocket...
Connecting to WebSocket: ws://localhost:8082/ws
WebSocket connection changed: true
Subscribing with: {sports: ['basketball_nba'], markets: [...], books: [...]}
```

Check `/debug/raw-odds`:
```
Should see raw odds table with:
- Event info
- Market, Book, Outcome
- Price (American odds)
- Calculated decimal and implied % (client-side calc for display only)
- Last update time
```

## Benefits

1. **Correct Architecture**: UI uses normalized odds with edge calculations
2. **Separation of Concerns**: Raw odds debugging separate from main view
3. **Type Safety**: TypeScript enforces correct data structures
4. **Real-time Updates**: WebSocket streams normalized odds as they're calculated
5. **Debugging**: Easy to verify both raw and normalized pipelines

## Next Steps

1. Verify WebSocket is receiving normalized odds (check messages in browser DevTools)
2. Ensure Normalizer is processing odds and publishing to Redis Stream
3. If no odds appear, check Normalizer logs for processing issues




