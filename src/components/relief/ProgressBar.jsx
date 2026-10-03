// Barre de progression creusée. `name` et `display` affichent l'en-tête optionnel.
function ProgressBar({ value, name, display }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(name || display) && (
        <div className="rl-bar-head">
          <span className="truncate">{name}</span>
          <span className="font-bold shrink-0">{display}</span>
        </div>
      )}
      <div className="rl-bar">
        <div className="rl-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
