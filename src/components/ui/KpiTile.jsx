import { useDesign } from "../../context/DesignContext";
import ReliefKpiTile from "../relief/KpiTile";
import TraceKpiTile from "../trace/KpiTile";

// Tuile KPI commune : choisit le rendu du design actif.
// - tone : "info" (bleu / cobalt) ou "progress" (vert ; tuile vedette en Tracé)
// - progress : { value, max } → barre de progression (Relief) ou segments (Tracé)
// - suffix : affiché en petit après la valeur (« /2 »)
function KpiTile({ label, value, suffix, sub, tone, progress }) {
  const { design } = useDesign();
  const ratio = progress && progress.max > 0 ? Math.min(1, progress.value / progress.max) : null;

  if (design === "trace") {
    // Au-delà de 12 segments, la barre devient illisible : on la ramène à 10.
    const segments =
      ratio === null ? undefined : progress.max <= 12 ? { filled: progress.value, total: progress.max } : { filled: ratio * 10, total: 10 };
    return (
      <TraceKpiTile
        label={label}
        value={suffix ? `${value}${suffix}` : value}
        sub={sub}
        tone={tone === "info" ? "cobalt" : undefined}
        featured={tone === "progress"}
        segments={segments}
      />
    );
  }

  return <ReliefKpiTile label={label} value={value} suffix={suffix} sub={sub} tone={tone} bar={ratio === null ? undefined : ratio * 100} />;
}

export default KpiTile;
