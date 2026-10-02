// Courbe de progression
// Accepte une liste de séances { date, note } et permet de visualiser
// l'évolution par semaine, par mois ou par année.

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Dot,
  Tooltip,
} from "recharts";

const MOIS_COURT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const MOIS_LONG = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// --- Helpers dates ---

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche
  const diff = (day === 0 ? -6 : 1) - day; // recale sur lundi
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function average(arr) {
  if (!arr.length) return null;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function formatJourMois(d) {
  return `${d.getDate()} ${MOIS_COURT[d.getMonth()]}`;
}

// --- Point personnalisé (masqué si pas de donnée) ---

function CustomDot(props) {
  const { cx, cy, value } = props;
  if (value === null || value === undefined) return null;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={6}
      fill="var(--color-card)"
      stroke="var(--color-success)"
      strokeWidth={3}
    />
  );
}

// --- Sélecteur segmenté Semaine / Mois / Année ---

function SelecteurVue({ vue, onChange }) {
  const options = [
    { value: "semaine", label: "Semaine" },
    { value: "mois", label: "Mois" },
    { value: "annee", label: "Année" },
  ];

  return (
    <div className="flex bg-secondary rounded-full p-1 mb-4">
      {options.map((opt) => {
        const active = vue === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 border-0 rounded-full py-2.5 text-sm font-bold cursor-pointer transition-all duration-150 ${
              active ? "bg-card text-foreground shadow-[var(--shadow-soft)]" : "bg-transparent text-muted-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Navigation entre périodes (précédent / suivant) ---

function NavigationPeriode({ label, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <button onClick={onPrev} aria-label="Période précédente" className={navButtonClass}>
        ‹
      </button>
      <span className="text-[15px] font-bold text-foreground">{label}</span>
      <button onClick={onNext} aria-label="Période suivante" className={navButtonClass}>
        ›
      </button>
    </div>
  );
}

const navButtonClass =
  "w-8 h-8 rounded-full border-0 bg-muted text-foreground text-lg leading-none cursor-pointer flex items-center justify-center";

/**
 * CourbeDeProgression
 *
 * Props:
 * - seances: [{ date: "2026-08-03", note: 7.5 }, ...]
 * - vueInitiale: "semaine" | "mois" | "annee" (défaut: "mois")
 */
export default function CourbeDeProgression({ seances = [], vueInitiale = "mois" }) {
  const [vue, setVue] = useState(vueInitiale);
  const [reference, setReference] = useState(new Date());

  const parsed = useMemo(
    () => seances.map((s) => ({ date: parseDate(s.date), note: s.note })),
    [seances]
  );

  const { data, label } = useMemo(() => {
    if (vue === "semaine") {
      const start = startOfWeek(reference);
      const jours = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
      const points = jours.map((d, i) => {
        const notes = parsed.filter((p) => sameDay(p.date, d)).map((p) => p.note);
        return { periode: JOURS_COURT[i], note: average(notes) };
      });
      const end = jours[6];
      return {
        data: points,
        label: `${formatJourMois(start)} – ${formatJourMois(end)} ${end.getFullYear()}`,
      };
    }

    if (vue === "mois") {
      const year = reference.getFullYear();
      const month = reference.getMonth();
      const inMonth = parsed.filter(
        (p) => p.date.getFullYear() === year && p.date.getMonth() === month
      );
      const nbJours = new Date(year, month + 1, 0).getDate();
      const nbSemaines = Math.ceil(nbJours / 7);
      const points = Array.from({ length: nbSemaines }, (_, i) => {
        const notes = inMonth
          .filter((p) => Math.floor((p.date.getDate() - 1) / 7) === i)
          .map((p) => p.note);
        return { periode: `Sem ${i + 1}`, note: average(notes) };
      });
      return { data: points, label: `${MOIS_LONG[month]} ${year}` };
    }

    // vue === "annee"
    const year = reference.getFullYear();
    const inYear = parsed.filter((p) => p.date.getFullYear() === year);
    const points = MOIS_COURT.map((m, i) => {
      const notes = inYear.filter((p) => p.date.getMonth() === i).map((p) => p.note);
      return { periode: m, note: average(notes) };
    });
    return { data: points, label: `${year}` };
  }, [vue, reference, parsed]);

  function changerVue(nouvelleVue) {
    setVue(nouvelleVue);
  }

  function goPrev() {
    setReference((ref) => {
      const d = new Date(ref);
      if (vue === "semaine") d.setDate(d.getDate() - 7);
      else if (vue === "mois") d.setMonth(d.getMonth() - 1);
      else d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  }

  function goNext() {
    setReference((ref) => {
      const d = new Date(ref);
      if (vue === "semaine") d.setDate(d.getDate() + 7);
      else if (vue === "mois") d.setMonth(d.getMonth() + 1);
      else d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  }

  return (
    <div className="bg-card rounded-[28px] shadow-[var(--shadow-card)] px-6 pt-7 pb-5">
      <h2 className="mb-5 text-2xl font-extrabold text-foreground tracking-[-0.02em]">Courbe de progression</h2>

      <SelecteurVue vue={vue} onChange={changerVue} />
      <NavigationPeriode label={label} onPrev={goPrev} onNext={goNext} />

      <div className="w-full h-[260px]">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeWidth={1} />
            <XAxis
              dataKey="periode"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 13 }}
              dy={8}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 14 }}
              width={40}
            />
            <Tooltip
              formatter={(value) => [`${value.toFixed(1)}/10`, "Note"]}
              labelFormatter={(label) => label}
              contentStyle={{
                borderRadius: 12,
                border: "none",
                background: "var(--color-popover)",
                color: "var(--color-popover-foreground)",
                boxShadow: "var(--shadow-lift)",
              }}
              cursor={false}
            />
            <Line
              type="monotone"
              dataKey="note"
              stroke="var(--color-success)"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 7 }}
              connectNulls
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
