# SentimentPerps

> **Trade the mood.** A sentiment-driven perpetual futures platform on Solana — scan social signals, open positions, climb the leaderboard.

Built for the [Pacifica Hackathon 2026](https://dorahacks.io/) on DoraHacks.

![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## What It Does

SentimentPerps combines real-time social sentiment analysis with perpetual futures trading. Instead of relying solely on technical indicators, traders use crowd mood — aggregated from Twitter, Discord, and Telegram — to inform their positions.

**Core loop:**

1. **Scan** — Elfa AI surfaces trending tokens and sentiment shifts in real time
2. **Trade** — Open long/short perps on Pacifica with up to 20x leverage
3. **Compete** — Earn points for profitable sentiment calls, climb the leaderboard, collect badges

---

## Sponsor Integrations

| Sponsor      | Integration                                                                                                                                                                                | Depth |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| **Pacifica** | Full perpetual futures lifecycle — market/limit orders, cancel, positions, close, TP/SL, klines, portfolio history. Ed25519 wallet signing for every trade. Builder code revenue model.    | ★★★★★ |
| **Elfa AI**  | Trending tokens, top mentions, keyword sentiment, AI chat with context injection, sentiment-triggered auto-trading, sentiment heatmap, sparklines, and replay.                             | ★★★★★ |
| **Privy**    | Embedded wallet creation, external wallet connectors (Phantom, Solflare, etc.), Ed25519 signing for Pacifica auth, session management.                                                     | ★★★★★ |
| **Fuul**     | Full referral lifecycle — capture → register → track → claim. Conversion events fire on trade open/close. Affiliate dashboard with stats, leaderboard, activity feed, and payout tracking. | ★★★★★ |
| **Rhinofi**  | Cross-chain deposit bridge widget supporting 10+ chains (Ethereum, Arbitrum, Polygon, Optimism, Base, etc.). Wallet address auto-populated from Privy.                                     | ★★★★☆ |

---

## Features

- **Sentiment Dashboard** — Live trending tokens, mention counts, sentiment scores with sparkline charts
- **Trading Terminal** — Full order form (market/limit), position management, TP/SL, real-time PnL
- **AI Chat** — Elfa-powered conversational analysis with market context injection
- **Sentiment Triggers** — Set rules like "go long SOL if bullish sentiment > 70%" — auto-executes via Pacifica
- **Live Charts** — Real-time OHLCV candlestick charts from Pacifica klines API
- **Leaderboard** — Ranked traders with win rate, PnL, badges, and gamification
- **Referral System** — Fuul-powered invite links, conversion tracking, affiliate payouts
- **Cross-chain Deposits** — Bridge from any major L1/L2 via Rhinofi widget
- **Portfolio Analytics** — Trade history, P&L breakdown, sentiment accuracy tracking
- **Badge System** — Achievement badges for milestones (first trade, win streaks, volume tiers)
- **Sentiment Heatmap** — Visual grid of token sentiment intensity over time
- **Transaction History** — Full trade log with timestamps, sizes, and outcomes

---

## Architecture

```
src/
├── app/                          # Next.js 16 App Router (React 19)
│   ├── (dashboard)/              # Route group — 6 pages
│   │   ├── dashboard/            #   Market overview + sentiment feed
│   │   ├── trade/                #   Trading terminal
│   │   ├── transactions/         #   Trade history
│   │   ├── leaderboard/          #   Ranked traders
│   │   ├── profile/              #   User stats + badges
│   │   └── referral/             #   Fuul affiliate dashboard
│   └── api/                      # 19 server-side API routes
│       ├── trade/                #   Order execution (Pacifica)
│       ├── sentiment/            #   Elfa AI proxy
│       ├── markets/              #   Market data
│       ├── positions/            #   Position management
│       ├── leaderboard/          #   Rankings
│       ├── fuul/                 #   Referral events
│       └── ...                   #   Portfolio, chat, triggers, etc.
├── components/ui/                # 37 client components
├── hooks/                        # 11 custom hooks
├── lib/                          # Service clients
│   ├── pacifica.ts               #   Pacifica exchange client (418 LOC)
│   ├── elfa.ts                   #   Elfa AI sentiment client
│   ├── fuul.ts                   #   Fuul SDK wrapper (client-side)
│   ├── fuul-server.ts            #   Fuul REST events (server-side)
│   └── prisma.ts                 #   Database client
├── stores/                       # 8 Zustand stores
└── types/                        # Domain types (app, elfa, pacifica)
```

**Data flow:** Component → Hook → API Route → External Service → Zustand Store → Re-render

---

## Tech Stack

| Layer     | Technology                                   |
| --------- | -------------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack)           |
| UI        | React 19, Tailwind CSS 4                     |
| State     | Zustand                                      |
| Auth      | Privy (`@privy-io/react-auth`)               |
| Wallet    | Solana Web3.js, `@solana/wallet-adapter`     |
| Database  | PostgreSQL + Prisma ORM                      |
| Exchange  | Pacifica SDK (custom client)                 |
| Sentiment | Elfa AI REST API                             |
| Referrals | Fuul SDK + REST API                          |
| Bridge    | Rhinofi Widget (`@rhino.fi/widget`)          |
| Charts    | Lightweight Charts (TradingView)             |
| Fonts     | Space Grotesk, IBM Plex Sans, JetBrains Mono |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted)
- Accounts/keys for: [Privy](https://privy.io), [Elfa AI](https://elfa.ai), [Pacifica](https://pacifica.fi), [Fuul](https://fuul.xyz)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/sentimentperps.git
cd sentimentperps
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Auth (Privy)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Sentiment (Elfa AI) — server-side only
ELFA_API_KEY=your_elfa_api_key

# Exchange (Pacifica)
NEXT_PUBLIC_PACIFICA_ENV=testnet    # "mainnet" | "testnet"

# Referrals (Fuul)
NEXT_PUBLIC_FUUL_API_KEY=your_fuul_api_key
FUUL_TRIGGER_EVENT_KEY=your_fuul_trigger_key

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/sentimentperps

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Run

```bash
npm run dev     # localhost:3000 (Turbopack)
```

### Build & Lint

```bash
npm run build   # Production build
npm run lint    # ESLint (next core-web-vitals + TypeScript)
```

---

## Design System

**Dark Industrial Skeuomorphism** — neumorphic shadows, mechanical button physics, manufacturing-inspired details (screws, vents, LED indicators), CRT scanlines, carbon fiber textures.

- **Palette:** `#12151C` background, `#FF4757` primary, `#22C55E` success
- **Typography:** Space Grotesk (headings) + IBM Plex Sans (body) + JetBrains Mono (data)
- **Shadows:** Dual neumorphic (dark + light offset) — never flat

---

## Database Schema

5 Prisma models:

- **Trade** — Order records with market, side, size, leverage, PnL, sentiment context
- **Referral** — Invite tracking (referrer → referred wallet mapping)
- **Badge** — Achievement system (type, tier, criteria)
- **UserProgress** — Per-user stats, XP, level, streak tracking
- **ReferralClaim** — Payout claims for affiliate rewards

---

## API Routes (19 endpoints)

| Route                      | Method  | Purpose                   |
| -------------------------- | ------- | ------------------------- |
| `/api/trade`               | POST    | Execute trade on Pacifica |
| `/api/positions`           | GET     | Fetch open positions      |
| `/api/positions/close`     | POST    | Close position            |
| `/api/markets`             | GET     | Available markets         |
| `/api/markets/[id]/klines` | GET     | Candlestick data          |
| `/api/sentiment/trending`  | GET     | Elfa trending tokens      |
| `/api/sentiment/mentions`  | GET     | Token mention counts      |
| `/api/chat`                | POST    | AI chat (Elfa)            |
| `/api/leaderboard`         | GET     | Trader rankings           |
| `/api/fuul/*`              | Various | Referral events & claims  |
| `/api/dashboard/stats`     | GET     | Platform statistics       |
| ...                        |         |                           |

---

## License

MIT

---

<p align="center">
  <strong>SentimentPerps</strong> 
</p>
