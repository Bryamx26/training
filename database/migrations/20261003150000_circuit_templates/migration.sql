-- CreateTable
CREATE TABLE "circuit_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "niveau" TEXT,
    "type" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "coachId" INTEGER NOT NULL,
    CONSTRAINT "circuit_templates_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "profils" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "template_exercices" (
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
    "templateId" INTEGER NOT NULL,
    CONSTRAINT "template_exercices_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "circuit_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "circuit_templates_coachId_idx" ON "circuit_templates"("coachId");

