-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_realisations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "commentaire" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "circuitId" INTEGER NOT NULL,
    "profilId" INTEGER NOT NULL,
    CONSTRAINT "realisations_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "circuits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "realisations_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_realisations" ("circuitId", "commentaire", "createdAt", "id", "profilId", "updatedAt") SELECT "circuitId", "commentaire", "createdAt", "id", "profilId", "updatedAt" FROM "realisations";
DROP TABLE "realisations";
ALTER TABLE "new_realisations" RENAME TO "realisations";
CREATE INDEX "realisations_profilId_idx" ON "realisations"("profilId");
CREATE UNIQUE INDEX "realisations_circuitId_profilId_key" ON "realisations"("circuitId", "profilId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

