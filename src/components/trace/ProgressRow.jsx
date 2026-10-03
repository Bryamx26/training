function ProgressRow({ name, value, display }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="st-progressrow">
      <div className="st-progressrow-head">
        <span className="truncate">{name}</span>
        <span className="t-mono font-semibold shrink-0">{display}</span>
      </div>
      <div className="st-progressrow-track">
        <div className="st-progressrow-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default ProgressRow;
