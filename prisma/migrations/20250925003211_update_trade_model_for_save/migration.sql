/*
  Warnings:

  - You are about to drop the column `diff` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `teamAIds` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `teamBIds` on the `Trade` table. All the data in the column will be lost.
  - Made the column `userId` on table `Trade` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Trade" DROP COLUMN "diff",
DROP COLUMN "teamAIds",
DROP COLUMN "teamBIds",
ADD COLUMN     "sideAPlayerIds" TEXT[],
ADD COLUMN     "sideBPlayerIds" TEXT[],
ALTER COLUMN "userId" SET NOT NULL;
