-- ScannedSerial: new table for serial-number tracking per delivered TaskItem.
-- Non-destructive — no existing tables are altered.

CREATE TABLE "ScannedSerial" (
  "id"               TEXT NOT NULL,
  "serialNumber"     TEXT NOT NULL,
  "scannedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskItemId"       TEXT NOT NULL,
  "taskCompletionId" TEXT NOT NULL,
  CONSTRAINT "ScannedSerial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScannedSerial_serialNumber_key" ON "ScannedSerial"("serialNumber");
CREATE INDEX "ScannedSerial_taskItemId_idx"       ON "ScannedSerial"("taskItemId");
CREATE INDEX "ScannedSerial_taskCompletionId_idx" ON "ScannedSerial"("taskCompletionId");

ALTER TABLE "ScannedSerial"
  ADD CONSTRAINT "ScannedSerial_taskItemId_fkey"
  FOREIGN KEY ("taskItemId") REFERENCES "TaskItem"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ScannedSerial"
  ADD CONSTRAINT "ScannedSerial_taskCompletionId_fkey"
  FOREIGN KEY ("taskCompletionId") REFERENCES "TaskCompletion"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
