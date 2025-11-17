# Duplicate Odds/Opportunities Fix

## Issue
Users were seeing duplicate entries in both the Top Edges sidebar and the Opportunities table, where the exact same betting opportunity would appear multiple times in a row.

## Root Causes

### 1. **Missing `point` field in odds key generation**
The `generateOddsKey()` function in `odds-store.ts` was creating keys without the `point` value:
```typescript
// BEFORE (incorrect)
function generateOddsKey(odds: NormalizedOdds): string {
  return `${odds.event_id}-${odds.market_key}-${odds.book_key}-${odds.outcome_name}`;
}
```

**Problem**: For spreads and totals, the same outcome (e.g., "Over") can have different point values (e.g., Over 215.5 vs Over 216.5). Without the point in the key, these different odds entries could collide or be treated inconsistently.

### 2. **Incomplete keys in TopEdgesSidebar**
The TopEdgesSidebar was using a key that omitted both `market_key` and `point`:
```typescript
// BEFORE (incorrect)
key={`${odd.event_id}-${odd.book_key}-${odd.outcome_name}`}
```

**Problem**: Same outcome could appear in different markets, causing key collisions.

### 3. **Missing `market_key` in alert deduplication**
The `generateAlertKey()` function in `alerts.ts` was missing the `market_key`:
```typescript
// BEFORE (incorrect)
function generateAlertKey(odds: NormalizedOdds): string {
  return `${odds.event_id}-${odds.book_key}-${odds.outcome_name}-${odds.point || 'null'}`;
}
```

**Problem**: Alerts for the same outcome in different markets would be treated as duplicates, causing inconsistent alert behavior.

### 4. **Backend creating duplicate opportunities**
The opportunities API was returning duplicate records with different IDs, suggesting the backend edge detector was creating multiple opportunity records for the same edge.

## Fixes Applied

### 1. **Updated odds store key generation** ✅
```typescript
// AFTER (correct)
function generateOddsKey(odds: NormalizedOdds): string {
  const pointPart = odds.point !== null ? `-${odds.point}` : '';
  return `${odds.event_id}-${odds.market_key}-${odds.book_key}-${odds.outcome_name}${pointPart}`;
}
```

### 2. **Updated TopEdgesSidebar keys** ✅
```typescript
// AFTER (correct)
const pointPart = odd.point !== null ? `-${odd.point}` : '';
key={`${odd.event_id}-${odd.market_key}-${odd.book_key}-${odd.outcome_name}${pointPart}`}
```

### 3. **Updated alert key generation** ✅
```typescript
// AFTER (correct)
function generateAlertKey(odds: NormalizedOdds): string {
  return `${odds.event_id}-${odds.market_key}-${odds.book_key}-${odds.outcome_name}-${odds.point || 'null'}`;
}
```

### 4. **Added client-side deduplication for opportunities** ✅
```typescript
// Deduplicate opportunities based on key characteristics
const deduplicated = filtered.reduce((acc, opp) => {
  // Create a unique key based on event, market, legs, and edge
  const legsKey = opp.legs
    .map(leg => `${leg.book_key}-${leg.outcome_name}-${leg.price}`)
    .sort()
    .join('|');
  const uniqueKey = `${opp.event_id}-${opp.market_key}-${opp.edge_pct.toFixed(2)}-${legsKey}`;
  
  // Only keep the first occurrence
  const existing = acc.find(o => {
    // ... check if already exists
  });
  
  if (!existing) {
    acc.push(opp);
  } else {
    console.log(`[Opportunities] Filtered duplicate: ID ${opp.id} (keeping ID ${existing.id})`);
  }
  
  return acc;
}, [] as Opportunity[]);
```

## Impact

- **Odds Store**: Now properly deduplicates odds entries, even when they have the same outcome but different point values
- **Top Edges Sidebar**: No more duplicate entries in the UI
- **Alerts**: Properly tracks which odds have been alerted on, preventing duplicate alerts
- **Opportunities Page**: Client-side deduplication prevents duplicate opportunities from being displayed, even if the backend sends them

## Testing

To verify the fix:
1. Check the Top Edges sidebar - should show unique entries only
2. Check the Opportunities page - duplicates should be filtered out
3. Check browser console for deduplication logs: `[Opportunities] Removed X duplicates`
4. Verify that spreads/totals with different point values are treated as separate entries

## Future Work

The backend opportunity creation logic should be reviewed to prevent duplicate opportunities from being created in the first place. The client-side deduplication is a safety net, but the root cause should be addressed in the edge detector or opportunity creation service.

## Related Files

- `web/fortuna_client/lib/stores/odds-store.ts`
- `web/fortuna_client/components/layout/TopEdgesSidebar.tsx`
- `web/fortuna_client/lib/alerts.ts`
- `web/fortuna_client/app/opportunities/page.tsx`




