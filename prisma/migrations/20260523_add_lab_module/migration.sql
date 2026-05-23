-- 1. Extend Role enum (non-destructive in PostgreSQL)
ALTER TYPE "Role" ADD VALUE 'LAB_USER';

-- 2. New enum CustomerType
CREATE TYPE "CustomerType" AS ENUM ('OCCASIONAL_CUSTOMER', 'CLALIT_ENGINEERING');

-- 3. LabTechnician
CREATE TABLE "LabTechnician" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- 4. LabPart
CREATE TABLE "LabPart" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- 5. LabReleaseLog
CREATE TABLE "LabReleaseLog" (
  "id"               TEXT NOT NULL PRIMARY KEY,
  "serialNumber"     TEXT NOT NULL,
  "date"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "workingHours"     INTEGER NOT NULL,
  "customerType"     "CustomerType" NOT NULL,
  "isInspectionOnly" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "technicianId"     TEXT NOT NULL,
  CONSTRAINT "LabReleaseLog_technicianId_fkey"
    FOREIGN KEY ("technicianId") REFERENCES "LabTechnician"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "LabReleaseLog_serialNumber_idx"  ON "LabReleaseLog"("serialNumber");
CREATE INDEX "LabReleaseLog_technicianId_idx"  ON "LabReleaseLog"("technicianId");
CREATE INDEX "LabReleaseLog_date_idx"          ON "LabReleaseLog"("date");

-- 6. Implicit many-to-many join table (Prisma convention: alphabetical model name order)
CREATE TABLE "_LabPartToLabReleaseLog" (
  "A" TEXT NOT NULL,  -- LabPart.id
  "B" TEXT NOT NULL,  -- LabReleaseLog.id
  CONSTRAINT "_LabPartToLabReleaseLog_A_fkey"
    FOREIGN KEY ("A") REFERENCES "LabPart"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_LabPartToLabReleaseLog_B_fkey"
    FOREIGN KEY ("B") REFERENCES "LabReleaseLog"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "_LabPartToLabReleaseLog_AB_unique" ON "_LabPartToLabReleaseLog"("A","B");
CREATE INDEX "_LabPartToLabReleaseLog_B_index"          ON "_LabPartToLabReleaseLog"("B");
