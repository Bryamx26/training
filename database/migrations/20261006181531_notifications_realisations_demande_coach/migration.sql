-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profilId" INTEGER NOT NULL,
    CONSTRAINT "notifications_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "realisations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rpe" INTEGER,
    "commentaire" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "circuitId" INTEGER NOT NULL,
    "profilId" INTEGER NOT NULL,
    CONSTRAINT "realisations_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "circuits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "realisations_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "series_realisees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serie" INTEGER NOT NULL,
    "reps" INTEGER,
    "lest" REAL,
    "duree" INTEGER,
    "realisationId" INTEGER NOT NULL,
    "exerciceId" INTEGER NOT NULL,
    CONSTRAINT "series_realisees_realisationId_fkey" FOREIGN KEY ("realisationId") REFERENCES "realisations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "series_realisees_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "exercices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_profils" ("age", "blessures", "createdAt", "id", "mail", "motDePasse", "nom", "poids", "prenom", "role", "taille", "updatedAt") SELECT "age", "blessures", "createdAt", "id", "mail", "motDePasse", "nom", "poids", "prenom", "role", "taille", "updatedAt" FROM "profils";
DROP TABLE "profils";
ALTER TABLE "new_profils" RENAME TO "profils";
CREATE UNIQUE INDEX "profils_mail_key" ON "profils"("mail");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "notifications_profilId_lu_idx" ON "notifications"("profilId", "lu");

-- CreateIndex
CREATE INDEX "realisations_profilId_idx" ON "realisations"("profilId");

-- CreateIndex
CREATE UNIQUE INDEX "realisations_circuitId_profilId_key" ON "realisations"("circuitId", "profilId");

-- CreateIndex
CREATE INDEX "series_realisees_exerciceId_idx" ON "series_realisees"("exerciceId");
