-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walletAddress" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "leverage" DOUBLE PRECISION NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "exitPrice" DOUBLE PRECISION NOT NULL,
    "pnlUsdc" DOUBLE PRECISION NOT NULL,
    "pnlPct" DOUBLE PRECISION NOT NULL,
    "sentimentScoreAtEntry" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minutesAfterSignal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sentimentAligned" BOOLEAN NOT NULL DEFAULT true,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrerWallet" TEXT NOT NULL,
    "referredWallet" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walletAddress" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClaim" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walletAddress" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "ReferralClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trade_walletAddress_idx" ON "Trade"("walletAddress");

-- CreateIndex
CREATE INDEX "Trade_closedAt_idx" ON "Trade"("closedAt");

-- CreateIndex
CREATE INDEX "Trade_walletAddress_closedAt_idx" ON "Trade"("walletAddress", "closedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredWallet_key" ON "Referral"("referredWallet");

-- CreateIndex
CREATE INDEX "Referral_referrerWallet_idx" ON "Referral"("referrerWallet");

-- CreateIndex
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Badge_walletAddress_idx" ON "Badge"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_walletAddress_badgeType_key" ON "Badge"("walletAddress", "badgeType");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_walletAddress_key" ON "UserProgress"("walletAddress");

-- CreateIndex
CREATE INDEX "UserProgress_walletAddress_idx" ON "UserProgress"("walletAddress");

-- CreateIndex
CREATE INDEX "ReferralClaim_walletAddress_idx" ON "ReferralClaim"("walletAddress");
