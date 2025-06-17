/*
  Warnings:

  - Made the column `type` on table `Component` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_BundleToComponent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BundleToComponent_A_fkey" FOREIGN KEY ("A") REFERENCES "Bundle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BundleToComponent_B_fkey" FOREIGN KEY ("B") REFERENCES "Component" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Component" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "model3dUrl" TEXT,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Component" ("createdAt", "description", "id", "imageUrl", "metadata", "model3dUrl", "name", "type", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "metadata", "model3dUrl", "name", "type", "updatedAt" FROM "Component";
DROP TABLE "Component";
ALTER TABLE "new_Component" RENAME TO "Component";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_BundleToComponent_AB_unique" ON "_BundleToComponent"("A", "B");

-- CreateIndex
CREATE INDEX "_BundleToComponent_B_index" ON "_BundleToComponent"("B");
