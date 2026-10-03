-- AlterTable
ALTER TABLE `Flight` ADD COLUMN `duffelOfferId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Flight_duffelOfferId_key` ON `Flight`(`duffelOfferId`);

-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `duffelOrderId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Booking_duffelOrderId_key` ON `Booking`(`duffelOrderId`);

-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD';
