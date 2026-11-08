// Informations légales du site (mentions légales, contact RGPD).
// À COMPLÉTER avant la mise en ligne : la loi (LCEN art. 6) impose d'identifier
// l'éditeur et l'hébergeur. Un champ vide s'affiche « [à compléter] ».

export const LEGAL = {
  // Nom du service tel qu'il apparaît aux utilisateurs.
  site: "Sport Track",
  // Adresse publique du site (ex. https://sporttrack.fr).
  url: "",

  // Éditeur : la personne (ou la société) responsable du site et des données.
  editeur: {
    // Particulier : prénom et nom. Société : raison sociale.
    nom: "",
    // Ex. « Particulier », « Auto-entrepreneur », « SAS au capital de 1 000 € ».
    statut: "",
    // Société ou auto-entrepreneur : numéro SIREN / SIRET (sinon laisser vide).
    siret: "",
    // Un particulier peut ne publier que l'e-mail ; l'adresse complète reste
    // alors communiquée à l'hébergeur (LCEN art. 6, III-2).
    adresse: "",
    email: "",
    directeurPublication: "",
  },

  // Hébergeur du serveur (ex. OVHcloud, 2 rue Kellermann, 59100 Roubaix, 1007).
  hebergeur: {
    nom: "",
    adresse: "",
    telephone: "",
  },

  // Date de dernière mise à jour des documents légaux (AAAA-MM-JJ).
  miseAJour: "2026-11-08",
};

export const LEGAL_DOCS = [
  { slug: "mentions-legales", title: "Mentions légales" },
  { slug: "confidentialite", title: "Politique de confidentialité" },
  { slug: "cgu", title: "Conditions d'utilisation" },
  { slug: "cookies", title: "Cookies et stockage" },
];
