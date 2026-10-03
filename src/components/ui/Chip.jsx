import { useDesign } from "../../context/DesignContext";

// Puce cliquable, stylée par chaque design (st-chip pour Tracé, rl-chip pour Relief).
// `badge` (ex. « ×2 ») marque la puce comme déjà utilisée.
function Chip({ children, onClick, badge, ...props }) {
  const { design } = useDesign();
  const base = design === "trace" ? "st-chip" : "rl-chip";

  return (
    <button type="button" onClick={onClick} className={`${base}${badge ? ` ${base}--selected` : ""} inline-flex items-center gap-1.5`} {...props}>
      {children}
      {badge && <span className="text-[11px] font-bold opacity-80">{badge}</span>}
    </button>
  );
}

export default Chip;
