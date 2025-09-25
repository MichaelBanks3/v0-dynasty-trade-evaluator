-- AlterTable
ALTER TABLE "Trade" ADD COLUMN "evaluationSnapshot" JSONB,
ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Trade_slug_key" ON "Trade"("slug");

-- CreateIndex
CREATE INDEX "Trade_slug_idx" ON "Trade"("slug");
