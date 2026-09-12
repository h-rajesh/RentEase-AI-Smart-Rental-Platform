-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ANALYZING', 'PENDING_REVIEW', 'PUBLISHED', 'RENTED', 'UNAVAILABLE', 'REJECTED');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "latitute" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "rent" DECIMAL(12,2) NOT NULL,
    "area" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "furnishing" TEXT NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_locality_idx" ON "Property"("locality");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
