# Fortuna Web Client - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd /Users/xavierbriggs/development/fortuna/web/fortuna_client
npm install
```

### Step 2: Configure Environment

```bash
# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_WS_URL=ws://localhost:8082/ws
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_SLACK_WEBHOOK_URL=
EOF
```

**Optional**: Add your Slack webhook URL for alerts.

### Step 3: Start Backend Services

**Option A: One-Command Start (Recommended)**

Linux/macOS:
```bash
# Start everything with one command! 🚀
./scripts/start-all.sh
```

Windows (PowerShell):
```powershell
# Start everything with one command! 🚀
.\scripts\start-all.ps1
```

This automatically starts:
- ✅ Docker (PostgreSQL + Redis)
- ✅ Mercury (odds aggregator)
- ✅ Normalizer (vig removal)
- ✅ API Gateway (REST API)
- ✅ WS Broadcaster (WebSocket)

**Option B: Manual Start (Advanced)**
```bash
# In terminal 1: Start infrastructure
cd /Users/xavierbriggs/development/fortuna/deploy
docker-compose up -d

# In terminal 2: Start Mercury
cd /Users/xavierbriggs/development/fortuna/mercury
make run

# In terminal 3: Start Normalizer
cd /Users/xavierbriggs/development/fortuna/services/normalizer
make run

# In terminal 4: Start API Gateway
cd /Users/xavierbriggs/development/fortuna/services/api-gateway
make run

# In terminal 5: Start WS Broadcaster
cd /Users/xavierbriggs/development/fortuna/services/ws-broadcaster
make run
```

### Step 4: Start Web Client

```bash
# In a new terminal: Start web client
npm run dev
```

> **Tip**: If using the automation script, wait for "All services started successfully!" before starting the web client.

### Step 5: Open Browser

Open [http://localhost:3000](http://localhost:3000)

Click "NBA" to view live odds!

---

## 📊 What You'll See

### Landing Page
- Sport selector (NBA active, NFL/MLB coming in v1)
- System status indicator

### Odds Page
- **Header**: Connection status, user profile
- **Filter Bar**: Markets, books, edge filters, search
- **Main Table**: Real-time odds with edge calculations
- **Sidebar**: Top 10 +EV opportunities, summary stats

### Table Columns
- **Time**: Game time or "🔴 LIVE"
- **Game**: Teams and outcome
- **Best Line**: Best odds across all books
- **Hold**: No-vig percentage with age badge
- **Sharp**: Pinnacle/Circa/Bookmaker consensus
- **Soft Books**: FanDuel, DraftKings, BetMGM, Caesars with edge%

---

## 🎯 Key Features to Test

### 1. Real-Time Updates
Watch odds flash when they update (blue flash animation)

### 2. Edge Highlighting
- Green text = positive edge
- Yellow background = >5% edge (rare!)
- Green background = 2-5% edge (significant)

### 3. Data Freshness
- 🟢 Green = <5 seconds (fresh!)
- 🟡 Yellow = 5-10 seconds (caution)
- 🔴 Red = >10 seconds (stale)

### 4. Filters
- Click markets to toggle (Spread, Total, Moneyline)
- Click books to filter by sportsbook
- Use edge presets: "Any +EV", ">2%", ">5%"
- Search for teams or players

### 5. Hover Tooltips
Hover over any odds cell to see:
- Book name
- Decimal odds
- Implied probability
- Fair price
- Edge percentage

### 6. Top Edges Sidebar
Live-updating list of best opportunities with:
- Rank (1-10)
- Edge percentage
- Outcome and odds
- Book name
- Data freshness

---

## 🔔 Alerts

Alerts trigger automatically when:
- Edge > 0% (any +EV)
- Data age < 10 seconds
- Not already alerted on recently

### In-App Alerts
Appear in the "Top Edges" sidebar immediately

### Slack Alerts
If webhook URL is configured, sends rich messages with:
- Edge percentage
- Outcome and odds
- Book name
- Data freshness
- Market details

---

## ⚡ Performance

Expected metrics:
- **WebSocket message → UI update**: <50ms
- **Filter change**: <100ms
- **Initial load**: <2 seconds
- **Scrolling**: Smooth 60 FPS

---

## 🐛 Troubleshooting

### "Connection Lost"
1. Check WS Broadcaster is running:
   ```bash
   curl http://localhost:8082/health
   ```
2. Check WebSocket URL in `.env.local`

### "No Odds Found"
1. Check Mercury is polling:
   ```bash
   cd /Users/xavierbriggs/development/fortuna/mercury
   make run
   ```
2. Check Normalizer is processing:
   ```bash
   cd /Users/xavierbriggs/development/fortuna/services/normalizer
   make run
   ```
3. Verify data in API:
   ```bash
   curl http://localhost:8081/api/v1/odds/current?sport=basketball_nba
   ```

### Alerts Not Working
1. Check Slack webhook URL in `.env.local`
2. Verify edges meet threshold (>0%)
3. Check console for alert logs

---

## 📱 Mobile Testing

The UI is responsive but optimized for desktop. To test mobile:

```bash
# Get your local IP
ipconfig getifaddr en0  # macOS
# or
ip addr show  # Linux

# Access from phone on same network
http://YOUR_IP:3000
```

---

## 🎨 Customization

### Change Displayed Books

Edit `components/odds-table/OutcomeRow.tsx`:

```typescript
// Add or remove book columns
const pinnacleOdds = oddsByBook['pinnacle'];
const mybookieOdds = oddsByBook['mybookieag'];  // Add new book
```

### Change Alert Thresholds

Edit `app/odds/[sport]/page.tsx`:

```typescript
useAlerts({
  minEdge: 0.02,  // Change to 2% minimum
  maxDataAge: 5,  // Change to 5 seconds max
});
```

### Change Color Theme

Edit `tailwind.config.ts`:

```typescript
colors: {
  'edge-high': '#YOUR_COLOR',  // >5% edge
  'edge-good': '#YOUR_COLOR',  // 2-5% edge
  'edge-positive': '#YOUR_COLOR',  // 0-2% edge
}
```

---

## 🚀 Next Steps

1. **Add More Books**: Extend table with more sportsbook columns
2. **Line Movement Tracking**: Show how lines have moved
3. **Historical Charts**: Visualize odds over time
4. **Bet Tracking**: Log bets and calculate ROI
5. **Mobile App**: React Native version

---

## 📞 Support

Questions? Check the main README.md or docs/I1_ARCHITECTURE_REVIEW.md

Enjoy using Fortuna! 🎰

