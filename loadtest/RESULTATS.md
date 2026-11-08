# Test de charge de l'API — résultats

Trois tests identiques, lancés le 8 novembre 2026 avec les scripts de ce dossier, sur la même base de départ :

| Test | Code testé | Commit |
|---|---|---|
| **1** | Code de départ | `ecdd80e` |
| **2** | Hachage des mots de passe natif (`bcrypt` au lieu de `bcryptjs`) et SQLite en mode WAL | `b6f46c5` |
| **3** | En plus : pagination de `GET /api/circuits` et synthèse du tableau de bord (`GET /api/circuits/resume`) | `3b91f2c` |

## En bref

À **400 visiteurs simultanés** :

- le p95 en régime stable passe de **614 ms** (test 1) à **65 ms** (test 2), puis à **13 ms** (test 3) ;
- les vagues de connexions ne figent plus l'API : le pire p95 en montée passe de **9 582 ms** à **46 ms** ;
- plus aucune requête hors délai (8 au test 1) ;
- la mémoire maximale de l'API passe de **636 Mo** (test 2) à **366 Mo** (test 3).

Deux causes expliquaient presque tout :

1. **`bcryptjs` bloquait le fil principal de Node.** Chaque connexion coûtait environ 60 ms de calcul en JavaScript, pendant lesquelles aucune autre requête n'avançait. Une centaine de connexions en quelques secondes figeait toute l'API. `bcrypt` (natif) fait ce calcul dans des fils séparés.
2. **Le tableau de bord du coach chargeait toutes ses séances** (avec exercices, muscles et notes) à chaque visite, pour en tirer trois chiffres. Tant que cette requête lourde occupait le processus, les requêtes des sportifs attendaient derrière.

## Par palier

« Stable » exclut les 10 premières secondes de chaque palier, pendant lesquelles les nouveaux visiteurs se connectent. « Pire p95 en montée » est le p95 le plus élevé mesuré pendant ces 10 secondes.

| Visiteurs | p95 stable (1 → 2 → 3) | Pire p95 en montée (1 → 2 → 3) | Req/s stable (1 → 2 → 3) | CPU moyen (1 → 2 → 3) | Mémoire max (1 → 2 → 3) | Hors délai (1 → 2 → 3) |
|---|---|---|---|---|---|---|
| 10 | 10 ms → 9 ms → 9 ms | 75 ms → 64 ms → 61 ms | 18 → 18 → 18 | 8 % → 8 % → 8 % | 147 Mo → 148 Mo → 145 Mo | 0 → 0 → 0 |
| 50 | 16 ms → 10 ms → 9 ms | 61 ms → 44 ms → 43 ms | 83 → 85 → 86 | 44 % → 42 % → 38 % | 301 Mo → 337 Mo → 227 Mo | 0 → 0 → 0 |
| 100 | 42 ms → 14 ms → 9 ms | 185 ms → 44 ms → 43 ms | 160 → 169 → 170 | 90 % → 86 % → 69 % | 484 Mo → 439 Mo → 272 Mo | 0 → 0 → 0 |
| 200 | 49 ms → 27 ms → 9 ms | 3 752 ms → 46 ms → 44 ms | 318 → 336 → 337 | 172 % → 182 % → 135 % | 565 Mo → 566 Mo → 317 Mo | 0 → 0 → 0 |
| 400 | 614 ms → 65 ms → 13 ms | 9 582 ms → 76 ms → 46 ms | 597 → 640 → 656 | 293 % → 446 % → 304 % | 603 Mo → 636 Mo → 366 Mo | 8 → 0 → 0 |

Le CPU est en % d'un cœur (Node et le moteur de requêtes Prisma). Il est plus bas au test 1 qu'au test 2 parce que l'API passait son temps bloquée, pas parce qu'elle travaillait moins.

## Par route, à 400 visiteurs (p95)

« — » : route absente de ce test. Aux tests 1 et 2, le tableau de bord du coach appelait la liste complète (`GET /circuits (coach)`) ; au test 3, il appelle la synthèse, puis une page de 20 séances.

| Route | Test 1 | Test 2 | Test 3 |
|---|---|---|---|
| `PUT /exercices/:id/notes/:profilId` | 763 ms | 140 ms | 57 ms |
| `GET /circuits/resume` | — | — | 52 ms |
| `POST /auth/login` | 9 321 ms | 77 ms | 48 ms |
| `POST /circuits` | 1 104 ms | 109 ms | 47 ms |
| `PUT /circuits/:id/realisation` | 998 ms | 138 ms | 41 ms |
| `GET /circuits (sportif)` | 923 ms | 49 ms | 9 ms |
| `GET /circuits?limit=20 (coach)` | — | — | 8 ms |
| `GET /circuits/:id` | 620 ms | 44 ms | 8 ms |
| `GET /stats/exercices (coach)` | 177 ms | 51 ms | 8 ms |
| `GET /stats/exercices` | 178 ms | 40 ms | 7 ms |
| `GET /stats/muscles` | 163 ms | 42 ms | 7 ms |
| `GET /me/subscribers` | 4 185 ms | 39 ms | 5 ms |
| `GET /auth/me` | 3 771 ms | 37 ms | 3 ms |
| `GET /me/notifications` | 900 ms | 36 ms | 3 ms |
| `GET /circuits (coach)` | 1 130 ms | 323 ms | — |

Pour un coach de la base de test (700 séances), mesuré à part : la liste complète pèse 1,5 Mo (112 ms), la synthèse 5 Ko (26 ms) et une page de 20 séances 36 Ko (6 ms).

## Méthode

- **Paliers :** 10, 50, 100, 200 puis 400 visiteurs simultanés, 30 s chacun ; les nouveaux visiteurs arrivent sur 3 s.
- **Visiteurs :** pause de 300 à 900 ms entre deux actions, bien plus court qu'une vraie personne : un visiteur virtuel pèse autant que plusieurs dizaines d'utilisateurs réels.
- **Parcours sportif :** connexion, profil, liste de ses séances, notifications, séance du jour, enregistrement de la réalisation, statistiques.
- **Parcours coach** (1 visiteur sur 20) : abonnés, tableau de bord, création d'une séance, notation, statistiques d'un sportif.
- **Base de test :** 400 sportifs et 4 coachs fictifs, 2 800 séances (6 passées réalisées et notées, plus celle du jour, par sportif) ; SQLite ; la même copie de départ pour les trois tests.
- **Délai maximum :** 10 s par requête ; au-delà, la requête compte comme hors délai.
- **Volume :** 29 935 requêtes au test 1, 38 037 au test 2, 38 520 au test 3. Aucune erreur renvoyée par l'API ; les seules erreurs sont les 8 requêtes hors délai du test 1.
- **Machine :** 16 cœurs, API et générateur de charge sur la même machine.

**Hors périmètre :** le front (fichiers statiques), le réseau, le reverse proxy HTTPS. La limite de tentatives de connexion est relevée pour le test (tous les visiteurs viennent de la même adresse IP).

## Relancer le test

```bash
# 1. Base de test (fichier temporaire, jamais la base de dev)
cd api
DATABASE_URL="file:/tmp/loadtest.db" npx prisma migrate deploy --schema=../database/schema.prisma
DATABASE_URL="file:/tmp/loadtest.db" node ../loadtest/seed.cjs 400
cd ..

# 2. Test (lance l'API sur le port 4200, écrit results.json dans le dossier donné)
DATABASE_URL="file:/tmp/loadtest.db" node loadtest/run.mjs /tmp/loadtest-resultats
```

Variables utiles : `STAGES=10,50,100` (paliers), `STAGE_S=30` (durée d'un palier en secondes). Pour comparer deux versions du code, repartez à chaque fois d'une copie de la base fraîchement créée.

## Pour aller plus loin

À 400 visiteurs, l'API utilise encore environ 3 cœurs en moyenne. Si l'application grossit beaucoup :

1. lancer plusieurs processus Node sur la même machine (`node:cluster` ou PM2), compatible avec SQLite en mode WAL ;
2. passer à PostgreSQL avant de répartir l'API sur plusieurs machines ; il faudra alors aussi un stockage partagé (Redis) pour la limite de tentatives de connexion.
