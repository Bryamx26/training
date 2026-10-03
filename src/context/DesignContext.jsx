import { createContext, useContext, useEffect, useState } from "react";

// Design visuel de l'application, indépendant du mode clair/sombre (.dark) :
// "relief" (neumorphique, par défaut) ou "trace". Le rendu suit l'attribut
// data-design posé sur <html>.
const DESIGNS = ["relief", "trace"];
const DEFAULT_DESIGN = "relief";
const STORAGE_KEY = "sporttrack.design";

// Polices Google Fonts de chaque design, chargées seulement quand il est actif.
const FONTS = {
  relief: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
  trace:
    "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap",
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
  const id = `${design}-fonts`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = FONTS[design];
  document.head.appendChild(link);
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
