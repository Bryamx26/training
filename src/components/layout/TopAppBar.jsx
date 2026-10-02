import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function TopAppBar({ title, onBack, action }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 px-5 py-4 backdrop-blur-sm" style={{ background: "color-mix(in oklab, var(--color-background) 85%, transparent)" }}>
      {onBack && (
        <button
          type="button"
          onClick={() => (onBack === true ? navigate(-1) : onBack())}
          className="press flex items-center justify-center w-9 h-9 rounded-full"
          style={{ background: "var(--color-secondary)" }}
          aria-label="Retour"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-h1 flex-1 truncate">{title}</h1>
      {action}
    </header>
  );
}

export default TopAppBar;
