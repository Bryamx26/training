// Sélecteur de note /10 Tracé (remplace le slider).
function RatingPicker({ value, onChange }) {
  const v = value ?? 0;
  return (
    <div className="st-rating">
      <div className="flex items-center justify-between">
        <span className="t-label">
          Note
        </span>
        <span className="st-rating-value">{v}/10</span>
      </div>
      <div className="st-rating-grid" role="radiogroup" aria-label="Note sur 10">
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === v}
              aria-label={`${n} sur 10`}
              onClick={() => onChange(n)}
              className={`st-rating-cell ${n < v ? "is-below" : ""}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RatingPicker;
