import { ChevronLeft, ChevronRight } from "lucide-react";

function Chevrons({ count }) {
  return Array.from({ length: count }, (_, i) => <ChevronRight key={i} aria-hidden="true" />);
}

// Bandeau graphique des écrans Connexion / Inscription.
function HeroBand({ variant = "login", onBack }) {
  if (variant === "register") {
    return (
      <div className="st-hero" style={{ height: 88 }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Retour"
            className="st-iconbutton st-iconbutton--on-slab"
            style={{ left: 20, top: 22 }}
          >
            <ChevronLeft />
          </button>
        )}
        <div className="st-hero-volt" style={{ right: 20, top: -8, width: 120, height: 72, gridTemplateColumns: "repeat(3, 24px)" }}>
          <Chevrons count={3} />
        </div>
        <div style={{ right: 152, top: 0, width: 48, height: 24, background: "var(--cobalt)" }} />
      </div>
    );
  }

  return (
    <div className="st-hero" style={{ height: 232 }} aria-hidden="true">
      <div className="st-hero-volt" style={{ left: 20, top: -12, width: 128, height: 200 }}>
        <Chevrons count={9} />
      </div>
      <div style={{ left: 168, top: 0, width: 80, height: 40, background: "var(--signal)" }} />
      <div style={{ left: 260, top: 0, width: 48, height: 24, background: "var(--cobalt)" }} />
      <div className="st-hero-row" style={{ left: 168, right: 0, top: 120, height: 56 }}>
        <Chevrons count={4} />
      </div>
    </div>
  );
}

export default HeroBand;
