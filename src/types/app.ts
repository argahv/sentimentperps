export interface User {
  id: string;
  privyId: string;
  walletAddress: string;
  username?: string;
  avatarUrl?: string;
  referralCode: string;
  createdAt: Date;
}

export type TradeDirection = "long" | "short";
export type TradeStatus = "open" | "closed" | "liquidated";

export interface SentimentTrade {
  id: string;
  userId: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  leverage: number;
  pnlUsdc?: number;
  pnlPct?: number;
  sentimentScoreAtEntry: number; // 0-100 mapped from sentiment
  sentimentVelocityAtEntry: number; // mentions/min
  minutesAfterSignal: number;
  score?: number; // leaderboard score = profit_pct * (1 / minutes_after_signal)
  status: TradeStatus;
  openedAt: Date;
  closedAt?: Date;
}

export type LeaderboardPeriod = "daily" | "weekly" | "all-time";

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  period: LeaderboardPeriod;
  rank: number;
  totalScore: number;
  winRate: number;
  totalTrades: number;
  bestCallPnl: number;
  updatedAt: Date;
  /** 0-100 composite sentiment-weighted score */
  sentimentScore: number;
  /** Average minutes between signal and trade execution */
  avgResponseTime: number;
  /** Percentage of sentiment-aligned trades that were profitable */
  sentimentAccuracy: number;
}

export type BadgeType =
  | "first_mover" // First to trade on a sentiment signal
  | "contrarian" // Profitable trade against sentiment
  | "streak_3" // 3 winning trades in a row
  | "streak_5" // 5 winning trades in a row
  | "streak_10" // 10 winning trades in a row
  | "whale_hunter" // Single trade > $1000 profit
  | "sentiment_guru" // 80%+ win rate after 20+ trades
  | "speed_demon"; // Trade within 1 min of signal

export interface UserBadge {
  userId: string;
  badgeType: BadgeType;
  earnedAt: Date;
}

export interface TradeFormData {
  symbol: string;
  direction: TradeDirection;
  size: number;
  leverage: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
}

export interface TokenCardData {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number; // 0-100 mapped
  mentionCount: number;
  mentionChange: number; // percentage
  velocity: number;
  topMention?: {
    content: string;
    author: string;
    engagement: number;
  };
}

export type AppRoute =
  | "/"
  | "/dashboard"
  | "/trade"
  | "/leaderboard"
  | "/profile"
  | "/referral";

export interface AppNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}
