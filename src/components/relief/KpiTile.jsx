import ProgressBar from "./ProgressBar";

// Tuile KPI. tone : "info" (bleu) ou "progress" (vert). `suffix` s'affiche en
// petit après la valeur (« /2 »), `bar` ajoute une barre de progression (0-100).
function KpiTile({ label, value, suffix, sub, tone, bar }) {
  const toneClass = tone === "info" ? "rl-info" : tone === "progress" ? "rl-progress-ink" : "";
  return (
    <div className="rl-tile flex flex-col gap-2 min-w-0 animate-rise">
      <span className="rl-label">{label}</span>
      <span className={`rl-metric ${toneClass}`}>
        {value}
        {suffix && <span className="text-[20px] rl-muted">{suffix}</span>}
      </span>
      {sub && <span className="text-[12px] rl-muted font-semibold">{sub}</span>}
      {bar !== undefined && <ProgressBar value={bar} />}
    </div>
  );
}

export default KpiTile;
