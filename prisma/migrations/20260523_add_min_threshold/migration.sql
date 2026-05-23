-- Add minThreshold to CatalogItem
-- Non-breaking: column has DEFAULT 0, all existing rows get 0 (no alert).
ALTER TABLE "CatalogItem" ADD COLUMN "minThreshold" INTEGER NOT NULL DEFAULT 0;
