// Contrôle segmenté Relief : piste creusée, option active en relief.
// Chaque option peut porter une icône ou un avatar (`option.icon`).
function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div className="rl-segmented" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="rl-segment"
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedControl;
