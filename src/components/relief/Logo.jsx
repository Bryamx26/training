import { Dumbbell } from "lucide-react";

// Logo de l'écran de connexion : carré en relief, rond creusé, haltère verte.
function Logo() {
  return (
    <div className="rl-logo" aria-hidden="true">
      <span className="rl-inset-disc w-[60px] h-[60px]">
        <Dumbbell className="w-7 h-7" style={{ color: "var(--progress)", strokeWidth: 2.5 }} />
      </span>
    </div>
  );
}

export default Logo;
