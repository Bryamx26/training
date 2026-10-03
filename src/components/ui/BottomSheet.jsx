import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

// Panneau modal qui monte du bas de l'écran (tiroir Social, choix d'un
// template…). Échap ou un clic sur le fond le ferment ; la page derrière ne
// défile plus pendant l'ouverture. `autoFocusClose` met le focus sur le
// bouton de fermeture quand le contenu n'a pas de champ à focaliser.
function BottomSheet({ title, onClose, autoFocusClose = false, children }) {
  const titleId = useId();
  const closeRef = useRef(null);
  // Dernière version de onClose, pour que l'effet ne se relance pas (et ne
  // reprenne pas le focus) à chaque rendu du parent.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (autoFocusClose) closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [autoFocusClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card-surface relative w-full max-w-xl mx-auto max-h-[85dvh] overflow-y-auto rounded-b-none px-5 pt-5 pb-[max(24px,env(safe-area-inset-bottom))] animate-rise"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 id={titleId} className="text-h2">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="press flex items-center justify-center w-9 h-9 rounded-full bg-secondary st-iconbutton"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default BottomSheet;
