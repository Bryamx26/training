import { ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import SegmentedControl from "./SegmentedControl";

const VUES = [
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
  { value: "annee", label: "Année" },
];

const TICK = { fill: "var(--ink-muted)", fontSize: 11 };

// "Sem 3" -> "S3" ; les autres libellés (Lun, Jan…) restent tels quels.
function shortPeriode(p) {
  return p.replace(/^Sem (\d+)$/, "S$1");
}

function SquareDot({ cx, cy, value, index, lastIndex }) {
  if (value === null || value === undefined || cx == null || cy == null) return null;
  if (index === lastIndex) {
    return (
      <g>
        <rect x={cx - 5} y={cy - 5} width={10} height={10} fill="var(--volt)" stroke="var(--ink)" strokeWidth={2} />
        <text x={cx + 10} y={cy - 8} fontSize={12} fontWeight={600} fill="var(--ink)">
          {value.toFixed(1)}
        </text>
      </g>
    );
  }
  return <rect x={cx - 5} y={cy - 5} width={10} height={10} fill="var(--cobalt)" />;
}

// Libellé de période dont les nombres (année, jours) sont en mono.
function PeriodLabel({ label }) {
  return (
    <span className="text-[15px] font-bold">
      {label.split(/(\d+)/).map((part, i) => (/^\d+$/.test(part) ? <span key={i} className="t-mono">{part}</span> : part))}
    </span>
  );
}

// Courbe de progression Tracé. Le calcul des points reste dans
// CourbeDeProgression, qui choisit le rendu selon le design actif.
function LineChart({ data, vue, onVue, label, onPrev, onNext }) {
  const points = data.map((d) => ({ ...d, periode: shortPeriode(d.periode) }));
  let lastIndex = -1;
  points.forEach((p, i) => {
    if (p.note !== null && p.note !== undefined) lastIndex = i;
  });
  const summaryText = points
    .filter((p) => p.note !== null && p.note !== undefined)
    .map((p) => `${p.periode} : ${p.note.toFixed(1)}`)
    .join(", ");

  return (
    <div className="st-card flex flex-col gap-4">
      <h2 className="t-heading">Courbe de progression</h2>
      <SegmentedControl options={VUES} value={vue} onChange={onVue} label="Période affichée" />
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onPrev} aria-label="Période précédente" className="st-iconbutton">
          <ChevronLeft />
        </button>
        <PeriodLabel label={label} />
        <button type="button" onClick={onNext} aria-label="Période suivante" className="st-iconbutton">
          <ChevronRight />
        </button>
      </div>
      <div
        className="st-chart w-full h-[240px]"
        role="img"
        aria-label={`Courbe de progression, ${label}. ${summaryText || "Aucune séance notée sur la période."}`}
      >
        <ResponsiveContainer>
          <RLineChart data={points} margin={{ top: 16, right: 28, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeWidth={1} />
            <ReferenceLine y={0} stroke="var(--ink)" strokeWidth={1} />
            <XAxis dataKey="periode" axisLine={false} tickLine={false} tick={TICK} dy={6} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} axisLine={false} tickLine={false} tick={TICK} width={40} />
            <Line
              type="linear"
              dataKey="note"
              stroke="var(--cobalt)"
              strokeWidth={2.5}
              strokeLinejoin="miter"
              dot={(props) => <SquareDot key={props.index} {...props} lastIndex={lastIndex} />}
              activeDot={false}
              connectNulls
              isAnimationActive={false}
            />
          </RLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default LineChart;
