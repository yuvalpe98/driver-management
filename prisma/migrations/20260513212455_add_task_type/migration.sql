-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DELIVERY', 'MAINTENANCE');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'DELIVERY';
