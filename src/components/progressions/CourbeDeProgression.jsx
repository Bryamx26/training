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
    <div
      style={{
        display: "flex",
        background: "var(--color-secondary)",
        borderRadius: 999,
        padding: 4,
        marginBottom: 16,
      }}
    >
      {options.map((opt) => {
        const active = vue === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 999,
              padding: "10px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              background: active ? "var(--color-card)" : "transparent",
              color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              boxShadow: active ? "var(--shadow-soft)" : "none",
              transition: "all 0.15s ease",
            }}
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      }}
    >
      <button onClick={onPrev} aria-label="Période précédente" style={navButtonStyle}>
        ‹
      </button>
      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-foreground)" }}>
        {label}
      </span>
      <button onClick={onNext} aria-label="Période suivante" style={navButtonStyle}>
        ›
      </button>
    </div>
  );
}

const navButtonStyle = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "none",
  background: "var(--color-muted)",
  color: "var(--color-foreground)",
  fontSize: 18,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

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
    <div
      style={{
        background: "var(--color-card)",
        borderRadius: 28,
        padding: "28px 24px 20px",
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        boxShadow: "var(--shadow-card)",
      }}
      className="card-surface"
    >
      <h2
        style={{
          margin: "0 0 20px",
          fontSize: 24,
          fontWeight: 800,
          color: "var(--color-foreground)",
          letterSpacing: "-0.02em",
        }}
      >
        Courbe de progression
      </h2>

      <SelecteurVue vue={vue} onChange={changerVue} />
      <NavigationPeriode label={label} onPrev={goPrev} onNext={goNext} />

      <div style={{ width: "100%", height: 260 }}>
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
