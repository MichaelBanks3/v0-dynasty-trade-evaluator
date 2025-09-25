-- CreateTable
CREATE TABLE "public"."League" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'sleeper',
    "sleeperId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "settingsSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeagueTeam" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "sleeperId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "userHandle" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeagueRoster" (
    "id" TEXT NOT NULL,
    "leagueTeamId" TEXT NOT NULL,
    "playerIds" JSONB NOT NULL,
    "unmatchedIds" JSONB NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaguePick" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "ownerId" TEXT,
    "year" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "originalOwner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaguePick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "League_sleeperId_key" ON "public"."League"("sleeperId");

-- CreateIndex
CREATE INDEX "League_sleeperId_idx" ON "public"."League"("sleeperId");

-- CreateIndex
CREATE INDEX "League_platform_season_idx" ON "public"."League"("platform", "season");

-- CreateIndex
CREATE INDEX "LeagueTeam_leagueId_idx" ON "public"."LeagueTeam"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueTeam_leagueId_sleeperId_key" ON "public"."LeagueTeam"("leagueId", "sleeperId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueRoster_leagueTeamId_key" ON "public"."LeagueRoster"("leagueTeamId");

-- CreateIndex
CREATE INDEX "LeagueRoster_leagueTeamId_idx" ON "public"."LeagueRoster"("leagueTeamId");

-- CreateIndex
CREATE INDEX "LeaguePick_leagueId_idx" ON "public"."LeaguePick"("leagueId");

-- CreateIndex
CREATE INDEX "LeaguePick_ownerId_idx" ON "public"."LeaguePick"("ownerId");

-- CreateIndex
CREATE INDEX "LeaguePick_year_round_idx" ON "public"."LeaguePick"("year", "round");

-- AddForeignKey
ALTER TABLE "public"."LeagueTeam" ADD CONSTRAINT "LeagueTeam_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "public"."League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeagueRoster" ADD CONSTRAINT "LeagueRoster_leagueTeamId_fkey" FOREIGN KEY ("leagueTeamId") REFERENCES "public"."LeagueTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaguePick" ADD CONSTRAINT "LeaguePick_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "public"."League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaguePick" ADD CONSTRAINT "LeaguePick_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."LeagueTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
