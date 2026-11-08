import { useDesign } from "../../context/DesignContext";

// Étiquette (type de séance, difficulté) dans le style du design actif.
export function Tag({ children }) {
  const { design } = useDesign();
  return <span className={design === "trace" ? "st-tag" : "rl-tag"}>{children}</span>;
}

// Pastille de statut. tone : "info" (À venir), "done" (terminée et notée) ou neutre.
export function StatusPill({ tone, children }) {
  const { design } = useDesign();
  if (design === "trace") {
    const traceTone = tone === "info" ? "cobalt" : tone;
    return <span className={`st-pill${traceTone ? ` st-pill--${traceTone}` : ""}`}>{children}</span>;
  }
  return <span className={`rl-status${tone ? ` rl-status--${tone}` : ""}`}>{children}</span>;
}
