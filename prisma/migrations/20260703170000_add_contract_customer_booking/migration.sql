-- AlterTable (Contract): ผูกลูกค้า + เงินจอง
ALTER TABLE "Contract" ADD COLUMN "customerId" TEXT;
ALTER TABLE "Contract" ADD COLUMN "bookingPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contract" ADD COLUMN "bookingAmount" INTEGER;
ALTER TABLE "Contract" ADD COLUMN "slipUrl" TEXT;

-- CreateIndex
CREATE INDEX "Contract_customerId_idx" ON "Contract"("customerId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
