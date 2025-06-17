-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SnapPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "rotation" TEXT,
    "componentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SnapPoint_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SnapPoint" ("componentId", "createdAt", "id", "name", "position", "rotation", "type", "updatedAt") SELECT "componentId", "createdAt", "id", "name", "position", "rotation", "type", "updatedAt" FROM "SnapPoint";
DROP TABLE "SnapPoint";
ALTER TABLE "new_SnapPoint" RENAME TO "SnapPoint";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
