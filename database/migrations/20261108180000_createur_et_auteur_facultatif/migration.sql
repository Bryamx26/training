-- Compte créé par un coach (creeParId) et séances conservées à la suppression de leur auteur (auteurId facultatif, SET NULL).
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
    "auteurId" INTEGER,
    CONSTRAINT "circuits_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "profils" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_circuits" ("auteurId", "createdAt", "date", "id", "niveau", "nom", "note", "type") SELECT "auteurId", "createdAt", "date", "id", "niveau", "nom", "note", "type" FROM "circuits";
DROP TABLE "circuits";
ALTER TABLE "new_circuits" RENAME TO "circuits";
CREATE TABLE "new_profils" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "poids" REAL,
    "taille" REAL,
    "age" INTEGER,
    "blessures" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "demandeCoach" BOOLEAN NOT NULL DEFAULT false,
    "cguAccepteesLe" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creeParId" INTEGER,
    CONSTRAINT "profils_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "profils" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_profils" ("age", "blessures", "cguAccepteesLe", "createdAt", "demandeCoach", "id", "mail", "motDePasse", "nom", "poids", "prenom", "role", "taille", "updatedAt") SELECT "age", "blessures", "cguAccepteesLe", "createdAt", "demandeCoach", "id", "mail", "motDePasse", "nom", "poids", "prenom", "role", "taille", "updatedAt" FROM "profils";
DROP TABLE "profils";
ALTER TABLE "new_profils" RENAME TO "profils";
CREATE UNIQUE INDEX "profils_mail_key" ON "profils"("mail");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

