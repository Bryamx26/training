import { createContext, useContext, useEffect, useState } from "react";

// Design visuel de l'application, indépendant du mode clair/sombre (.dark) :
// "relief" (neumorphique, par défaut) ou "trace". Le rendu suit l'attribut
// data-design posé sur <html>.
const DESIGNS = ["relief", "trace"];
const DEFAULT_DESIGN = "relief";
const STORAGE_KEY = "sporttrack.design";

// Polices de chaque design, hébergées avec l'application (@fontsource) et
// chargées seulement quand le design est actif. Aucune requête vers Google
// Fonts : l'adresse IP des visiteurs n'est pas transmise à un tiers.
const FONTS = {
  relief: () =>
    Promise.all([
      import("@fontsource/manrope/latin-400.css"),
      import("@fontsource/manrope/latin-500.css"),
      import("@fontsource/manrope/latin-600.css"),
      import("@fontsource/manrope/latin-700.css"),
      import("@fontsource/manrope/latin-800.css"),
    ]),
  trace: () =>
    Promise.all([
      import("@fontsource/archivo/latin-400.css"),
      import("@fontsource/archivo/latin-500.css"),
      import("@fontsource/archivo/latin-600.css"),
      import("@fontsource/archivo/latin-700.css"),
      import("@fontsource/archivo/latin-800.css"),
      import("@fontsource/jetbrains-mono/latin-500.css"),
      import("@fontsource/jetbrains-mono/latin-600.css"),
    ]),
};

const DesignContext = createContext({ design: DEFAULT_DESIGN, setDesign: () => {} });

// Une valeur inconnue (dont l'ancien "classic", remplacé par Relief) revient
// au design par défaut ; l'effet du provider réécrit alors la valeur migrée.
function readStoredDesign() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return DESIGNS.includes(stored) ? stored : DEFAULT_DESIGN;
  } catch {
    return DEFAULT_DESIGN;
  }
}

function loadFonts(design) {
  // Le navigateur ne télécharge une police que lorsqu'un texte l'utilise.
  FONTS[design]().catch(() => {});
}

export function DesignProvider({ children }) {
  const [design, setDesign] = useState(readStoredDesign);

  useEffect(() => {
    document.documentElement.dataset.design = design;
    loadFonts(design);
    try {
      localStorage.setItem(STORAGE_KEY, design);
    } catch {
      // Stockage indisponible (navigation privée...) : le choix vaut pour la session.
    }
  }, [design]);

  return <DesignContext.Provider value={{ design, setDesign }}>{children}</DesignContext.Provider>;
}

export function useDesign() {
  return useContext(DesignContext);
}
