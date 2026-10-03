// Contrôle segmenté Tracé (sémantique radiogroup).
function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div className="st-segmented" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="st-segment"
        >
          {opt.thumb}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedControl;
