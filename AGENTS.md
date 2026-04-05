<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# SentimentPerps — Project Guidelines

> **This platform handles real money.** Every code change must be evaluated through the lens of financial safety, signature integrity, and user trust. When in doubt, fail closed.

## What This Is

A sentiment-driven perpetual futures trading platform on Solana. Users trade perps on Pacifica exchange based on social sentiment signals from Elfa AI. Auth via Privy embedded wallets. Dark Industrial Skeuomorphism UI (neumorphic shadows, manufacturing details, Space Grotesk + IBM Plex Sans + JetBrains Mono), Next.js 16, React 19, Zustand state, Tailwind CSS 4.

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

### Design System — Dark Industrial Skeuomorphism

```
Background: #12151C    Surface: #181C26    Elevated: #1E2330    Muted: #0D0F14
Text: #E8ECF1          Text-muted: #6B7A8D  Border: #2A3040     Border-bright: #3A4560
Primary: #FF4757 (Safety Orange-Red)   Success: #22C55E   Danger: #FF4757   Warning: #FBBF24
Fonts: Space Grotesk (display/headings) + IBM Plex Sans (body) + JetBrains Mono (mono/data)
Border-radius: rounded-lg (8px cards), rounded-md (6px inner elements)
Shadows: Dual neumorphic (dark + light offset) — never flat, always 3D depth
Animations: duration-150/200 ease-out (snappy, mechanical — never bouncy)
```

**Shadow system** (neumorphic dual-shadow):

- `shadow-neu` — Default card depth (6px dark + 6px light offset)
- `shadow-neu-hover` — Elevated hover state (10px + inset highlight)
- `shadow-neu-inset` — Recessed/pressed elements (inset 3px)
- `shadow-neu-inset-deep` — Deep inset for active/pressed states (inset 5px)

**Utility classes** (defined in `globals.css`):

- `swiss-card` / `flat-card` / `neu-card` — Card containers with neumorphic shadows + border
- `swiss-btn-accent` — Primary CTA (bg-primary, neumorphic shadow, active:translate-y-[1px])
- `swiss-btn-outline` — Secondary button (border, hover inverts with shadow)
- `swiss-btn` — Base button style with mechanical press physics
- `swiss-input` / `swiss-input-box` / `flat-input` — Form inputs with inset neumorphic shadow
- `swiss-icon-well` / `flat-icon-well` — Icon containers with inset shadow
- `industrial-screws` — Corner screw decorations on major card containers (::before)
- `industrial-vents` — Horizontal vent slot pattern on headers/dividers (::before)
- `led-green` / `led-red` / `led-yellow` / `led-blue` — LED status indicators with glow
- `connector-pipe` — Vertical pipe connector between sections
- `push-pin` — Pin decoration for pinned/featured items
- `device-bezel` / `device-screen` — Hardware device frame styling
- `scanlines` — CRT scanline overlay (::after)
- `carbon-fiber` — Subtle carbon fiber texture background

**Industrial details**: Use `industrial-screws` on outermost card wrappers of major components. Do NOT apply screws to small elements (badges, chips, nested cards). LED indicators for status displays. Vent slots for section dividers. Scanlines sparingly for accent.

All new UI must follow the Dark Industrial Skeuomorphism style — neumorphic cards with dual shadows, rounded corners, mechanical button physics, manufacturing-inspired decorations (screws, vents, LEDs), premium dark palette. See `src/app/globals.css` for the full token set and utility class definitions.

## Known Pitfalls

- **Pacifica auth timestamps**: 60s expiry window. Client clock skew = auth failures.
- **Position close side flip**: `long → ask`, `short → bid`. Easy to reverse. Always test.
- **Leaderboard data is seeded demo data** — not connected to a real backend yet.
- **Price chart candles are synthetic** (seeded PRNG) — not live market data.
- **Multiple `useMarkets()` mounts can spawn duplicate polling intervals.**

## WIP / Incomplete Features

- Live chart data (currently synthetic)
- State persistence (localStorage/backend)

## Premium UX Standards

This app targets a premium trading experience. Every interaction should feel polished:

- **Animations**: Use `page-enter` transitions, smooth number count-ups (`useCountUp`), and micro-interactions on state changes.
- **Feedback**: Every user action (trade, close, trigger) gets immediate visual + toast feedback.
- **Loading**: Never show a blank screen. Use skeletons, shimmer effects, or optimistic UI.
- **Typography**: Respect the Space Grotesk (headings) / IBM Plex Sans (body) / JetBrains Mono (data) hierarchy. Monospace for prices and PnL.
- **Color coding**: Green (#22C55E) for profit/bullish, red (#FF4757) for loss/bearish, primary (#FF4757) for actions. Never mix.
- **Accessibility**: Keyboard navigation for modals, sufficient contrast ratios, focus indicators.

Always make sure its ready for hackathon, and that it follows the guidelines in AGENTS.md upate .agents for anything related to hackathon. MUST always remeber to use Fuul Rhinofi ,PRIVY,PACIFICA,ELFA where relevant, they should all be implemented where needed as its for hackathon, use relevant skills where needed.
REMEMBER I need it complete by 14th of April 2026

Upon completion of each session, summarize and save the work done, and update the logs to ../ai-sessions.md
