-- CreateEnum
CREATE TYPE "FurnitureCategory" AS ENUM ('LIVING', 'BEDROOM', 'MASTER_BEDROOM', 'KITCHEN', 'BALCONY', 'BATHROOM_1', 'BATHROOM_2');

-- CreateTable
CREATE TABLE "FurnitureItem" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "category" "FurnitureCategory" NOT NULL,
    "isDefect" BOOLEAN NOT NULL DEFAULT false,
    "caption" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FurnitureItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FurnitureItem_contractId_idx" ON "FurnitureItem"("contractId");

-- AddForeignKey
ALTER TABLE "FurnitureItem" ADD CONSTRAINT "FurnitureItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
