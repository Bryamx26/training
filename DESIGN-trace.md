# Prompt Claude Code — ajouter « Tracé » comme design optionnel avec un sélecteur

> Colle ce fichier à la racine du repo (ex. `DESIGN.md`), puis lance dans le terminal :
> `claude "Lis DESIGN.md. Ajoute le design Tracé comme deuxième design optionnel, avec un sélecteur dans le Profil. Le design actuel doit rester exactement identique et rester celui par défaut. Commence par l'infrastructure (contexte + attribut data-design), puis les tokens, puis les composants, écran par écran. Ne touche pas à la logique métier ni aux appels API."`

## Contexte

Sport Track est une app de suivi sportif (coach + sportifs). Son design actuel est en neumorphisme : ombres douces, coins très arrondis, anneaux verts. **On le garde tel quel** : c'est le design « Classique », par défaut.

On **ajoute** un second design, **Tracé**, que l'utilisateur peut choisir dans son Profil. Tracé a une identité « logistics tech » : aplats francs, grille 4px, angles nets, chiffres en mono, chevrons de progression.

**Règles impératives**
- **Zéro régression sur le design Classique.** Avec `data-design="classic"`, chaque écran doit être pixel-identique à aujourd'hui. Ne modifie pas les styles existants : ajoute à côté.
- Les deux designs partagent les mêmes routes, hooks, appels API, formulaires et données. Seul le rendu change.
- Le **design** (Classique / Tracé) et le **thème** (clair / sombre) sont deux réglages indépendants : 4 combinaisons possibles.
- Aucun emoji, aucun dégradé dans Tracé.

---

## 0. Sélecteur de design (à faire en premier)

### Infrastructure
- Crée un `DesignProvider` (React context) qui expose `design: "classic" | "trace"` et `setDesign()`.
- Valeur initiale lue depuis `localStorage["sporttrack.design"]` (protégé par try/catch). Par défaut : `"classic"`.
- À chaque changement : `document.documentElement.dataset.design = design`, puis sauvegarde dans localStorage.
- Hook `useDesign()` pour les composants.
- Pour éviter un flash au chargement, ajoute dans `index.html` un petit script inline qui pose `data-design` avant le rendu React.
- Si le thème clair/sombre existe déjà (bouton lune), garde son mécanisme. Tracé lit simplement `[data-theme="dark"]` en plus de `[data-design="trace"]`. S'il n'y a pas d'attribut `data-theme`, branche le bouton lune existant pour qu'il en pose un, sans changer le rendu Classique.

### Le contrôle dans le Profil
- Dans l'écran **Profil**, ajoute une section **« Apparence »** sous la carte d'identité, avant le menu, pour les deux rôles (coach et sportif).
- Elle contient un sélecteur à 2 options, **Classique** et **Tracé**, chacune avec une mini-vignette d'aperçu de 48×32 :
  - Classique : fond gris-bleu clair avec un petit rond vert ;
  - Tracé : fond `#f3f2ec` avec un carré `#d6ff3d` et un carré `#0d0f12`.
- Le contrôle est rendu **dans le style du design actif** : en Classique, une carte neumorphique avec deux boutons arrondis comme le toggle Sportif/Coach actuel ; en Tracé, le SegmentedControl Tracé (voir §3).
- Sémantique : `role="radiogroup"` avec deux `role="radio"` (`aria-checked`), libellé « Design de l'application ».
- Le changement s'applique immédiatement, sans rechargement.

### Organisation du code
- Styles Tracé dans des fichiers séparés, `src/styles/trace/*.css`, avec **tous** les sélecteurs préfixés par `[data-design="trace"]`. Ainsi, rien ne fuit sur le Classique.
- Pour les composants dont **seul le style** change (boutons, champs, cartes, tab bar, tags…) : ajoute des classNames stables (`st-button`, `st-card`, `st-field`…) au markup existant, et style-les uniquement sous `[data-design="trace"]`. Le CSS Classique existant reste intact.
- Pour les composants dont **la structure** change, branche sur `useDesign()` et rends le composant Tracé :
  - anneau de score → `ScorePanel` + `SegmentBar` ;
  - slider de note → `RatingPicker` ;
  - carte de séance → `SessionCard` avec `DateBlock` ;
  - écrans Connexion et Inscription → ajout du `HeroBand` ;
  - courbe de progression → `LineChart` Tracé.
- Range ces variantes dans `src/components/trace/` (ex. `trace/ScorePanel.tsx`). Le composant parent choisit : `design === "trace" ? <TraceScorePanel …/> : <ScoreRing …/>`.
- Polices Archivo et JetBrains Mono : charge-les seulement quand Tracé est actif (injecte le `<link>` Google Fonts depuis le provider), pour ne pas alourdir le Classique.

---

## 1. Tokens Tracé (à mettre dans `src/styles/trace/tokens.css`)

Tous les tokens sont scopés sous `[data-design="trace"]`. Ils ne s'appliquent donc pas au design Classique.

```css
[data-design="trace"] {
  --paper: #f3f2ec;        /* fond de page */
  --paper-raised: #ffffff; /* cartes, champs, tab bar */
  --line: #d9d7ce;         /* filets 1px, bordures au repos */
  --ink: #0d0f12;          /* texte principal, chiffres */
  --ink-muted: #5b5f66;    /* libellés, unités, métadonnées */
  --slab: #0d0f12;         /* grands aplats sombres (score, KPI vedette) */
  --on-slab: #f3f2ec;      /* texte sur slab */
  --on-slab-muted: #9da2aa;/* libellés sur slab */
  --slab-track: #30353f;   /* segments vides sur slab */
  --volt: #d6ff3d;         /* signature : action principale, onglet actif, progression */
  --on-volt: #0d0f12;
  --volt-ink: #4d6b00;     /* volt en version texte sur fond clair (note 9/10, succès) */
  --signal: #c2410c;       /* effort / alerte / suppression */
  --on-signal: #ffffff;
  --cobalt: #1f3bd6;       /* données, liens, statut « À venir », courbes */
  --cobalt-soft: #e3e7ff;  /* fond des pastilles cobalt */
  --focus-ring: 0 0 0 2px var(--paper), 0 0 0 4px #1f3bd6;

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px;
  --radius-none: 0; --radius-xs: 2px; --radius-sm: 4px; --radius-pill: 9999px;

  --font-sans: "Archivo", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
[data-design="trace"][data-theme="dark"] {
  --paper: #0d0f12; --paper-raised: #171a1f; --line: #2a2e35;
  --ink: #f3f2ec; --ink-muted: #9da2aa;
  --slab: #30353f; --on-slab: #f3f2ec; --slab-track: #4a505c;
  --volt-ink: #d6ff3d; --signal: #ff7a3d; --on-signal: #0d0f12;
  --cobalt: #8a9cff; --cobalt-soft: #1a2050;
  --focus-ring: 0 0 0 2px var(--paper), 0 0 0 4px #d6ff3d;
}
```

Polices (Google Fonts) : `Archivo:wght@400;500;600;700;800` et `JetBrains+Mono:wght@500;600`.

**Règles d'usage**
- Un seul aplat `--volt` d'action par écran (le CTA principal). L'onglet actif et les barres de progression peuvent aussi être volt.
- Jamais de texte volt sur fond clair → utiliser `--volt-ink`.
- Tout chiffre mesuré (score, reps, séries, durées, dates, compteurs, e-mail) en `--font-mono`.
- Focus clavier : `outline: none; box-shadow: var(--focus-ring);` sur tous les éléments interactifs.
- Cibles tactiles ≥ 44px.

## 2. Typographie Tracé (classes utilitaires, sous `[data-design="trace"]`)

| classe | police | taille / interligne | graisse | usage |
|---|---|---|---|---|
| `.t-display` | sans | 44/44, letter-spacing -0.03em | 800 | Titre « Sport Track » (login), nom du coach (accueil, 40px) |
| `.t-page` | sans | 32/36, -0.03em | 800 | Titres de page : Séances, Statistiques, Profil, Créer un compte |
| `.t-title` | sans | 28/32, -0.02em | 800 | Titre d'une séance |
| `.t-heading` | sans | 18/24 | 700 | Titres de carte (nom séance, exercice, « Courbe de progression ») |
| `.t-body` | sans | 15/22 | 400 | Texte courant |
| `.t-label` | sans | 11/16, letter-spacing 0.08em, MAJUSCULES | 600 | Libellés : E-MAIL, TOTAL, SPORTIFS RÉCENTS… couleur `--ink-muted` |
| `.t-metric` | mono | 40/44, -0.02em | 500–600 | Chiffre héros (KPI, moyenne) |
| `.t-metric-xl` | mono | 52/52, -0.03em | 600 | Score dans le ScorePanel (64px sur Stats coach) |
| `.t-metric-sm` | mono | 13–14/20 | 500 | Chiffres dans listes, méta |

## 3. Composants Tracé

Chaque spec ci-dessous décrit le rendu **quand `data-design="trace"`**. En Classique, le composant existant reste inchangé.

### AppShell (mobile)
- Colonne pleine hauteur, fond `--paper`, contenu `padding: 24px 20px`, `gap: 16–24px`, TabBar collée en bas.

### TabBar
- 4 onglets en grille égale : Accueil (maison), Séances (haltère), Stats (histogramme), Profil (personne).
- Fond `--paper-raised`, `border-top: 1px solid var(--line)`, `padding: 8px 8px 24px`.
- Item : colonne, icône 20px au-dessus d'un label 11px/600, `min-height: 52px`, couleur `--ink-muted`.
- **Actif** : label `--ink` 700, icône dans une tuile 44×28 `--volt` radius 4px, `aria-current="page"`.

### Button
- Hauteur 52px (56px pour « Lancer la séance »), radius 4px, police 16px/700, `padding: 0 20px`.
- `primary` : fond `--volt`, texte `--on-volt`. Contenu en `justify-content: space-between` : libellé à gauche, flèche → ou info mono à droite (ex. « 1 exercice »).
- `dark` : fond `--slab`, texte `--on-slab` (ex. « Enregistrer », 44px de haut).
- `outline` : fond transparent ou `--paper-raised`, `border: 1px solid var(--ink)` (ex. « Déconnexion », « Ajouter un sportif »).
- Icône optionnelle à gauche (16–18px).

### IconButton
- Carré 44×44, radius 4px, fond `--paper-raised`, `border: 1px solid var(--line)`, icône 18–20px.
- Variante `danger` : bordure et icône `--signal` (supprimer).
- Variante `primary` : 48×48 fond `--volt` (bouton + de Séances).
- Toujours un `aria-label`.

### Field (label + input)
- Label `.t-label` au-dessus, `gap: 8px`.
- Input : hauteur 48px, fond `--paper-raised`, `border: 1px solid var(--line)`, radius 4px, `padding: 0 14px`, 15px/500.
- Focus / rempli : `border-color: var(--ink)`.
- Prénom + Nom côte à côte en grille 2 colonnes, `gap: 12px`.
- Textarea (commentaire) : même style, 2 lignes, sans resize.

### SearchField
- Comme Field sans label visible, icône loupe 18px `--ink-muted` à gauche, placeholder « Rechercher une séance ou un exercice ».

### SegmentedControl
- Grille égale, `border: 1px solid var(--ink)`, radius 4px, `overflow: hidden`.
- Segment 40–46px de haut ; sélectionné = fond `--slab`, texte `--on-slab` 700 ; autres = fond `--paper-raised` 600.
- Usages : Sportif / Coach (inscription), Semaine / Mois / Année (stats).

### FilterChips
- Rangée de puces 13px/600, `padding: 6px 12px`, radius 4px. Active : fond `--slab`, texte `--on-slab`. Inactive : fond `--paper-raised` + bordure `--line`. (Toutes / À venir / Terminées)

### TypeTag (FORCE, FACILE, ENDURANCE, HYPERTROPHIE, FIGURE…)
- `.t-label` couleur `--ink`, `border: 1px solid var(--ink)`, `padding: 2px 6px`, radius 2px. Pas de fond.

### StatusPill (À venir, Terminée…)
- 12px/600, `padding: 2px 10px`, `radius-pill`. « À venir » : texte `--cobalt` sur `--cobalt-soft`.
- Seul composant arrondi en pilule.

### Avatar (initiales)
- Carré (40 en liste, 44 en stats, 72 profil), radius 4px, fond `--slab`, initiales mono 13px/600 `--on-slab`.
- Variante mise en avant (profil, sportif sélectionné) : fond `--volt`, texte `--on-volt`.

### Card
- Fond `--paper-raised`, `border: 1px solid var(--line)`, radius 4px, padding 16px. **Aucune ombre.**
- Sections internes séparées par `border-top/bottom: 1px solid var(--line)`.

### DateBlock
- Colonne 72px, fond `--slab`, centré : jour en mono 26px/600 `--on-slab` (« 10 », « 05 ») + mois en `.t-label` `--on-slab-muted` (« OCT »).

### SessionCard (liste Séances + « Séances à venir » de l'accueil)
- Card horizontale, `overflow: hidden`, cliquable (lien vers le détail).
- Gauche : DateBlock. Droite (padding 14px, gap 8px) :
  - ligne 1 : nom de séance `.t-heading` + TypeTag à droite ;
  - ligne 2 : icône utilisateurs 14px + noms des participants, 13px `--ink-muted` ;
  - ligne 3 : « N exercice(s) » mono 13px `--ink-muted` + StatusPill à droite.

### SegmentBar (progression segmentée)
- Grille de N segments égaux (`gap: 2–3px`), hauteur 6–8px, angles nets.
- Segment rempli `--volt`, vide `--slab-track`. N = 10 pour une note/10 (ex. 9 remplis pour 90 %), N = objectifs pour « 2/2 ».

### ScorePanel (détail séance)
- Fond `--slab`, radius 4px, padding 20px, `gap: 16px`.
- Haut : à gauche `.t-label` « SCORE » (ou « SCORE · Lea » en vue coach) en `--on-slab-muted` + pourcentage `.t-metric-xl` en `--volt` ; à droite 2 colonnes TOTAL (« 9/10 ») et MOYENNE (« 9.0 ») en mono 20px, alignées à droite.
- Bas : SegmentBar de 10.
- Remplace l'ancien anneau vert.

### KpiTile (accueil + stats sportif)
- Card padding 16px, `gap: 6–8px` : `.t-label` + `.t-metric` + sous-texte mono 12px optionnel (« sur 2 séances »).
- Grille 2×2, `gap: 12px`.
- « À venir » : chiffre en `--cobalt`.
- **Tuile vedette** (Progression moy., Objectifs atteints) : fond `--slab`, label `--on-slab-muted`, chiffre `--volt`, SegmentBar en dessous. Une seule par grille.

### ExerciseCard
- Card sans padding global, en 3 bandes séparées par des filets :
  1. **En-tête** (12–14px 16px) : numéro dans un carré 32px `--slab` mono « 01 », nom `.t-heading`, à droite la note `★ 10/10` en `--volt-ink` mono 600 (étoile pleine) ou un résumé mono 12px « 3 × 6 · 20s · repos 20s » en vue coach.
  2. **Corps** : « OBJECTIF » `.t-label` + valeur mono ; bloc consignes fond `--paper` radius 4px `padding: 10px 12px` : « **Consignes :** baisse ton centre ».
  3. **StatGrid** : 4 colonnes séparées par des filets verticaux — valeur mono 18px/600 au-dessus, `.t-label` en dessous : SÉRIES · REPS · TEMPO · REPOS.
- En vue coach, le corps contient aussi : RatingPicker, Field commentaire, bouton `dark` « Enregistrer » aligné à droite.

### RatingPicker (note /10, vue coach)
- En-tête : `.t-label` « NOTE » à gauche, valeur mono 24px/600 `--volt-ink` à droite (« 9/10 »).
- Grille de 10 boutons (role="radiogroup"/"radio"), hauteur 32px, radius 2px, chiffre mono 11px.
  - ≤ note : fond `--slab`, texte `--on-slab`.
  - = note : fond `--volt`, texte `--on-volt`, `box-shadow: inset 0 0 0 2px var(--ink)`.
  - > note : fond `--paper-raised`, bordure `--line`, texte `--ink-muted`.
- Remplace le slider.

### AthleteToggle (vue coach d'une séance)
- Rangée de boutons 44px (avatar 32px + prénom). Sélectionné : fond `--slab`, texte `--on-slab`, avatar `--volt`. Autres : fond `--paper-raised` + bordure.

### ListRow / ListGroup
- Groupe = Card sans padding ; chaque ligne `padding: 12–14px`, séparée par `border-bottom: 1px solid var(--line)`.
- Ligne sportif : Avatar + nom 15px/600–700 (+ sous-ligne mono 12px « 2 séances notées ») + valeur mono à droite.
- Ligne menu (Profil) : icône 20px colorée (cobalt pour utilisateurs, `--volt-ink` pour +), libellé 15px/600, chevron › `--ink-muted`, `min-height: 56px`.

### SectionHeader
- `.t-label` à gauche + lien cobalt 13px/600 « Voir tout › » à droite.

### ProgressRow (stats coach, dans le panneau slab)
- Nom 13px à gauche + valeur mono 600 à droite (« 9.5/10 »), puis barre pleine 8px : piste `--slab-track`, remplissage `--volt` à `width: X%`.

### Sparkline
- SVG 64×24 : ligne `--cobalt` 2px, points carrés 4×4 `--cobalt`. Un seul point si une seule séance.

### LineChart (Courbe de progression)
- Dans une Card, sous un SegmentedControl Semaine/Mois/Année et un sélecteur de période (IconButtons ‹ › + « Octobre 2026 », année en mono).
- Axe Y 0–10, graduations tous les 2, libellés mono 11px `--ink-muted` ; grille horizontale `--line` 1px ; ligne de base `--ink`.
- Axe X : S1…S5 en mono 11px.
- Série : ligne `--cobalt` 2.5px, points **carrés** 10×10 `--cobalt` ; le dernier point = carré `--volt` bordé `--ink` 2px avec sa valeur mono 12px/600 à côté.
- Fournir un `aria-label` résumant les valeurs.

### BrandMark
- Carré 28px `--volt` contenant un chevron › `--on-volt` (stroke 3) + « Sport Track » 15px/800.

### HeroBand (connexion / inscription)
- Bandeau `--slab` en haut (232px login, 88px inscription), composition de blocs à angles nets :
  - bloc `--volt` 128×200 à gauche débordant en haut, contenant une grille 3×3 de chevrons › `--on-volt` (24px, stroke 3) ;
  - petit bloc `--signal` 80×40 et bloc `--cobalt` 48×24 en haut ;
  - bloc `--slab-track` à droite avec une rangée de 4 chevrons `--volt`.
- Version inscription : bouton retour à gauche (bordure `--slab-track`, icône `--on-slab`), bloc volt 120px à droite avec 3 chevrons.

### Icônes
- Style trait type Lucide, `stroke-width: 1.75`, `stroke-linecap: square`, `stroke-linejoin: miter`, `fill: none`, couleur `currentColor`. Si le projet utilise déjà lucide-react, garder et passer ces props.

## 4. Écrans en mode Tracé

1. **Connexion** — HeroBand ; `.t-display` « Sport Track » + sous-titre ; Field E-mail, Field Mot de passe ; Button primary « Se connecter → » ; séparateur « OU » (filets + label) ; « Connexion Google non configurée. » 13px muted ; en bas « Pas encore de compte ? **Créer un compte** ».
2. **Inscription** — HeroBand court ; `.t-page` « Créer un compte » ; Prénom/Nom en grille ; E-mail ; Mot de passe ; « JE SUIS… » SegmentedControl Sportif/Coach ; Button primary « Créer mon compte → » ; lien « Se connecter ».
3. **Accueil coach** — BrandMark + label « TABLEAU DE BORD » ; `.t-display` nom du coach (40px) ; KpiTile ×4 (Sportifs, Séances créées, À venir en cobalt, Progression moy. en vedette) ; 2 boutons côte à côte : primary « + Créer une séance », outline « Ajouter un sportif » ; SectionHeader « SPORTIFS RÉCENTS / Voir tout » + ListGroup ; « SÉANCES À VENIR » + SessionCard.
4. **Séances** — `.t-page` + IconButton primary « + » ; SearchField ; FilterChips ; liste de SessionCard.
5. **Détail séance (sportif)** — IconButton retour + `.t-title` ; TypeTags + date mono (calendrier) ; participants ; Button primary « ▶ Lancer la séance » / « 1 exercice » ; ScorePanel ; `.t-label` « EXERCICES » ; ExerciseCard(s).
6. **Détail séance (coach / notation)** — comme 5, plus IconButtons modifier + supprimer (danger) dans l'en-tête ; AthleteToggle ; ScorePanel du sportif sélectionné ; ExerciseCard en mode notation (RatingPicker + commentaire + Enregistrer).
7. **Statistiques coach** — `.t-page` ; panneau slab « PROGRESSION MOYENNE / Groupe entier », tendance « ↗ +6,4% » en volt, `.t-metric-xl` 64px volt, ProgressRow par sportif ; « PAR SPORTIF » + ListGroup avec Sparkline et moyenne.
8. **Statistiques sportif** — `.t-page` ; Card LineChart ; 2 KpiTile : Moyenne générale (« 9.5 », « sur 2 séances ») et Objectifs atteints en vedette (« 2/2 » + SegmentBar).
9. **Profil** — `.t-page` + IconButton lune (bascule thème) ; panneau slab : Avatar volt 72px, nom 24px/800, e-mail mono muted, tag rôle (fond `--on-slab`, texte `--ink`, label) ; **section « APPARENCE »** (`.t-label`) avec le SegmentedControl Classique / Tracé et ses vignettes ; ListGroup menu (Gérer les utilisateurs, Créer une séance) ; Button outline « Déconnexion ».

## 5. Critères d'acceptation

**Sélecteur**
- Par défaut (localStorage vide), l'app s'ouvre en Classique.
- Basculer Classique ↔ Tracé dans le Profil change tout le rendu instantanément, sans rechargement ni perte d'état (formulaire en cours, onglet actif).
- Le choix persiste après rechargement, sans flash de l'autre design.
- Design et thème sont indépendants : les 4 combinaisons fonctionnent.

**Classique**
- Aucune différence visuelle avec la version actuelle. Avant/après : capture de chaque écran en Classique clair et sombre, comparaison identique.
- Aucun fichier CSS Classique modifié, à part l'ajout de classNames neutres.

**Tracé**
- Plus aucune `box-shadow` hors `--focus-ring` ; plus aucun radius > 4px hors StatusPill.
- Tous les chiffres en JetBrains Mono.
- Un seul CTA volt par écran.
- Contraste ≥ 4.5:1 en clair et en sombre (les tokens ci-dessus le respectent).

**Général**
- Aucune régression fonctionnelle : mêmes routes, mêmes appels API, mêmes formulaires, dans les deux designs.
- Aucun sélecteur CSS Tracé sans préfixe `[data-design="trace"]` (vérifiable par grep dans `src/styles/trace/`).
