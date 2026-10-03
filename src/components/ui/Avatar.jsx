import { useDesign } from "../../context/DesignContext";

// `highlight` : variante mise en avant du design Tracé (fond volt).
// `muted` : variante atténuée du design Relief (sportif non sélectionné).
function Avatar({ nom = "", prenom = "", size = 48, highlight = false, muted = false }) {
  const { design } = useDesign();
  const initiales = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";

  if (design === "trace") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`st-avatar${highlight ? " st-avatar--volt" : ""}${size >= 64 ? " st-avatar--lg" : ""}`}
      >
        {initiales}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      className={`rl-avatar${muted ? " rl-avatar--muted" : ""}`}
    >
      {initiales}
    </div>
  );
}

export default Avatar;
