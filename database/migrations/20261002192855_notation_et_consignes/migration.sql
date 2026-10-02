/*
  Warnings:

  - You are about to alter the column `note` on the `exercices` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.
  - Added the required column `nom` to the `circuits` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_circuits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
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
    "note" REAL,
    "commentaire" TEXT,
    "circuitId" INTEGER NOT NULL,
    CONSTRAINT "exercices_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "circuits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_exercices" ("amplitude", "circuitId", "exercice", "id", "lest", "nbRep", "note", "tempo", "tempsDeRepos", "url") SELECT "amplitude", "circuitId", "exercice", "id", "lest", "nbRep", "note", "tempo", "tempsDeRepos", "url" FROM "exercices";
DROP TABLE "exercices";
ALTER TABLE "new_exercices" RENAME TO "exercices";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
