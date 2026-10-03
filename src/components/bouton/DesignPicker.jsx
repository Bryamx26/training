import { useDesign } from "../../context/DesignContext";
import TraceSegmentedControl from "../trace/SegmentedControl";
import ReliefSegmentedControl from "../relief/SegmentedControl";

// Vignettes d'aperçu 48×32 de chaque design (couleurs fixes : elles montrent
// l'autre design quel que soit celui qui est actif).
function ReliefThumb() {
  return (
    <svg width="48" height="32" viewBox="0 0 48 32" aria-hidden="true" className="st-thumb shrink-0 rounded-md">
      <defs>
        <filter id="relief-thumb-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1.5" dy="1.5" stdDeviation="1.5" floodColor="#a3b1c6" />
          <feDropShadow dx="-1.5" dy="-1.5" stdDeviation="1.5" floodColor="#ffffff" />
        </filter>
      </defs>
      <rect width="48" height="32" rx="6" fill="#e6ebf1" />
      <rect x="10" y="9" width="28" height="14" rx="7" fill="#e6ebf1" filter="url(#relief-thumb-shadow)" />
      <circle cx="31" cy="16" r="3" fill="#16a34a" />
    </svg>
  );
}

function TraceThumb() {
  return (
    <svg width="48" height="32" viewBox="0 0 48 32" aria-hidden="true" className="st-thumb shrink-0 rounded-md">
      <rect width="48" height="32" fill="#f3f2ec" />
      <rect x="9" y="9" width="14" height="14" fill="#d6ff3d" />
      <rect x="25" y="9" width="14" height="14" fill="#0d0f12" />
    </svg>
  );
}

const OPTIONS = [
  { value: "relief", label: "Relief", thumb: <ReliefThumb /> },
  { value: "trace", label: "Tracé", thumb: <TraceThumb /> },
];

const LABEL = "Design de l'application";

// Sélecteur Relief / Tracé, rendu dans le style du design actif.
function DesignPicker() {
  const { design, setDesign } = useDesign();

  if (design === "trace") {
    return <TraceSegmentedControl options={OPTIONS} value={design} onChange={setDesign} label={LABEL} />;
  }

  return (
    <ReliefSegmentedControl
      options={OPTIONS.map((opt) => ({ ...opt, icon: opt.thumb }))}
      value={design}
      onChange={setDesign}
      label={LABEL}
    />
  );
}

export default DesignPicker;
