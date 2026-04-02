import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WALLETS = [
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "3nVvgWJ7LzAF7FKjTFwNkLh6oGpBi4dkr5ZMBnVf1sLL",
  "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
  "DRpbCBMxVnDK7maPMogtm4BKPDha43QoiGPKxG4rJkbv",
  "AXidNNuknAx2p86bDJxPS65pp8SkWJYEgRb79sHBmRfT",
  "FwR2yMJ7FSGt7mbqjqkH5oAS9FjDEnNkAGKLacgjPbpT",
  "BPFLoaderUpgradeab1e11111111111111111111111",
  "EPhvKAPgBzSrHf3bvqhnengeJ98i4RoH52HSmVddP8Mu",
  "CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq",
];

const SYMBOLS = ["SOL", "ETH", "AVAX", "ARB", "LINK"];
const DIRECTIONS = ["long", "short"] as const;

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function randomBetween(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

const BASE_PRICES: Record<string, number> = {
  SOL: 178,
  ETH: 3450,
  AVAX: 38.5,
  ARB: 1.25,
  LINK: 14.8,
};

async function main() {
  console.log("Clearing existing seed data...");
  await prisma.badge.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.referralClaim.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.referral.deleteMany();

  console.log("Seeding trades...");

  const now = Date.now();
  const DAY = 86400000;
  let tradeCount = 0;

  for (let w = 0; w < WALLETS.length; w++) {
    const wallet = WALLETS[w];
    const rng = seededRng((w + 1) * 7919);
    const numTrades = Math.floor(randomBetween(rng, 15, 45));

    for (let t = 0; t < numTrades; t++) {
      const symbol = SYMBOLS[Math.floor(rng() * SYMBOLS.length)];
      const direction = DIRECTIONS[Math.floor(rng() * 2)];
      const leverage = Math.floor(randomBetween(rng, 1, 10));
      const size = Math.round(randomBetween(rng, 50, 5000) * 100) / 100;
      const base = BASE_PRICES[symbol] ?? 100;
      const entryPrice = Math.round(base * randomBetween(rng, 0.92, 1.08) * 100) / 100;

      const pnlPct = randomBetween(rng, -25, 40);
      const exitPrice = Math.round(entryPrice * (1 + pnlPct / 100 / leverage) * 100) / 100;
      const pnlUsdc = Math.round(size * (pnlPct / 100) * 100) / 100;

      const sentimentAligned = rng() > 0.3;
      const sentimentScoreAtEntry = Math.round(randomBetween(rng, 20, 95));
      const minutesAfterSignal = Math.round(randomBetween(rng, 0.3, 15) * 10) / 10;

      const score =
        minutesAfterSignal > 0 && pnlPct > 0
          ? Math.round(pnlPct * (1 / minutesAfterSignal) * 100) / 100
          : 0;

      const daysAgo = Math.floor(randomBetween(rng, 0, 30));
      const closedAt = new Date(now - daysAgo * DAY - Math.floor(rng() * DAY));
      const createdAt = new Date(closedAt.getTime() - Math.floor(randomBetween(rng, 60000, 3600000)));

      await prisma.trade.create({
        data: {
          walletAddress: wallet,
          symbol,
          direction,
          leverage,
          size,
          entryPrice,
          exitPrice,
          pnlUsdc,
          pnlPct,
          sentimentScoreAtEntry,
          minutesAfterSignal,
          sentimentAligned,
          score,
          createdAt,
          closedAt,
        },
      });

      tradeCount++;
    }
  }

  console.log(`Created ${tradeCount} trades across ${WALLETS.length} wallets.`);

  console.log("Seeding referrals...");
  for (let i = 1; i < 6; i++) {
    await prisma.referral.create({
      data: {
        referrerWallet: WALLETS[0],
        referredWallet: WALLETS[i],
        referralCode: WALLETS[0].slice(0, 8).toUpperCase(),
      },
    });
  }
  for (let i = 6; i < 8; i++) {
    await prisma.referral.create({
      data: {
        referrerWallet: WALLETS[2],
        referredWallet: WALLETS[i],
        referralCode: WALLETS[2].slice(0, 8).toUpperCase(),
      },
    });
  }
  console.log("Created 7 referrals.");

  console.log("Evaluating badges for all wallets...");
  const { evaluateAndPersist } = await import("../src/lib/badges");

  for (const wallet of WALLETS) {
    const trades = await prisma.trade.findMany({
      where: { walletAddress: wallet },
      select: { score: true },
    });
    const totalScore = trades.reduce((s, t) => s + t.score, 0);
    const result = await evaluateAndPersist(wallet, totalScore);
    console.log(`  ${wallet.slice(0, 8)}: ${result.badges.length} badges, ${result.xpGained} XP`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
