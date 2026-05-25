-- Add optional air purity percentage to lab release logs
ALTER TABLE "LabReleaseLog" ADD COLUMN "airPurity" DOUBLE PRECISION;
