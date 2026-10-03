import SegmentBar from "./SegmentBar";

// Panneau de score Tracé (remplace l'anneau de progression). `figures` remplace
// les colonnes TOTAL / MOYENNE par défaut.
function ScorePanel({ label = "Score", percentage, total, max, moyenne10, figures }) {
  const cols = figures ?? [
    { label: "Total", value: `${total}/${max}` },
    { label: "Moyenne", value: moyenne10.toFixed(1) },
  ];
  return (
    <div className="st-slab st-scorepanel animate-rise">
      <div className="st-scorepanel-top">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="t-label truncate">{label}</span>
          <span className="t-metric-xl st-volt-text">{percentage}%</span>
        </div>
        <div className="st-scorepanel-figures">
          {cols.map((c) => (
            <div key={c.label} className="flex flex-col">
              <span className="t-label">{c.label}</span>
              <span className="st-scorepanel-figure">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
      <SegmentBar filled={percentage / 10} total={10} />
    </div>
  );
}

export default ScorePanel;
