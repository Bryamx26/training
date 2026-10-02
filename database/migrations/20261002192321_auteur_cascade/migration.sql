-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_circuits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "note" REAL,
    "niveau" TEXT,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteurId" INTEGER NOT NULL,
    CONSTRAINT "circuits_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "profils" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_circuits" ("auteurId", "createdAt", "date", "id", "niveau", "note", "type") SELECT "auteurId", "createdAt", "date", "id", "niveau", "note", "type" FROM "circuits";
DROP TABLE "circuits";
ALTER TABLE "new_circuits" RENAME TO "circuits";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
