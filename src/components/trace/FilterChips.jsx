function FilterChips({ options, value, onChange, label }) {
  return (
    <div className="st-chips" role="group" aria-label={label}>
      {options.map((opt) => (
        <button key={opt.value} type="button" aria-pressed={value === opt.value} onClick={() => onChange(opt.value)} className="st-chip">
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default FilterChips;
