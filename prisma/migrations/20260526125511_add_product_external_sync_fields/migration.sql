-- AlterTable
ALTER TABLE "Product" ADD COLUMN "externalId" INTEGER;
ALTER TABLE "Product" ADD COLUMN "barcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalId_key" ON "Product"("externalId");
