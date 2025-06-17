/*
  Warnings:

  - You are about to drop the `_BundleToComponent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `category` on the `Inspiration` table. All the data in the column will be lost.
  - You are about to drop the column `displaySize` on the `Inspiration` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Inspiration` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Inspiration` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Inspiration` table. All the data in the column will be lost.
  - You are about to alter the column `position` on the `SnapPoint` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Added the required column `components` to the `Bundle` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Bundle` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `name` to the `Inspiration` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Inspiration` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `Inspiration` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Preset` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `SnapPoint` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `SnapPoint` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "_BundleToComponent_B_index";

-- DropIndex
DROP INDEX "_BundleToComponent_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_BundleToComponent";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "components" JSONB NOT NULL,
    "price" REAL NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Bundle" ("createdAt", "description", "id", "name", "price", "updatedAt") SELECT "createdAt", "description", "id", "name", "price", "updatedAt" FROM "Bundle";
DROP TABLE "Bundle";
ALTER TABLE "new_Bundle" RENAME TO "Bundle";
CREATE TABLE "new_Component" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "model3dUrl" TEXT,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Component" ("createdAt", "description", "id", "imageUrl", "metadata", "model3dUrl", "name", "type", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "metadata", "model3dUrl", "name", "type", "updatedAt" FROM "Component";
DROP TABLE "Component";
ALTER TABLE "new_Component" RENAME TO "Component";
CREATE TABLE "new_Inspiration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "components" JSONB,
    "tags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Inspiration" ("createdAt", "description", "id", "image", "tags", "updatedAt") SELECT "createdAt", "description", "id", "image", "tags", "updatedAt" FROM "Inspiration";
DROP TABLE "Inspiration";
ALTER TABLE "new_Inspiration" RENAME TO "Inspiration";
CREATE TABLE "new_Preset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "components" JSONB NOT NULL,
    "preview" TEXT,
    "category" TEXT,
    "tags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Preset" ("components", "createdAt", "description", "id", "name", "updatedAt") SELECT "components", "createdAt", "description", "id", "name", "updatedAt" FROM "Preset";
DROP TABLE "Preset";
ALTER TABLE "new_Preset" RENAME TO "Preset";
CREATE TABLE "new_SnapPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" JSONB NOT NULL,
    "rotation" JSONB,
    "componentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SnapPoint_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SnapPoint" ("componentId", "createdAt", "id", "name", "position", "type", "updatedAt") SELECT "componentId", "createdAt", "id", "name", "position", "type", "updatedAt" FROM "SnapPoint";
DROP TABLE "SnapPoint";
ALTER TABLE "new_SnapPoint" RENAME TO "SnapPoint";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
