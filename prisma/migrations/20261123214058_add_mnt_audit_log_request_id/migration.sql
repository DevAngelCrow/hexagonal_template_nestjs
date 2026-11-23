-- AlterTable
ALTER TABLE "mnt_audit_log" ADD COLUMN     "request_id" VARCHAR(64);

-- CreateIndex
CREATE INDEX "mnt_audit_log_request_id_idx" ON "mnt_audit_log"("request_id");
