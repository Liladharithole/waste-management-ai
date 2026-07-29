-- AlterTable
ALTER TABLE `WasteCategory` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `WasteCollection` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedBy` VARCHAR(191) NULL;
