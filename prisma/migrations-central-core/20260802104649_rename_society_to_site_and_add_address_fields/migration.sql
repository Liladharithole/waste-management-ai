/*
  Warnings:

  - You are about to drop the column `society_id` on the `buildings` table. All the data in the column will be lost.
  - You are about to drop the `societies` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `site_id` to the `buildings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `buildings` DROP FOREIGN KEY `buildings_society_id_fkey`;

-- DropForeignKey
ALTER TABLE `societies` DROP FOREIGN KEY `societies_organization_id_fkey`;

-- DropIndex
DROP INDEX `buildings_society_id_idx` ON `buildings`;

-- AlterTable
ALTER TABLE `buildings` DROP COLUMN `society_id`,
    ADD COLUMN `site_id` INTEGER NOT NULL,
    ADD COLUMN `wing` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `societies`;

-- CreateTable
CREATE TABLE `sites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address_line_1` VARCHAR(191) NOT NULL,
    `address_line_2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `postal_code` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'India',
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,

    UNIQUE INDEX `sites_uuid_key`(`uuid`),
    INDEX `sites_organization_id_idx`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `buildings_site_id_idx` ON `buildings`(`site_id`);

-- AddForeignKey
ALTER TABLE `sites` ADD CONSTRAINT `sites_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buildings` ADD CONSTRAINT `buildings_site_id_fkey` FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
