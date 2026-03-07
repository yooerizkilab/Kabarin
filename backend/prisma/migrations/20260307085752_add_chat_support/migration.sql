/*
  Warnings:

  - A unique constraint covering the columns `[external_id]` on the table `messages` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `messages` ADD COLUMN `direction` ENUM('INCOMING', 'OUTGOING') NOT NULL DEFAULT 'OUTGOING',
    ADD COLUMN `external_id` VARCHAR(191) NULL,
    ADD COLUMN `from` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `messages_external_id_key` ON `messages`(`external_id`);

-- CreateIndex
CREATE INDEX `messages_from_idx` ON `messages`(`from`);
