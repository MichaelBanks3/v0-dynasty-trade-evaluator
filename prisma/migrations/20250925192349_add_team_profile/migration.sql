-- AlterTable
ALTER TABLE "public"."Player" ALTER COLUMN "value" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Trade" ALTER COLUMN "totalA" SET DEFAULT 0,
ALTER COLUMN "totalB" SET DEFAULT 0,
ALTER COLUMN "sideAPlayerIds" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "sideBPlayerIds" SET DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "public"."TeamProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeline" TEXT NOT NULL DEFAULT 'contend',
    "riskTolerance" TEXT NOT NULL DEFAULT 'medium',
    "leagueSettings" JSONB,
    "roster" JSONB NOT NULL,
    "ownedPicks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamProfile_userId_key" ON "public"."TeamProfile"("userId");

-- CreateIndex
CREATE INDEX "TeamProfile_userId_idx" ON "public"."TeamProfile"("userId");

-- AddForeignKey
ALTER TABLE "public"."TeamProfile" ADD CONSTRAINT "TeamProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
