-- CreateTable
CREATE TABLE "coach_subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "coachId" INTEGER NOT NULL,
    "athleteId" INTEGER NOT NULL,
    CONSTRAINT "coach_subscriptions_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "profils" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "coach_subscriptions_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "profils" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "coach_subscriptions_athleteId_idx" ON "coach_subscriptions"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "coach_subscriptions_coachId_athleteId_key" ON "coach_subscriptions"("coachId", "athleteId");


-- Reprise de l'existant : chaque sportif ayant déjà participé à une séance
-- d'un coach devient son abonné actif, pour que les coachs gardent l'accès
-- aux sportifs qu'ils suivaient avant l'introduction des abonnements.
-- (Prisma stocke les dates SQLite en millisecondes depuis l'epoch.)
INSERT INTO "coach_subscriptions" ("status", "createdAt", "updatedAt", "coachId", "athleteId")
SELECT DISTINCT
    'ACTIVE',
    CAST(strftime('%s', 'now') AS INTEGER) * 1000,
    CAST(strftime('%s', 'now') AS INTEGER) * 1000,
    c."auteurId",
    p."profilId"
FROM "circuit_participants" p
JOIN "circuits" c ON c."id" = p."circuitId"
JOIN "profils" coach ON coach."id" = c."auteurId" AND coach."role" IN ('COACH', 'ADMIN')
JOIN "profils" athlete ON athlete."id" = p."profilId" AND athlete."role" = 'USER';
