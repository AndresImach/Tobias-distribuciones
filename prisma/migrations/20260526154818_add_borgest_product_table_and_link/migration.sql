-- CreateTable
CREATE TABLE "BorgestProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "price1" REAL NOT NULL,
    "price2" REAL,
    "price3" REAL,
    "price4" REAL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL,
    "foto" TEXT,
    "syncedAt" DATETIME NOT NULL
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "borgestProductId" INTEGER REFERENCES "BorgestProduct"("id") ON DELETE SET NULL;
ALTER TABLE "Product" ADD COLUMN "priceList" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Product_borgestProductId_idx" ON "Product"("borgestProductId");
