/*
  Warnings:

  - Added the required column `full_name` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `short_name` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `full_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `short_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'GOVERNMENT';
