import { ChevronLeft, ChevronRight } from "lucide-react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import SegmentedControl from "./SegmentedControl";

const VUES = [
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
  { value: "annee", label: "Année" },
];

const TICK = { fill: "var(--ink-muted)", fontSize: 11 };

function Dot({ cx, cy, value, index, lastIndex }) {
  if (value === null || value === undefined || cx == null || cy == null) return null;
  if (index === lastIndex) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="var(--progress)" stroke="#ffffff" strokeWidth={2.5} />
        <text x={cx + 10} y={cy - 10} fontSize={12} fontWeight={800} fill="var(--progress-ink)">
          {value.toFixed(1)}
        </text>
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={5} fill="var(--surface)" stroke="var(--progress)" strokeWidth={3} />;
}

// Courbe de progression Relief. Le calcul des points reste dans
// CourbeDeProgression, qui choisit le rendu selon le design actif.
function LineChart({ data, vue, onVue, label, onPrev, onNext }) {
  let lastIndex = -1;
  data.forEach((p, i) => {
    if (p.note !== null && p.note !== undefined) lastIndex = i;
  });
  const summaryText = data
    .filter((p) => p.note !== null && p.note !== undefined)
    .map((p) => `${p.periode} : ${p.note.toFixed(1)}`)
    .join(", ");

  return (
    <div className="rl-card flex flex-col gap-4">
      <h2 className="text-[20px] leading-7 font-extrabold">Courbe de progression</h2>
      <SegmentedControl options={VUES} value={vue} onChange={onVue} label="Période affichée" />
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onPrev} aria-label="Période précédente" className="st-iconbutton">
          <ChevronLeft />
        </button>
        <span className="text-[15px] font-bold">{label}</span>
        <button type="button" onClick={onNext} aria-label="Période suivante" className="st-iconbutton">
          <ChevronRight />
        </button>
      </div>
      <div
        className="rl-chart-well h-[240px]"
        role="img"
        aria-label={`Courbe de progression, ${label}. ${summaryText || "Aucune séance notée sur la période."}`}
      >
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 18, right: 24, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 4" />
            <XAxis dataKey="periode" axisLine={false} tickLine={false} tick={TICK} dy={6} />
            <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} axisLine={false} tickLine={false} tick={TICK} width={40} />
            {/* Seule exception au « pas de dégradé » : la zone sous la courbe, à 12 %. */}
            <Area type="monotone" dataKey="note" fill="var(--progress)" fillOpacity={0.12} stroke="none" connectNulls isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="note"
              stroke="var(--progress)"
              strokeWidth={3}
              strokeLinecap="round"
              dot={(props) => <Dot key={props.index} {...props} lastIndex={lastIndex} />}
              activeDot={false}
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default LineChart;
