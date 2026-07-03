-- AlterTable (User): รหัสรันลูกค้าต่อคน
ALTER TABLE "User" ADD COLUMN "customerPrefix" TEXT;
ALTER TABLE "User" ADD COLUMN "customerSeq" INTEGER NOT NULL DEFAULT 0;

-- AlterTable (Customer): รหัส + งบ
ALTER TABLE "Customer" ADD COLUMN "code" TEXT;
ALTER TABLE "Customer" ADD COLUMN "budget" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");
