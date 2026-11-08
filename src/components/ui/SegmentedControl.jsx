import { useDesign } from "../../context/DesignContext";

// Contrôle segmenté commun aux deux designs (sémantique radiogroup). Seules les
// classes changent : piste creusée en Relief (rl-*), barre plate en Tracé (st-*).
// Chaque option peut porter une icône, un avatar ou une vignette (`option.icon`).
function SegmentedControl({ options, value, onChange, label }) {
  const { design } = useDesign();
  const prefix = design === "trace" ? "st" : "rl";

  return (
    <div className={`${prefix}-segmented`} role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`${prefix}-segment`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedControl;
