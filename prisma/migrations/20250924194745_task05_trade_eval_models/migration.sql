/*
  Warnings:

  - You are about to drop the column `resultJson` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `sideAJson` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `sideBJson` on the `Trade` table. All the data in the column will be lost.
  - Added the required column `diff` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamAIds` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamBIds` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalA` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalB` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verdict` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Position" AS ENUM ('QB', 'RB', 'WR', 'TE');

-- AlterTable
ALTER TABLE "public"."Trade" DROP COLUMN "resultJson",
DROP COLUMN "sideAJson",
DROP COLUMN "sideBJson",
ADD COLUMN     "diff" INTEGER NOT NULL,
ADD COLUMN     "teamAIds" JSONB NOT NULL,
ADD COLUMN     "teamBIds" JSONB NOT NULL,
ADD COLUMN     "totalA" INTEGER NOT NULL,
ADD COLUMN     "totalB" INTEGER NOT NULL,
ADD COLUMN     "verdict" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" "public"."Position" NOT NULL,
    "team" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);
