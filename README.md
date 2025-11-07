# Fortuna Web Client

Professional sports betting decision support system with real-time odds, edge calculations, and sharp consensus.

## Features

✅ **Real-Time Odds** - WebSocket integration with <50ms latency
✅ **Edge Calculations** - Automatic +EV detection with vig removal
✅ **Sharp Consensus** - Compare soft books vs. Pinnacle/Circa/Bookmaker
✅ **Data Freshness** - Visual age indicators (green/yellow/red)
✅ **Advanced Filters** - Filter by sport, market, book, and edge threshold
✅ **Alerts** - In-app notifications + Slack webhooks
✅ **Dark Mode** - Professional, easy-on-the-eyes interface
✅ **Top Edges Sidebar** - Live leaderboard of best opportunities

## Tech Stack

- **Next.js 14** - App Router with Server Components
- **React 18** - Latest features and performance
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **WebSocket** - Real-time data streaming

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Running instances of:
  - **WebSocket Broadcaster** (default: `ws://localhost:8082/ws`)
  - **API Gateway** (default: `http://localhost:8081`)
  - **Slack Webhook** (optional, for alerts)

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# WebSocket Broadcaster URL
NEXT_PUBLIC_WS_URL=ws://localhost:8082/ws

# API Gateway URL
NEXT_PUBLIC_API_URL=http://localhost:8081

# Slack Webhook URL (for alerts)
NEXT_PUBLIC_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
fortuna-client/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Landing page (sport selector)
│   ├── odds/
│   │   └── [sport]/
│   │       └── page.tsx       # Main odds page
│   └── globals.css            # Global styles
│
├── components/
│   ├── layout/                # Layout components
│   │   ├── Header.tsx         # Top navigation
│   │   ├── FilterBar.tsx      # Filter controls
│   │   └── TopEdgesSidebar.tsx# Best edges sidebar
│   │
│   ├── odds-table/            # Odds table components
│   │   ├── OddsTable.tsx      # Main table container
│   │   ├── GameRow.tsx        # Game row with outcomes
│   │   ├── OutcomeRow.tsx     # Individual outcome row
│   │   └── BookCell.tsx       # Per-book cell (memoized)
│   │
│   └── shared/                # Shared components
│       ├── EdgeBadge.tsx      # Edge percentage display
│       ├── AgeBadge.tsx       # Data freshness indicator
│       └── ConnectionStatus.tsx # WebSocket status
│
├── lib/
│   ├── stores/
│   │   └── odds-store.ts      # Zustand state management
│   ├── websocket.ts           # WebSocket client
│   ├── utils.ts               # Helper functions
│   └── alerts.ts              # Alert logic
│
├── providers/
│   ├── WebSocketProvider.tsx  # WebSocket context
│   └── OddsStoreProvider.tsx  # Store wrapper
│
├── hooks/
│   └── useAlerts.ts           # Alert monitoring hook
│
└── types/
    └── index.ts               # TypeScript types
```

## Usage

### Landing Page

Select your sport (NBA available in v0):

```
http://localhost:3000
```

### Odds Page

View live odds with real-time updates:

```
http://localhost:3000/odds/basketball_nba
```

### Filters

- **Markets**: Click to toggle spreads, totals, moneyline
- **Books**: Select specific sportsbooks or view all
- **Min Edge**: Filter by edge threshold (Any +EV, >2%, >5%)
- **Search**: Find specific teams or players

### Alerts

Alerts trigger when:
- Edge meets minimum threshold (configurable)
- Data is fresh (<10 seconds by default)
- Odds haven't been alerted on recently

Alerts are sent to:
1. **In-App** - Top edges sidebar (always enabled)
2. **Slack** - Webhook if configured
3. **Browser** - Browser notifications (optional, requires permission)

## Configuration

### Alert Settings

Edit `hooks/useAlerts.ts` or pass options to the hook:

```typescript
useAlerts({
  minEdge: 0.02,        // Only alert on edges >2%
  maxDataAge: 10,       // Only alert on fresh data (<10s)
  enableInApp: true,    // Show in sidebar
  enableSlack: true,    // Send to Slack
  enableBrowser: false, // Browser notifications
});
```

### Displayed Books

Edit `components/odds-table/OddsTable.tsx` to change which books appear in columns:

```typescript
{/* Sharp Consensus */}
<BookCell odds={sharpOdds} isSharp={true} />

{/* Soft Books - Customize these */}
<BookCell odds={fanduelOdds} isSharp={false} />
<BookCell odds={draftkingsOdds} isSharp={false} />
<BookCell odds={betmgmOdds} isSharp={false} />
<BookCell odds={caesarsOdds} isSharp={false} />
```

## Performance

### Optimizations Implemented

- ✅ **Memoization** - React.memo on BookCell, GameRow, OutcomeRow
- ✅ **Debounced Search** - 300ms delay on search input
- ✅ **Efficient Rendering** - Only re-render changed cells
- ✅ **WebSocket Batching** - Updates grouped on server
- ✅ **Zustand** - Lightweight state management (< 1KB)

### Expected Performance

- **Initial Load**: < 2s
- **WebSocket Update → UI**: < 50ms
- **Filter Change → Re-render**: < 100ms
- **Scrolling**: 60 FPS with 100+ games

## Troubleshooting

### WebSocket Not Connecting

1. Check that `ws-broadcaster` is running:
   ```bash
   curl http://localhost:8082/health
   ```

2. Verify WebSocket URL in `.env.local`:
   ```env
   NEXT_PUBLIC_WS_URL=ws://localhost:8082/ws
   ```

3. Check browser console for connection errors

### No Odds Displaying

1. Ensure backend services are running:
   - Mercury (odds aggregator)
   - Normalizer (vig removal)
   - ws-broadcaster (WebSocket)

2. Check that data is flowing through the pipeline:
   ```bash
   # Check if odds are being normalized
   curl http://localhost:8081/api/v1/odds/current?sport=basketball_nba
   ```

3. Open browser dev tools → Network → WS tab to see WebSocket messages

### Alerts Not Working

1. **Slack**: Verify webhook URL is set in `.env.local`
2. **Browser**: Request notification permission (see Settings)
3. **Threshold**: Check that edges meet minimum threshold

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## License

Proprietary - Fortuna v0

