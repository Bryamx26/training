-- CreateTable
CREATE TABLE "exercice_notes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "note" REAL,
    "commentaire" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "exerciceId" INTEGER NOT NULL,
    "profilId" INTEGER NOT NULL,
    CONSTRAINT "exercice_notes_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "exercices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "exercice_notes_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill: the old single note/commentaire applied to every participant of the
-- exercice's circuit, so carry it over to each of them individually.
INSERT INTO "exercice_notes" ("note", "commentaire", "updatedAt", "exerciceId", "profilId")
SELECT e."note", e."commentaire", CURRENT_TIMESTAMP, e."id", cp."profilId"
FROM "exercices" e
JOIN "circuit_participants" cp ON cp."circuitId" = e."circuitId"
WHERE e."note" IS NOT NULL OR e."commentaire" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_exercices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exercice" TEXT NOT NULL,
    "description" TEXT,
    "consignes" TEXT,
    "objectif" TEXT,
    "series" INTEGER,
    "nbRep" INTEGER,
    "duree" INTEGER,
    "tempsDeRepos" INTEGER,
    "tempo" TEXT,
    "lest" REAL,
    "amplitude" TEXT,
    "url" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "circuitId" INTEGER NOT NULL,
    CONSTRAINT "exercices_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "circuits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_exercices" ("amplitude", "circuitId", "consignes", "description", "duree", "exercice", "id", "lest", "nbRep", "objectif", "ordre", "series", "tempo", "tempsDeRepos", "url") SELECT "amplitude", "circuitId", "consignes", "description", "duree", "exercice", "id", "lest", "nbRep", "objectif", "ordre", "series", "tempo", "tempsDeRepos", "url" FROM "exercices";
DROP TABLE "exercices";
ALTER TABLE "new_exercices" RENAME TO "exercices";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "exercice_notes_exerciceId_profilId_key" ON "exercice_notes"("exerciceId", "profilId");
