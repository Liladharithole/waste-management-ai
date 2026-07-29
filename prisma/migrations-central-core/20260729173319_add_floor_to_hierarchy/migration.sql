/*
  Warnings:

  - You are about to drop the column `buildingId` on the `Flat` table. All the data in the column will be lost.
  - You are about to drop the column `floor` on the `Flat` table. All the data in the column will be lost.
  - Added the required column `floorId` to the `Flat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Flat` DROP FOREIGN KEY `Flat_buildingId_fkey`;

-- DropIndex
DROP INDEX `Flat_buildingId_idx` ON `Flat`;

-- AlterTable
ALTER TABLE `Flat` DROP COLUMN `buildingId`,
    DROP COLUMN `floor`,
    ADD COLUMN `floorId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Floor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `buildingId` INTEGER NOT NULL,
    `floorNumber` INTEGER NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Floor_uuid_key`(`uuid`),
    INDEX `Floor_buildingId_idx`(`buildingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Flat_floorId_idx` ON `Flat`(`floorId`);

-- AddForeignKey
ALTER TABLE `Floor` ADD CONSTRAINT `Floor_buildingId_fkey` FOREIGN KEY (`buildingId`) REFERENCES `Building`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Flat` ADD CONSTRAINT `Flat_floorId_fkey` FOREIGN KEY (`floorId`) REFERENCES `Floor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
