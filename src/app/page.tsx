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
  Sparkles,
  ChevronRight,
  Shield,
} from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    num: "01",
    title: "Scan Sentiment",
    desc: "Elfa AI aggregates social signals across Twitter, Discord, and Telegram in real time. See which tokens are surging before price moves.",
    icon: Activity,
    iconColor: "text-primary",
  },
  {
    num: "02",
    title: "Open Position",
    desc: "Execute sentiment-driven long or short perpetual futures on Pacifica with up to 20x leverage. Set TP/SL and trade with conviction.",
    icon: Target,
    iconColor: "text-accent-secondary",
  },
  {
    num: "03",
    title: "Climb Leaderboard",
    desc: "Earn points for profitable sentiment calls. Rise through the ranks, collect badges, and compete for top trader status.",
    icon: Trophy,
    iconColor: "text-success",
  },
];

const FEATURES = [
  {
    title: "Real-time Sentiment",
    desc: "Live social signal aggregation across major crypto communities. Bullish, bearish, or neutral — know the mood before you trade.",
    icon: BarChart3,
    sponsor: "Elfa AI",
    iconColor: "text-primary",
  },
  {
    title: "Lightning Execution",
    desc: "Sub-second perpetual futures on Pacifica. Market and limit orders, adjustable leverage, and a builder-code revenue model.",
    icon: Zap,
    sponsor: "Pacifica",
    iconColor: "text-accent-secondary",
  },
  {
    title: "Cross-chain Deposits",
    desc: "Bridge assets from Ethereum, Arbitrum, Polygon, Optimism, or Base. One click, any chain — powered by Rhinofi.",
    icon: ArrowRightLeft,
    sponsor: "Rhinofi",
    iconColor: "text-success",
  },
  {
    title: "Referral Rewards",
    desc: "Invite friends, earn a share of their trading fees. Track referrals, monitor payouts, and grow your network.",
    icon: Users,
    sponsor: "Fuul",
    iconColor: "text-warning",
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
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* ─── Floating Nav ─── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-display font-bold tracking-tight">
            Sentiment<span className="text-primary">Perps</span>
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              How It Works
            </a>
            <Link
              href="/dashboard"
              className="neu-btn rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-white"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative flex flex-col items-center overflow-hidden px-6 pb-20 pt-24 sm:pt-32 lg:pt-40">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              "radial-gradient(ellipse at center, #6C63FF 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -top-20 left-1/3 h-[400px] w-[500px] -translate-x-1/2 rounded-full opacity-15 blur-[100px]"
          style={{
            background:
              "radial-gradient(ellipse at center, #38B2AC 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
          {/* Badge */}
          <span className="neu-extruded-sm mb-6 inline-flex items-center gap-2 rounded-full bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built for Pacifica Hackathon 2026
          </span>

          <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight sm:text-7xl lg:text-8xl">
            Trade the{" "}
            <span className="bg-gradient-to-r from-primary to-accent-secondary bg-clip-text text-transparent">
              Mood
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Spot viral tokens before the crowd. Execute sentiment-driven
            perpetual futures on Pacifica. Climb the leaderboard.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="neu-btn group flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-base font-semibold text-white"
            >
              Launch App
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="neu-btn flex items-center gap-2 rounded-2xl bg-background px-8 py-3.5 text-base font-medium text-muted-foreground"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Animated pulse ring */}
        <div className="relative mt-16 flex items-center justify-center sm:mt-20">
          <div className="absolute h-48 w-48 animate-ping rounded-full opacity-20 sm:h-64 sm:w-64" style={{ animationDuration: "3s", boxShadow: "0 0 0 1px rgba(108,99,255,0.3)" }} />
          <div className="absolute h-36 w-36 animate-ping rounded-full opacity-15 sm:h-48 sm:w-48" style={{ animationDuration: "4s", animationDelay: "0.5s", boxShadow: "0 0 0 1px rgba(56,178,172,0.3)" }} />
          <div className="neu-card flex h-24 w-24 items-center justify-center rounded-full bg-background sm:h-32 sm:w-32" style={{ borderRadius: "9999px" }}>
            <TrendingUp className="h-10 w-10 text-primary sm:h-14 sm:w-14" />
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="px-6 py-4">
        <div className="neu-extruded mx-auto grid max-w-5xl grid-cols-2 rounded-[32px] bg-background lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 px-6 py-8"
            >
              <div className="neu-icon-well mb-2 flex h-10 w-10 items-center justify-center rounded-xl">
                <stat.icon className="h-5 w-5 text-muted" />
              </div>
              <span className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              How It Works
            </span>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to sentiment alpha
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              From social signal to executed trade in seconds. No noise, pure signal.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.num} className="group relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-4 top-12 hidden h-1 w-8 rounded-full bg-background sm:block" style={{ boxShadow: "inset 2px 2px 4px rgb(163,177,198,0.4), inset -2px -2px 4px rgba(255,255,255,0.4)" }} />
                )}
                <div className="neu-card flex flex-col rounded-[32px] bg-background p-6 transition-all duration-300">
                  <div className="neu-icon-well mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                    <step.icon className={`h-6 w-6 ${step.iconColor}`} />
                  </div>
                  <span className="mb-1 text-xs font-bold uppercase tracking-widest text-muted">
                    Step {step.num}
                  </span>
                  <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Features
            </span>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to trade sentiment
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Four sponsor integrations. One seamless experience.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="neu-card group rounded-[32px] bg-background p-6 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="neu-icon-well flex h-12 w-12 items-center justify-center rounded-2xl">
                    <feat.icon className={`h-6 w-6 ${feat.iconColor}`} />
                  </div>
                  <span className="neu-extruded-sm rounded-full bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {feat.sponsor}
                  </span>
                </div>
                <h3 className="font-display mt-4 text-lg font-semibold">{feat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Powered By / Sponsors ─── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Powered By
          </span>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {SPONSORS.map((s) => (
              <div
                key={s.name}
                className="neu-extruded-sm flex items-center gap-2 rounded-full bg-background px-5 py-2.5 transition-all duration-300 hover:shadow-neu-hover hover:translate-y-[-2px]"
              >
                <Shield className="h-4 w-4 text-muted" />
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {s.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, #6C63FF 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Start Trading Now
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect your wallet. Scan sentiment. Open your first position in under 60 seconds.
          </p>
          <Link
            href="/dashboard"
            className="neu-btn group mt-8 flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 text-lg font-semibold text-white"
          >
            Launch App
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-8">
        <div className="neu-extruded mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 rounded-[32px] bg-background px-8 py-6 sm:flex-row">
          <span className="font-display text-sm font-medium">
            Sentiment<span className="text-primary">Perps</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Built for Pacifica Hackathon 2026 on DoraHacks
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/leaderboard"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Leaderboard
            </Link>
            <Link
              href="/trade"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Trade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
