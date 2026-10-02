-- CreateTable
CREATE TABLE "profils" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "circuits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "note" REAL,
    "niveau" TEXT,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteurId" INTEGER NOT NULL,
    CONSTRAINT "circuits_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "profils" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "circuit_participants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "circuitId" INTEGER NOT NULL,
    "profilId" INTEGER NOT NULL,
    CONSTRAINT "circuit_participants_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "circuits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "circuit_participants_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exercices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exercice" TEXT NOT NULL,
    "nbRep" INTEGER,
    "tempsDeRepos" INTEGER,
    "tempo" TEXT,
    "lest" REAL,
    "amplitude" TEXT,
    "url" TEXT,
    "note" TEXT,
    "circuitId" INTEGER NOT NULL,
    CONSTRAINT "exercices_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "circuits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "muscles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "exercice_muscles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exerciceId" INTEGER NOT NULL,
    "muscleId" INTEGER NOT NULL,
    CONSTRAINT "exercice_muscles_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "exercices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "exercice_muscles_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "muscles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "profils_mail_key" ON "profils"("mail");

-- CreateIndex
CREATE UNIQUE INDEX "circuit_participants_circuitId_profilId_key" ON "circuit_participants"("circuitId", "profilId");

-- CreateIndex
CREATE UNIQUE INDEX "muscles_nom_key" ON "muscles"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "exercice_muscles_exerciceId_muscleId_key" ON "exercice_muscles"("exerciceId", "muscleId");
