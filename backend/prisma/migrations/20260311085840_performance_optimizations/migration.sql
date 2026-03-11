-- AlterTable
ALTER TABLE `blast_jobs` ADD COLUMN `failed_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `sent_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `total_recipients` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `blast_recipients_blast_job_id_status_idx` ON `blast_recipients`(`blast_job_id`, `status`);

-- CreateIndex
CREATE INDEX `messages_device_id_created_at_idx` ON `messages`(`device_id`, `created_at` DESC);
