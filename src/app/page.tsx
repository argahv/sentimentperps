import {
  TrendingUp,
  Zap,
  Trophy,
  ArrowRightLeft,
  BarChart3,
  Users,
  Activity,
  Globe,
  Target,
  ChevronRight,
  Shield,
  ActivityIcon,
} from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    num: "01",
    title: "Scan Sentiment",
    desc: "Elfa AI aggregates social signals across Twitter, Discord, and Telegram in real time. See which tokens are surging before price moves.",
    icon: Activity,
  },
  {
    num: "02",
    title: "Open Position",
    desc: "Execute sentiment-driven long or short perpetual futures on Pacifica with up to 20x leverage. Set TP/SL and trade with conviction.",
    icon: Target,
  },
  {
    num: "03",
    title: "Climb Leaderboard",
    desc: "Earn points for profitable sentiment calls. Rise through the ranks, collect badges, and compete for top trader status.",
    icon: Trophy,
  },
];

const FEATURES = [
  {
    title: "Real-time Sentiment",
    desc: "Live social signal aggregation across major crypto communities. Bullish, bearish, or neutral — know the mood before you trade.",
    icon: BarChart3,
    sponsor: "Elfa AI",
  },
  {
    title: "Lightning Execution",
    desc: "Sub-second perpetual futures on Pacifica. Market and limit orders, adjustable leverage, and a builder-code revenue model.",
    icon: Zap,
    sponsor: "Pacifica",
  },
  {
    title: "Cross-chain Deposits",
    desc: "Bridge assets from Ethereum, Arbitrum, Polygon, Optimism, or Base. One click, any chain — powered by Rhinofi.",
    icon: ArrowRightLeft,
    sponsor: "Rhinofi",
  },
  {
    title: "Referral Rewards",
    desc: "Invite friends, earn a share of their trading fees. Track referrals, monitor payouts, and grow your network.",
    icon: Users,
    sponsor: "Fuul",
  },
];

const STATS = [
  { value: "50+", label: "Active Traders", icon: Users },
  { value: "$1.2M", label: "Volume Traded", icon: TrendingUp },
  { value: "5", label: "Chains Supported", icon: Globe },
  { value: "24/7", label: "Live Signals", icon: Activity },
];

const SPONSORS = [
  { name: "Pacifica", role: "Perpetual Futures" },
  { name: "Elfa AI", role: "Sentiment Engine" },
  { name: "Rhinofi", role: "Cross-chain Bridge" },
  { name: "Fuul", role: "Referral Rewards" },
  { name: "Privy", role: "Wallet Auth" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground page-enter">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link
            href="/"
            className="flex min-h-[48px] items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sentiment<span className="text-primary">Perps</span>
          </Link>

          {/* SYSTEM OPERATIONAL LED */}
          <div className="hidden flex-col items-end md:flex">
            <div className="flex items-center gap-2 rounded-sm bg-surface-elevated px-2 py-1 shadow-neu-inset-sm">
              <div className="led-indicator led-green" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-success">
                System Operational
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="hidden min-h-[48px] items-center text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:flex"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden min-h-[48px] items-center text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:flex"
            >
              How It Works
            </a>
            <Link
              href="/dashboard"
              className="flat-btn-primary flex min-h-[48px] items-center justify-center px-6 py-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col overflow-hidden px-4 pb-20 pt-16 md:px-8 md:pb-32 md:pt-24 lg:pt-32">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
          
          {/* Left: Copy */}
          <div className="relative z-10 flex flex-col items-start card-entrance" style={{ animationDelay: '100ms' }}>
            <div className="mb-6 flex items-center gap-2 rounded-full bg-surface-elevated border border-border px-3 py-1 shadow-neu-sm">
              <ActivityIcon className="h-3 w-3 text-primary animate-pulse" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                Sentiment Trading Engine v1.0
              </span>
            </div>

            <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl" style={{ fontFamily: 'var(--font-display)' }}>
              Trade
              <br />
              The <span className="text-primary">Mood</span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Spot viral tokens before the crowd. Execute sentiment-driven
              perpetual futures on Pacifica. Climb the leaderboard.
            </p>

            <div className="mt-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
              <Link
                href="/dashboard"
                className="flat-btn-primary group flex min-h-[48px] items-center justify-center gap-2 px-8 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Initialize
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
              </Link>
              <a
                href="#how-it-works"
                className="flat-btn-outline flex min-h-[48px] items-center justify-center gap-2 px-8 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Read Manual
              </a>
            </div>
          </div>

          {/* Right: 3D Device Visualization */}
          <div className="relative z-10 mx-auto w-full max-w-[340px] sm:max-w-md lg:max-w-lg card-entrance" style={{ animationDelay: '250ms' }}>
            <div className="device-bezel carbon-fiber aspect-[4/3] w-full p-4 shadow-2xl sm:p-6">
              
              {/* Mechanical Side Buttons */}
              <div className="absolute -left-[5px] top-12 h-16 w-[5px] rounded-l-sm border-y border-l border-border bg-surface-elevated shadow-[-2px_0_4px_rgba(0,0,0,0.5)]" />
              <div className="absolute -left-[5px] top-32 h-10 w-[5px] rounded-l-sm border-y border-l border-border bg-surface-elevated shadow-[-2px_0_4px_rgba(0,0,0,0.5)]" />
              <div className="absolute -right-[5px] top-20 h-24 w-[5px] rounded-r-sm border-y border-r border-border bg-surface-elevated shadow-[2px_0_4px_rgba(0,0,0,0.5)]" />
              
              {/* Inner Screen */}
              <div className="device-screen scanlines relative flex h-full w-full flex-col gap-4 overflow-hidden rounded-md border-2 border-border-muted bg-[#050709] p-3 sm:p-4">
                <div className="lighting-hotspot" />
                
                {/* Screen Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-border-muted pb-2">
                  <div className="flex items-center gap-2">
                    <div className="led-indicator led-green" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-success sm:text-[10px]">
                      Live Feed
                    </span>
                  </div>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                    Pacifica
                  </span>
                </div>
                
                {/* Screen Body */}
                <div className="relative z-10 flex flex-1 gap-3 sm:gap-4">
                  {/* Chart Mockup */}
                  <div className="relative flex flex-1 items-end gap-1 overflow-hidden rounded border border-border-muted bg-surface-muted/50 p-2">
                    <div className="swiss-grid-pattern absolute inset-0 opacity-20" />
                    <div className="bar-animate w-1/5 rounded-t-sm bg-primary/20" style={{ height: '30%', animationDelay: '300ms' }} />
                    <div className="bar-animate w-1/5 rounded-t-sm bg-primary/40" style={{ height: '50%', animationDelay: '400ms' }} />
                    <div className="bar-animate w-1/5 rounded-t-sm bg-primary/60" style={{ height: '40%', animationDelay: '500ms' }} />
                    <div className="bar-animate w-1/5 rounded-t-sm bg-success/60" style={{ height: '70%', animationDelay: '600ms' }} />
                    <div className="bar-animate w-1/5 rounded-t-sm bg-success/80" style={{ height: '90%', animationDelay: '700ms' }} />
                  </div>
                  
                  {/* Orderbook Mockup */}
                  <div className="flex w-1/3 flex-col gap-1.5 sm:gap-2">
                    <div className="bar-animate h-3 w-full rounded-sm bg-danger/20 sm:h-4" style={{ animationDelay: '800ms' }} />
                    <div className="bar-animate h-3 w-4/5 rounded-sm bg-danger/40 sm:h-4" style={{ animationDelay: '900ms' }} />
                    <div className="my-1 border-t border-border-muted/50" />
                    <div className="bar-animate h-3 w-full rounded-sm bg-success/40 sm:h-4" style={{ animationDelay: '1000ms' }} />
                    <div className="bar-animate h-3 w-5/6 rounded-sm bg-success/60 sm:h-4" style={{ animationDelay: '1100ms' }} />
                  </div>
                </div>
              </div>
              
              {/* Power LED */}
              <div className="absolute bottom-2 right-4 flex items-center gap-2 sm:bottom-3 sm:right-6">
                <div className="led-indicator led-green" style={{ width: '6px', height: '6px' }} />
                <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                  PWR
                </span>
              </div>
              {/* Bezel Screws */}
              <div className="shadow-neu-inset-sm absolute left-3 top-3 h-2 w-2 rounded-full border border-border-muted bg-surface-muted" />
              <div className="shadow-neu-inset-sm absolute right-3 top-3 h-2 w-2 rounded-full border border-border-muted bg-surface-muted" />
              <div className="shadow-neu-inset-sm absolute bottom-3 left-3 h-2 w-2 rounded-full border border-border-muted bg-surface-muted" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border-muted bg-surface-muted px-4 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="card-entrance flex flex-col items-start gap-2"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2">
                <div className="led-indicator led-green h-2 w-2" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flat-icon-well flex h-10 w-10 items-center justify-center">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="font-mono text-3xl font-black tabular-nums tracking-tight text-foreground sm:text-4xl">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-20 md:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <span className="shadow-neu-inset-sm mb-4 inline-flex items-center gap-2 rounded-sm bg-surface-elevated px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Process Sequence
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
              Three Steps to
              <br />
              Sentiment Alpha
            </h2>
          </div>

          <div className="relative mt-16 flex flex-col gap-8 md:mt-24 md:flex-row md:gap-6">
            {/* Mechanical connector pipe for desktop */}
            <div className="connector-pipe absolute left-0 right-0 top-1/2 hidden -translate-y-1/2 md:block" />
            
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="flat-card industrial-screws card-entrance group relative flex flex-1 flex-col rounded-lg p-6 sm:p-8"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Mechanical connector pipe for mobile */}
                {i !== STEPS.length - 1 && (
                  <div className="connector-pipe absolute -bottom-6 left-1/2 w-12 -translate-x-1/2 rotate-90 md:hidden" />
                )}
                
                <span className="mb-6 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                  SEQ_{step.num}
                </span>
                
                <div className="flat-icon-well mb-6 flex h-14 w-14 items-center justify-center">
                  <step.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                </div>
                
                <h3 className="text-xl font-black uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  {step.title}
                </h3>
                
                <p className="mt-4 font-sans text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="flat-section-alt border-y border-border-muted px-4 py-20 md:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start">
            <span className="shadow-neu-inset-sm mb-4 inline-flex items-center gap-2 rounded-sm bg-surface-elevated px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Module Specs
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-display)' }}>
              Everything You Need
              <br />
              To Trade Sentiment
            </h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:gap-8">
            {FEATURES.map((feat, i) => (
              <div
                key={feat.title}
                className="flat-card industrial-screws card-entrance group relative flex flex-col rounded-lg p-6 sm:p-8"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Vent Slots */}
                <div className="industrial-vents absolute right-4 top-4 sm:right-6 sm:top-6">
                  <div className="industrial-vent-slot" />
                  <div className="industrial-vent-slot" />
                  <div className="industrial-vent-slot" />
                </div>

                <div className="flex items-start justify-between pr-12">
                  <div className="flat-icon-well flex h-14 w-14 items-center justify-center">
                    <feat.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <h3 className="text-xl font-black uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                    {feat.title}
                  </h3>
                  <span className="flat-tag flat-tag-primary px-2 py-0.5">
                    {feat.sponsor}
                  </span>
                </div>

                <p className="mt-4 font-sans text-sm leading-relaxed text-muted-foreground">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="bg-surface px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <span className="mb-6 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {"// Integrated Systems"}
          </span>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {SPONSORS.map((s, i) => (
              <div
                key={s.name}
                className="flat-tag flex items-center gap-2 px-4 py-2 transition-transform duration-300 hover:scale-105"
                style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', animationDelay: `${i * 50}ms` }}
              >
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold">{s.name}</span>
                <span className="px-1 text-muted-foreground/60">•</span>
                <span className="text-muted-foreground">{s.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 md:px-8 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="device-bezel carbon-fiber flex flex-col items-center justify-center p-8 text-center shadow-2xl sm:p-16 lg:p-24">
            {/* Bezel Screws */}
            <div className="shadow-neu-inset-sm absolute left-4 top-4 h-3 w-3 rounded-full border border-border-muted bg-surface-muted" />
            <div className="shadow-neu-inset-sm absolute right-4 top-4 h-3 w-3 rounded-full border border-border-muted bg-surface-muted" />
            <div className="shadow-neu-inset-sm absolute bottom-4 left-4 h-3 w-3 rounded-full border border-border-muted bg-surface-muted" />
            <div className="shadow-neu-inset-sm absolute bottom-4 right-4 h-3 w-3 rounded-full border border-border-muted bg-surface-muted" />

            <span className="shadow-neu-inset-sm relative z-10 mb-6 inline-flex items-center gap-2 rounded-sm bg-surface-elevated px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Terminal Ready
            </span>
            
            <h2 className="relative z-10 text-4xl font-black uppercase tracking-tight sm:text-6xl lg:text-7xl" style={{ fontFamily: 'var(--font-display)' }}>
              Start Trading
              <br />
              <span className="text-primary">Now</span>
            </h2>
            
            <p className="relative z-10 mt-6 max-w-md font-sans text-base text-muted-foreground sm:text-lg">
              Connect your wallet. Scan sentiment. Open your first position in under 60 seconds.
            </p>
            
            <Link
              href="/dashboard"
              className="flat-btn-primary group relative z-10 mt-10 flex min-h-[56px] items-center justify-center gap-3 px-10 py-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Power On
              <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-muted bg-surface-muted px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <span className="text-sm font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>
              Sentiment<span className="text-primary">Perps</span>
            </span>
            <div className="flex items-center gap-2">
              <div className="led-indicator led-green h-1.5 w-1.5" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Pacifica Hackathon 2026 // DoraHacks
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/dashboard"
              className="flex min-h-[48px] items-center font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              [ Dashboard ]
            </Link>
            <Link
              href="/leaderboard"
              className="flex min-h-[48px] items-center font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              [ Leaderboard ]
            </Link>
            <Link
              href="/trade"
              className="flex min-h-[48px] items-center font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              [ Trade ]
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
