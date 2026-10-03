# Prompt Claude Code — remplacer le design par défaut par « Relief »

> Colle ce fichier à la racine du repo (ex. `DESIGN-relief.md`), puis lance dans le terminal :
> `claude "Lis DESIGN-relief.md. Le design Tracé est déjà implémenté avec un sélecteur dans le Profil : ne le modifie pas. Remplace le design par défaut (Classique) par le design Relief décrit dans ce fichier. Commence par analyser comment Tracé et le sélecteur sont branchés, puis les tokens Relief, puis les composants, écran par écran. Ne touche pas à la logique métier ni aux appels API."`

## Contexte

Sport Track a aujourd'hui deux designs, choisis dans le Profil (section « Apparence ») :

- **Classique** : le neumorphisme d'origine, par défaut ;
- **Tracé** : le design « logistics tech », déjà implémenté. Il utilise `data-design="trace"` sur `<html>`, un `DesignProvider` / `useDesign()`, des styles sous `src/styles/trace/` scopés par `[data-design="trace"]`, et des variantes sous `src/components/trace/`.

**Objectif :** remplacer **Classique** par **Relief**, un neumorphisme retravaillé (plus lisible, reliefs normalisés, champs creusés). Relief devient le design par défaut. Tracé reste une option et ne bouge pas.

**Avant de coder**
1. Lis comment `DesignProvider`, `useDesign()`, le sélecteur du Profil et les styles Tracé sont branchés. Réutilise exactement ce mécanisme.
2. Liste les fichiers CSS et composants qui portent le style Classique actuel.
3. Présente ce plan court, puis exécute-le.

**Règles impératives**
- **Zéro régression sur Tracé.** Ne modifie aucun fichier sous `src/styles/trace/` ni `src/components/trace/`. Avec `data-design="trace"`, chaque écran doit rester identique.
- Le type du design devient `"relief" | "trace"`. La valeur par défaut est `"relief"`.
- **Migration** : si `localStorage["sporttrack.design"]` vaut `"classic"` (ou une valeur inconnue), remplace-la par `"relief"`. Mets aussi à jour le script inline anti-flash de `index.html`.
- Le sélecteur du Profil affiche **Relief** et **Tracé**. La vignette Relief : fond `#e6ebf1`, une pastille en relief et un petit point vert `#16a34a`.
- Styles Relief dans `src/styles/relief/*.css`, avec tous les sélecteurs préfixés par `[data-design="relief"]`. Les styles Classique deviennent inutiles : supprime-les une fois Relief en place, ou isole-les si d'autres parties en dépendent (signale-le).
- Composants dont la structure change par rapport au Classique : variante dans `src/components/relief/`, choisie via `useDesign()`, comme pour Tracé.
- Mêmes routes, hooks, appels API, formulaires et données.
- Thème clair/sombre : garde le mécanisme existant (`data-theme`). Relief n'est livré qu'en clair pour l'instant. En `data-theme="dark"` avec Relief, applique les tokens sombres du §1 ; ils restent provisoires.
- Aucun emoji, aucun dégradé (sauf la zone remplie sous la courbe, à 12 % d'opacité).

---

## 1. Tokens Relief (`src/styles/relief/tokens.css`)

```css
[data-design="relief"] {
  --surface: #e6ebf1;          /* fond de page ET de tous les éléments en relief */
  --ink: #1b2230;              /* texte principal (13:1) */
  --ink-muted: #525c6c;        /* libellés, méta, onglets inactifs (5.6:1) */
  --action: #161b26;           /* boutons principaux, avatars, bouton + */
  --on-action: #ffffff;
  --progress: #16a34a;         /* anneaux, barres, curseur, icône d'onglet actif */
  --progress-ink: #13703a;     /* vert en texte : notes, %, tendance (5.1:1) */
  --progress-track: #d3dae4;   /* piste des anneaux */
  --info: #1d4ed8;             /* « À venir », liens, icône utilisateurs (5.6:1) */
  --danger: #b42318;           /* supprimer, déconnexion (5.5:1) */
  --chart-grid: #cfd6e0;

  --shadow-dark: #a3b1c6b3;
  --shadow-light: #ffffff;
  --e1: 3px 3px 8px var(--shadow-dark), -3px -3px 8px var(--shadow-light);
  --e2: 6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light);
  --e3: 10px 10px 24px var(--shadow-dark), -10px -10px 24px var(--shadow-light);
  --inset: inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light);
  --pressed: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);
  --card-edge: 1px solid #ffffff99;   /* liseré des cartes e3 */

  --r-field: 16px; --r-tile: 22px; --r-card: 28px; --r-nav: 26px; --r-pill: 9999px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 20px; --space-6: 24px;

  --font: "Manrope", system-ui, sans-serif;
  --focus: 2px solid var(--info);    /* outline, offset 3px */
}
[data-design="relief"][data-theme="dark"] {   /* provisoire */
  --surface: #232831; --ink: #eef1f6; --ink-muted: #a3acba;
  --action: #eef1f6; --on-action: #161b26;
  --progress-ink: #4ade80; --progress-track: #2f3540;
  --info: #93b4ff; --danger: #ff8a7a; --chart-grid: #39404c;
  --shadow-dark: #16191fcc; --shadow-light: #2f3540;
  --card-edge: 1px solid #ffffff0d;
}
```

Police : Google Fonts `Manrope:wght@400;500;600;700;800`, chargée quand Relief est actif. Chiffres en `font-variant-numeric: tabular-nums`.

**Règles d'usage**
- Lumière toujours en haut à gauche. Tout élément en relief a `background: var(--surface)`, sauf les éléments `--action`.
- Pas plus de deux niveaux de relief imbriqués (ex. carte e3 › tuile e1, ou carte e3 › champ inset).
- Le vert est réservé à la progression et aux notes. Les actions principales sont en `--action`.
- Focus clavier : `outline: var(--focus); outline-offset: 3px` sur tout élément interactif.
- Cibles tactiles ≥ 44px.

## 2. Typographie Relief

| rôle | taille / interligne | graisse | usage |
|---|---|---|---|
| display | 36/40 (login), 32/36 ailleurs, letter-spacing -0.03em | 800 | Titres de page, nom du coach |
| title | 24–26/30–32, -0.02em | 800 | Titre d'une séance |
| heading | 17–20/24 | 700–800 | Titres de carte, nom d'exercice |
| body | 15/22 | 400–600 | Texte courant |
| small | 12–13/18 | 500–600 | Méta (date, participants, « 1 exercice ») en `--ink-muted` |
| label | 11/16, letter-spacing 0.08em, MAJUSCULES | 700 | E-MAIL, TOTAL, MOYENNE, SPORTIFS RÉCENTS — `--ink-muted` |
| metric | 36–44/40–48, tabular-nums | 800 | KPI, moyennes |
| metric-sm | 24–30/30–34 | 800 | Total / Moyenne près de l'anneau |

## 3. Composants Relief

### AppShell
- Fond `--surface`, contenu `padding: 28px 20px 16px` (24px en haut sur les écrans de détail), `gap: 18–22px`.

### TabBar (flottante)
- Conteneur `padding: 0 16px 20px`. Barre en relief `--e2`, `border-radius: var(--r-nav)`, `padding: 8px`, grille de 4.
- Item : colonne, icône 18px + label 11px, `min-height: 52px`, `gap: 3px`, couleur `--ink-muted` 600.
- **Actif** : `box-shadow: var(--pressed)`, radius 18px, label `--ink` 800, icône `--progress`. `aria-current="page"`.

### Button
- Pilule, hauteur 52px (54px pour « Lancer la séance »), 15px/700.
- `primary` : fond `--action`, texte `--on-action`, `--e2`. Icône optionnelle (▶ plein, →, +).
- `soft` : fond `--surface`, texte `--ink`, `--e2`, icône colorée (+ en `--progress`, ajout de sportif en `--info`).
- État pressé (`:active`) : `--pressed`, texte `--ink-muted`.
- `danger-soft` (Déconnexion) : fond `--surface`, `--e1`, texte et icône `--danger`.
- Désactivé (Google non configuré) : `--e1`, texte `--ink-muted`.
- Petit `primary` « Enregistrer » : 44px, `padding: 0 22px`, aligné à droite.

### IconButton
- Rond 44×44, fond `--surface`, `--e1`, icône 18px `--ink`. Variante `danger` : icône `--danger`.
- Bouton + de la liste Séances : rond 48×48 `--action`, `--e2`.
- Toujours un `aria-label`.

### Field
- Label en style label au-dessus (`gap: 8px`).
- Input **creusé** : hauteur 48–50px, `border: 0`, `border-radius: var(--r-field)`, fond `--surface`, `box-shadow: var(--inset)`, `padding: 0 16–18px`, 15px, valeur 600.
- Focus : `outline: var(--focus); outline-offset: 3px`.
- Textarea (commentaire) : idem, 2 lignes, sans resize.
- Les formulaires Connexion et Inscription sont regroupés dans une carte e3 (radius `--r-card`, padding 22–24px).

### SearchField
- Pilule creusée 50px (`--inset`), loupe 18px `--ink-muted`, input transparent sans bordure.

### SegmentedControl (Sportif/Coach, Lea/bryam, Semaine/Mois/Année, filtres Toutes/À venir/Terminées)
- Piste : `box-shadow: var(--inset)`, pilule, `padding: 5–6px`, grille égale, `gap: 4–6px`.
- Option active : fond `--surface`, `--e1`, pilule, texte `--ink` 800.
- Options inactives : fond transparent, texte `--ink-muted` 600.
- Hauteur des options : 36–44px. Sémantique `radiogroup` / `radio`.
- Variante sportifs : chaque option contient un avatar de 28px (actif `--action`, inactif `--ink-muted`) + le prénom.

### Tag (FORCE, FACILE…)
- Pilule en relief `--e1`, style label couleur `--ink`, `padding: 5–7px 12–14px`.

### StatusPill
- Pilule **creusée** (`--pressed`), 12px/700, `padding: 4–6px 12–14px`. « À venir » en `--info`, « Terminée » en `--progress-ink`.

### Avatar
- Rond, fond `--action`, initiales blanches 800 (40px en liste, 44 en stats, 52 en en-tête d'accueil).
- Profil : avatar de 60px posé dans un socle rond en relief e2 de 76px.

### Card
- Carte : fond `--surface`, `--e3`, `border: var(--card-edge)`, radius `--r-card`, padding 18–22px.
- Tuile : `--e2`, radius `--r-tile`, padding 18px.
- Ligne de liste (sportif, menu) : **pilule** en relief `--e2`, `padding: 8px 18–20px 8px 8–10px`.

### ScoreRing (remplace l'anneau actuel)
- Disque en relief `--e2`, rond, 112–140px.
- SVG superposé, tourné de -90° : piste `--progress-track` puis progression `--progress`, `stroke-width` ≈ 8 % du diamètre, `stroke-linecap: round`, `stroke-dasharray` = pourcentage × circonférence.
- Au centre, un disque **creusé** (`--inset`) d'environ 56 % du diamètre, avec le % en 18–24px/800 et « score » ou « moyenne » en 10–11px `--ink-muted`.
- À droite, dans la carte : TOTAL et MOYENNE (label + metric-sm).

### ProgressBar
- Piste creusée (`--pressed`), pilule, hauteur 8–10px, `padding: 2px`. Remplissage `--progress`, pilule.
- Libellé au-dessus : nom 13px à gauche, valeur tabulaire 700 à droite (« 9.5/10 »).

### RatingSlider (note coach)
- En-tête : label « NOTE » + valeur 24px/800 `--progress-ink` (« 9/10 »).
- Piste creusée de 14px (`--inset`), remplissage `--progress` inset de 3px, bouton rond de 28px (fond `--surface`, `--e1`, bordure 4px `--progress`).
- **Garde un vrai `<input type="range" min="0" max="10">` accessible**, stylé ou superposé de façon invisible, pour le clavier et les lecteurs d'écran.

### KpiTile (accueil, stats sportif)
- Tuile e2 : label + metric + sous-texte 12px ou ProgressBar.
- « À venir » en `--info` ; « Progression moy. » et « Objectifs atteints » en `--progress-ink`, avec ProgressBar. Le « /2 » est en 20px `--ink-muted`.

### SessionCard
- Tuile e2, radius `--r-tile`, padding 18px, `gap: 10px`, entièrement cliquable :
  - ligne 1 : nom 18px/700 + Tag ;
  - ligne 2 : icône calendrier 15px + date ;
  - ligne 3 (liste Séances) : icône utilisateurs + participants ;
  - ligne 4 : « N exercice(s) » + StatusPill.

### ExerciseCard
- Carte e3 :
  - en-tête : numéro dans un rond creusé de 32–34px (`--pressed`), nom 17–18px, à droite ★ + note en `--progress-ink` (vue sportif) ou « 3 × 6 · objectif 30 » en `--ink-muted` (vue coach) ;
  - « **Objectif :** 30 » ;
  - consignes dans un bloc creusé (`--pressed`), radius 14–16px, `padding: 10–12px 14–16px` ;
  - vue sportif : 4 mini-tuiles e1 (radius 16px) avec la valeur 17px/800 et le libellé 11px : séries · reps · tempo · repos ;
  - vue coach : RatingSlider, commentaire, bouton « Enregistrer ».

### ListRow (sportifs)
- Pilule e2 : avatar, nom 15px/700 + sous-ligne 12px (« 2 séances notées »), sparkline, moyenne 20px/800 alignée à droite.
- Sparkline : SVG de 56×20, ligne `--progress` de 2.5px, bouts arrondis, point final plein de 3.5px. Un seul point s'il n'y a qu'une séance.

### MenuRow (Profil)
- Pilule e2, `min-height: 60px` : icône dans un rond creusé de 40px (utilisateurs en `--info`, + en `--progress-ink`), libellé 15px/700, chevron `--ink-muted`.

### TrendBadge
- Pilule creusée (`--pressed`), icône tendance 14px + « +6,4% » en `--progress-ink` 800.

### LineChart (courbe de progression)
- Dans une carte e3 : titre 20px/800, SegmentedControl Semaine/Mois/Année, puis navigation de période (IconButtons ‹ › et « Octobre 2026 » en gras).
- Zone du graphique dans un bloc creusé (`--pressed`), radius 20px, `padding: 12px 8px 8px`.
- Grille horizontale en pointillés (`--chart-grid`, `3 4`), axe Y de 0 à 10 par pas de 2, axe X « Sem 1…5 », libellés 11px `--ink-muted`.
- Série : ligne `--progress` de 3px, bouts arrondis, zone remplie dessous à 12 % d'opacité. Points : cercle de 5px (fond `--surface`, bord `--progress` de 3px) ; le dernier point est plein (6px, bord blanc de 2.5px) avec sa valeur en 12px/800 `--progress-ink`.
- `role="img"` et un `aria-label` qui résume les valeurs.

### Logo (Connexion)
- Carré arrondi en relief e3 de 96px (radius 30px), contenant un rond creusé de 60px avec l'icône haltère en `--progress` (28px, trait de 2.5).

### Separator « OU »
- Deux pistes creusées (`--pressed`) de 4px de haut, pilule, avec « OU » en style label entre les deux.

### Icônes
- Style Lucide, `stroke-width: 2`, bouts et angles arrondis, `currentColor`, 18px par défaut.

## 4. Écrans en mode Relief

1. **Connexion** — Logo centré, « Sport Track » 36px/800, sous-titre ; carte e3 avec E-mail, Mot de passe et « Se connecter → » (primary) ; séparateur « OU » ; bouton désactivé « Connexion Google non configurée » ; en bas « Pas encore de compte ? **Créer un compte** ».
2. **Inscription** — IconButton retour ; titre « Créer un compte » + sous-titre ; carte e3 avec Prénom/Nom en grille de 2, E-mail, Mot de passe, « JE SUIS… » (SegmentedControl Sportif/Coach) et « Créer mon compte » (primary) ; lien « Se connecter ».
3. **Accueil coach** — label « TABLEAU DE BORD » + « Coach Martin » 32px, avatar de 52px à droite ; 4 KpiTile (Sportifs, Séances créées, À venir en info, Progression moy. en vert + barre) ; « + Créer une séance » (primary) et « Ajouter un sportif » (soft) côte à côte ; « SPORTIFS RÉCENTS / Voir tout › » + ListRows ; « SÉANCES À VENIR » + SessionCard.
4. **Séances** — titre + bouton + rond ; SearchField ; SegmentedControl Toutes/À venir/Terminées ; liste de SessionCard.
5. **Détail séance (sportif)** — IconButton retour + titre ; Tags + date ; participants ; « ▶ Lancer la séance » (primary) ; carte avec ScoreRing + Total/Moyenne ; ExerciseCard.
6. **Détail séance (coach)** — comme 5, avec en plus Modifier et Supprimer (danger) en IconButtons ; SegmentedControl des sportifs ; ScoreRing du sportif sélectionné ; ExerciseCard en mode notation.
7. **Statistiques coach** — titre ; carte « PROGRESSION MOYENNE / Groupe entier » + TrendBadge, ScoreRing 98 % « moyenne » + une ProgressBar par sportif ; « PAR SPORTIF » + ListRows avec sparkline.
8. **Statistiques sportif** — titre ; carte LineChart ; 2 KpiTile (Moyenne générale 9.5 « sur 2 séances », Objectifs atteints 2/2 + barre).
9. **Profil** — titre + IconButton lune ; carte identité (avatar sur socle, nom 22px/800, e-mail, rôle en pilule creusée « ENTRAÎNEUR ») ; section **Apparence** avec le sélecteur **Relief / Tracé** (rendu Relief : piste creusée + option en relief) ; MenuRows (Gérer les utilisateurs, Créer une séance) ; Déconnexion (danger-soft).

## 5. Critères d'acceptation

- localStorage vide → l'app s'ouvre en **Relief**. Une valeur `"classic"` sauvegardée est migrée en `"relief"`.
- Le sélecteur du Profil propose **Relief** et **Tracé** uniquement. Le changement est instantané, persiste au rechargement et ne provoque pas de flash.
- **Tracé est inchangé** : aucun diff sous `src/styles/trace/` ni `src/components/trace/`, et les écrans en Tracé sont identiques à avant (vérification par captures avant/après).
- Tous les sélecteurs de `src/styles/relief/` sont préfixés par `[data-design="relief"]` (vérifiable par grep).
- Relief : texte ≥ 4.5:1 sur `--surface`, focus visible partout, cibles ≥ 44px, un vrai `<input type="range">` pour la note.
- Aucune régression fonctionnelle : mêmes routes, mêmes appels API, mêmes formulaires dans les deux designs.
- Une fois Relief validé, aucun reste du style Classique n'est encore appliqué.
