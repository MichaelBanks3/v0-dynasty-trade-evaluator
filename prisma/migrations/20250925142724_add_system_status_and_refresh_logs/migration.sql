-- CreateTable
CREATE TABLE "SystemStatus" (
    "id" TEXT NOT NULL,
    "lastRefreshAt" TIMESTAMP(3),
    "playerCount" INTEGER NOT NULL DEFAULT 0,
    "valuationCount" INTEGER NOT NULL DEFAULT 0,
    "pickCount" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshLog" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "playerCount" INTEGER NOT NULL DEFAULT 0,
    "valuationCount" INTEGER NOT NULL DEFAULT 0,
    "pickCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'running',
    "error" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',

    CONSTRAINT "RefreshLog_pkey" PRIMARY KEY ("id")
);
