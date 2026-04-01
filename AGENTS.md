<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# SentimentPerps — Project Guidelines

> **This platform handles real money.** Every code change must be evaluated through the lens of financial safety, signature integrity, and user trust. When in doubt, fail closed.

## What This Is

A sentiment-driven perpetual futures trading platform on Solana. Users trade perps on Pacifica exchange based on social sentiment signals from Elfa AI. Auth via Privy embedded wallets. Neumorphic UI, Next.js 16, React 19, Zustand state, Tailwind CSS 4.

## Build & Run

```bash
npm run dev          # Next.js 16 + Turbopack (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (next core-web-vitals + TypeScript)
```

### Required Environment Variables

```
NEXT_PUBLIC_PRIVY_APP_ID    # Privy auth (client-side)
ELFA_API_KEY                # Elfa AI sentiment API (server-side only)
NEXT_PUBLIC_PACIFICA_ENV    # "mainnet" | "testnet"
```

## Architecture

```
src/
├── app/                    # Next.js App Router (React 19)
│   ├── (dashboard)/        # Route group: dashboard, trade, leaderboard, profile, referral
│   └── api/                # Server-side API routes (proxy to Pacifica, Elfa, CoinGecko)
├── components/ui/          # Client components ("use client" — all interactive)
├── hooks/                  # Data fetching + polling + wallet signing
├── lib/                    # External service clients (pacifica.ts, elfa.ts)
├── stores/                 # Zustand stores (in-memory, no persistence)
└── types/                  # Domain types: app.ts, elfa.ts, pacifica.ts
```

**Data flow**: Component → Hook → API Route → External Service → Zustand Store → Re-render

**Provider hierarchy**: `RootLayout` → `Providers` (PrivyProvider + Solana wallets) → `ToastContainer` → Page

### External Integrations

| Service       | Purpose                            | Auth                                       | Client                    |
| ------------- | ---------------------------------- | ------------------------------------------ | ------------------------- |
| **Pacifica**  | Perpetual futures exchange         | Ed25519 signature + wallet address headers | `src/lib/pacifica.ts`     |
| **Elfa AI**   | Social sentiment & trending tokens | `ELFA_API_KEY` header (server-side)        | `src/lib/elfa.ts`         |
| **CoinGecko** | 24h price changes                  | None (free tier, 50 req/min)               | Direct fetch in API route |
| **Privy**     | Wallet auth + embedded wallets     | `NEXT_PUBLIC_PRIVY_APP_ID`                 | `@privy-io/react-auth`    |

## Financial Safety Rules

These are **non-negotiable** for any code touching trades, positions, or wallet operations:

1. **Never skip signature verification.** Every trade and position-close requires a fresh Ed25519 signature. Never cache or reuse signatures.
2. **Never trust client-submitted amounts without validation.** Validate order size, leverage (max 20x), and price against Pacifica market limits.
3. **Side logic is critical.** Closing a long = `ask`, closing a short = `bid`. Reversing this loses user money. Always verify with a test.
4. **Fail closed on errors.** If a trade request fails at any step, do NOT retry automatically. Surface the error to the user.
5. **Never log or expose private keys, signatures, or wallet addresses** in client-visible output.
6. **Rate limit awareness.** CoinGecko free tier = 50 calls/min. Elfa has quotas. Add caching before increasing poll frequency.
7. **HTTPS only.** Signatures are transmitted in headers/body — never allow HTTP in production.

## Code Conventions

### Naming

| Type       | Pattern                       | Example                                                  |
| ---------- | ----------------------------- | -------------------------------------------------------- |
| Components | PascalCase `.tsx`             | `OrderForm.tsx`, `SentimentPanel.tsx`                    |
| Hooks      | `use` prefix, camelCase `.ts` | `useMarkets.ts`, `useTrade.ts`                           |
| Stores     | `use<Name>Store`              | `usePositionsStore`, `useSentimentStore`                 |
| Types      | PascalCase, domain-prefixed   | `PacificaMarket`, `ElfaTrendingToken`, `SentimentSignal` |
| API routes | `route.ts` in named folder    | `api/trade/route.ts`                                     |
| Constants  | UPPER_SNAKE_CASE              | `BUILDERS_CODE`, `POLL_INTERVAL`                         |
| Booleans   | `is`/`has` prefix             | `isLoading`, `isAuthenticated`                           |

### Component Patterns

- All UI components use `"use client"` — this is a client-heavy app
- Modals: close on ESC key + backdrop click
- Forms: inline validation, disabled submit until valid
- Loading states: skeleton or spinner, never blank
- Path alias: `@/*` → `./src/*`

### State Management

- Zustand `create()` with selector pattern (avoid unnecessary re-renders)
- Computed selectors for derived state (e.g., `getTotalUnrealizedPnl()`)
- All state is in-memory — no persistence layer yet
- Never mutate store state directly — always use store actions

### Design System — Neumorphic

```
Background: #E0E5EC    Primary: #6C63FF (purple)
Success: #38B2AC       Danger: #EF4444
Shadows: neu-extruded (raised), neu-inset (pressed)
Font: Plus Jakarta Sans (display) + DM Sans (body)
Border radius: rounded-xl / rounded-2xl / rounded-[32px]
```

All new UI must follow the neumorphic pattern — raised cards with soft shadows, inset inputs. See `src/app/globals.css` for the full token set.

## Known Pitfalls

- **Pacifica auth timestamps**: 60s expiry window. Client clock skew = auth failures.
- **Position close side flip**: `long → ask`, `short → bid`. Easy to reverse. Always test.
- **Leaderboard data is seeded demo data** — not connected to a real backend yet.
- **Price chart candles are synthetic** (seeded PRNG) — not live market data.
- **Stop-loss/take-profit fields exist in forms but are NOT submitted** to Pacifica yet.
- **Sentiment triggers fire notifications but do NOT auto-execute trades.**
- **Multiple `useMarkets()` mounts can spawn duplicate polling intervals.**
- **No React error boundaries** — a single component crash takes down the dashboard.

## WIP / Incomplete Features

- Badge awarding logic (types defined, not earned)
- Referral system (store exists, no full UI)
- Auto-trade execution from sentiment triggers
- Live chart data (currently synthetic)
- State persistence (localStorage/backend)
- Error boundaries

## Premium UX Standards

This app targets a premium trading experience. Every interaction should feel polished:

- **Animations**: Use `page-enter` transitions, smooth number count-ups (`useCountUp`), and micro-interactions on state changes.
- **Feedback**: Every user action (trade, close, trigger) gets immediate visual + toast feedback.
- **Loading**: Never show a blank screen. Use skeletons, shimmer effects, or optimistic UI.
- **Typography**: Respect the Plus Jakarta Sans / DM Sans hierarchy. Monospace for prices and PnL.
- **Color coding**: Green for profit/bullish, red for loss/bearish, purple for primary actions. Never mix.
- **Accessibility**: Keyboard navigation for modals, sufficient contrast ratios, focus indicators.
