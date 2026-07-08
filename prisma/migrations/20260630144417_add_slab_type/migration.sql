-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RatingSlab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "minYield" REAL NOT NULL,
    "maxYield" REAL,
    "color" TEXT NOT NULL DEFAULT '#22c55e',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'yieldRate',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_RatingSlab" ("color", "createdAt", "id", "label", "maxYield", "minYield", "sortOrder", "updatedAt") SELECT "color", "createdAt", "id", "label", "maxYield", "minYield", "sortOrder", "updatedAt" FROM "RatingSlab";
DROP TABLE "RatingSlab";
ALTER TABLE "new_RatingSlab" RENAME TO "RatingSlab";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
