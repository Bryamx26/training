import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// titleSize="sm" : titre de séance (plus petit) en design Tracé.
function TopAppBar({ title, onBack, action, titleSize }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 px-5 py-4 backdrop-blur-sm bg-[color-mix(in_oklab,var(--color-background)_85%,transparent)] st-topbar">
      {onBack && (
        <button
          type="button"
          onClick={() => (onBack === true ? navigate(-1) : onBack())}
          className="press flex items-center justify-center w-9 h-9 rounded-full bg-secondary st-iconbutton"
          aria-label="Retour"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className={`text-h1 flex-1 truncate st-topbar-title${titleSize === "sm" ? " st-topbar-title--sm" : ""}`}>{title}</h1>
      {action}
    </header>
  );
}

export default TopAppBar;
