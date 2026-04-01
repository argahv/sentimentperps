// Elfa AI API Types
// Docs: https://go.elfa.ai/dev
// Base URL: https://api.elfa.ai/v2

export interface ElfaToken {
  token_symbol: string;
  token_name: string;
  token_address?: string;
  chain?: string;
}

export interface ElfaTrendingToken {
  token: ElfaToken | string; // API returns string, we normalize to object
  current_count: number;
  previous_count: number;
  change_percent: number;
}

export interface ElfaTrendingResponse {
  success: boolean;
  data: {
    data: ElfaTrendingToken[];
  };
}

export interface ElfaMention {
  id: string;
  content: string;
  created_at: string;
  author: {
    username: string;
    display_name: string;
    profile_image_url?: string;
    followers_count: number;
  };
  engagement: {
    like_count: number;
    reply_count: number;
    retweet_count: number;
    view_count: number;
  };
  sentiment: "positive" | "negative" | "neutral" | null;
  source: string;
}

export interface ElfaTopMentionsResponse {
  success: boolean;
  data: {
    mentions: ElfaMention[];
    total: number;
    page: number;
    page_size: number;
  };
}

export interface ElfaKeywordMentionsResponse {
  success: boolean;
  data: {
    mentions: ElfaMention[];
    cursor?: string;
  };
}

export interface ElfaTokenInsight {
  token_symbol: string;
  sentiment: "positive" | "negative" | "neutral";
  mention_count: number;
  unique_authors: number;
  average_engagement: number;
  top_sources: string[];
}

export interface ElfaTokenInsightResponse {
  success: boolean;
  data: ElfaTokenInsight;
}

export interface SentimentSignal {
  symbol: string;
  name: string;
  sentiment: "positive" | "negative" | "neutral";
  mentionCount: number;
  mentionChange: number; // percentage change
  velocity: number; // mentions per minute trending
  topMentions: ElfaMention[];
  updatedAt: Date;
}
