-- CreateTable
CREATE TABLE `WasteCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `WasteCategory_uuid_key`(`uuid`),
    UNIQUE INDEX `WasteCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WasteCollection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `collectorUserId` INTEGER NOT NULL,
    `residentUserId` INTEGER NOT NULL,
    `collectionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `wasteCategoryId` INTEGER NOT NULL,
    `weight` DOUBLE NOT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `isCollected` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `WasteCollection_uuid_key`(`uuid`),
    INDEX `WasteCollection_wasteCategoryId_idx`(`wasteCategoryId`),
    INDEX `WasteCollection_collectorUserId_idx`(`collectorUserId`),
    INDEX `WasteCollection_residentUserId_idx`(`residentUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WasteCollection` ADD CONSTRAINT `WasteCollection_wasteCategoryId_fkey` FOREIGN KEY (`wasteCategoryId`) REFERENCES `WasteCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
