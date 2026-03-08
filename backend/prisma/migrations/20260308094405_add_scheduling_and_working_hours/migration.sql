-- AlterTable
ALTER TABLE `messages` ADD COLUMN `scheduled_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    ADD COLUMN `working_hours_enabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `working_hours_end` VARCHAR(191) NULL DEFAULT '17:00',
    ADD COLUMN `working_hours_start` VARCHAR(191) NULL DEFAULT '09:00';
