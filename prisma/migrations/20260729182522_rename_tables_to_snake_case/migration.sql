/*
  Warnings:

  - You are about to drop the `WasteCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WasteCollection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `WasteCollection` DROP FOREIGN KEY `WasteCollection_wasteCategoryId_fkey`;

-- DropTable
DROP TABLE `WasteCategory`;

-- DropTable
DROP TABLE `WasteCollection`;

-- CreateTable
CREATE TABLE `waste_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,

    UNIQUE INDEX `waste_categories_uuid_key`(`uuid`),
    UNIQUE INDEX `waste_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `waste_collections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `collector_user_id` INTEGER NOT NULL,
    `resident_user_id` INTEGER NOT NULL,
    `collection_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `waste_category_id` INTEGER NOT NULL,
    `weight` DOUBLE NOT NULL,
    `photo_url` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `is_collected` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,

    UNIQUE INDEX `waste_collections_uuid_key`(`uuid`),
    INDEX `waste_collections_waste_category_id_idx`(`waste_category_id`),
    INDEX `waste_collections_collector_user_id_idx`(`collector_user_id`),
    INDEX `waste_collections_resident_user_id_idx`(`resident_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `waste_collections` ADD CONSTRAINT `waste_collections_waste_category_id_fkey` FOREIGN KEY (`waste_category_id`) REFERENCES `waste_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
