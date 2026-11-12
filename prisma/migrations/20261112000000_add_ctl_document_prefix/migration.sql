-- CreateTable
CREATE TABLE "ctl_document_prefix" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "entity_target" VARCHAR(50) NOT NULL,
    "current_year" INTEGER,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "padding" INTEGER NOT NULL DEFAULT 4,
    "reset_yearly" BOOLEAN NOT NULL DEFAULT true,
    "separator" VARCHAR(5) NOT NULL DEFAULT '-',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0),
    "deleted_at" TIMESTAMP(0),

    CONSTRAINT "ctl_document_prefix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ctl_document_prefix_code_key" ON "ctl_document_prefix"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ctl_document_prefix_prefix_key" ON "ctl_document_prefix"("prefix");

-- CreateIndex
CREATE INDEX "ctl_document_prefix_active_idx" ON "ctl_document_prefix"("active");

