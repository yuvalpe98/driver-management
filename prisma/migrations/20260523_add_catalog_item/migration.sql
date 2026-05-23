-- Step 1: Clear existing inventory and equipment rows
-- (breaking schema change: name → catalogItemId FK, no way to auto-migrate free-text)
TRUNCATE TABLE "InventoryItem" CASCADE;
TRUNCATE TABLE "Equipment" CASCADE;

-- Step 2: Create the CatalogCategory enum
CREATE TYPE "CatalogCategory" AS ENUM ('INVENTORY', 'EQUIPMENT');

-- Step 3: Create the CatalogItem master table
CREATE TABLE "CatalogItem" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "category"  "CatalogCategory" NOT NULL,
    "unit"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogItem_name_key" ON "CatalogItem"("name");

-- Step 4: Add catalogItemId to Equipment, drop old name column
ALTER TABLE "Equipment" ADD COLUMN "catalogItemId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipment" DROP COLUMN "name";
-- Remove the temporary default now that the column exists
ALTER TABLE "Equipment" ALTER COLUMN "catalogItemId" DROP DEFAULT;

-- Step 5: Add catalogItemId to InventoryItem, drop old name and unit columns
ALTER TABLE "InventoryItem" ADD COLUMN "catalogItemId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InventoryItem" DROP COLUMN "name";
ALTER TABLE "InventoryItem" DROP COLUMN "unit";
-- Remove the temporary default
ALTER TABLE "InventoryItem" ALTER COLUMN "catalogItemId" DROP DEFAULT;

-- Step 6: Add unique constraint on InventoryItem [driverId, catalogItemId]
CREATE UNIQUE INDEX "InventoryItem_driverId_catalogItemId_key" ON "InventoryItem"("driverId", "catalogItemId");

-- Step 7: Add foreign key constraints
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_catalogItemId_fkey"
    FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_catalogItemId_fkey"
    FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
