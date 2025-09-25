-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'IR', 'OUT', 'QUESTIONABLE', 'DOUBTFUL', 'SUSPENDED', 'RETIRED');

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "sleeperId" TEXT,
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tier" INTEGER,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "team" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Player_sleeperId_key" ON "Player"("sleeperId");

-- CreateIndex
CREATE INDEX "Player_name_idx" ON "Player"("name");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE INDEX "Player_team_idx" ON "Player"("team");

-- CreateIndex
CREATE INDEX "Player_status_idx" ON "Player"("status");

-- CreateTable
CREATE TABLE "Valuation" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "scoring" TEXT NOT NULL DEFAULT 'PPR',
    "superflex" BOOLEAN NOT NULL DEFAULT false,
    "tePremium" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "marketValue" DOUBLE PRECISION,
    "projNow" DOUBLE PRECISION,
    "projFuture" DOUBLE PRECISION,
    "ageAdjustment" DOUBLE PRECISION,
    "riskAdjustment" DOUBLE PRECISION,
    "compositeValue" DOUBLE PRECISION,
    "nowScore" DOUBLE PRECISION,
    "futureScore" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Valuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "baselineValue" DOUBLE PRECISION NOT NULL,
    "marketValue" DOUBLE PRECISION,
    "compositeValue" DOUBLE PRECISION,
    "label" TEXT NOT NULL,

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Valuation_playerId_scoring_superflex_tePremium_key" ON "Valuation"("playerId", "scoring", "superflex", "tePremium");

-- CreateIndex
CREATE INDEX "Valuation_compositeValue_idx" ON "Valuation"("compositeValue");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_year_round_key" ON "Pick"("year", "round");

-- CreateIndex
CREATE INDEX "Pick_year_idx" ON "Pick"("year");

-- CreateIndex
CREATE INDEX "Pick_round_idx" ON "Pick"("round");

-- CreateIndex
CREATE INDEX "Pick_compositeValue_idx" ON "Pick"("compositeValue");

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "teamA" JSONB,
ADD COLUMN     "teamB" JSONB,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "nowDelta" DOUBLE PRECISION,
ADD COLUMN     "futureDelta" DOUBLE PRECISION,
ADD COLUMN     "breakdown" JSONB;

-- CreateIndex
CREATE INDEX "Trade_createdAt_idx" ON "Trade"("createdAt");

-- AddForeignKey
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
