import SegmentBar from "./SegmentBar";

// Tuile KPI. `featured` = tuile vedette sur aplat sombre (une seule par grille).
function KpiTile({ label, value, sub, featured = false, tone, segments }) {
  return (
    <div className={`st-card st-kpi animate-rise ${featured ? "st-kpi--featured" : ""}`}>
      <span className="t-label">{label}</span>
      <span className={`t-metric ${tone === "cobalt" ? "st-cobalt-text" : ""}`}>{value}</span>
      {sub && <span className="st-kpi-sub">{sub}</span>}
      {segments && <SegmentBar filled={segments.filled} total={segments.total} className="mt-1" />}
    </div>
  );
}

export default KpiTile;
