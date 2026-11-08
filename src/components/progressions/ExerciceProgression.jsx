import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { stats as statsApi } from "../../lib/api";
import { Select } from "../ui/Input";
import KpiTile from "../ui/KpiTile";
import { formatLest } from "../../lib/exerciceForm";

const TICK = { fill: "var(--ink-muted)", fontSize: 11 };

function formatDate(day) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="card-surface px-3 py-2 text-caption">
      <p className="font-bold">{formatDate(p.date)}</p>
      <p>
        {p.valeur} {unit} · {p.series} série{p.series > 1 ? "s" : ""}
      </p>
    </div>
  );
}

// Progression RÉELLE d'un exercice (séries saisies dans le lecteur) : records
// et courbe de la charge maximale par séance — ou des répétitions maximales
// pour un exercice sans charge.
function ExerciceProgression({ profilId }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    setData(null);
    statsApi
      .exercices({ profilId })
      .then((list) => {
        setData(list);
        setSelected(list[0]?.exercice ?? "");
      })
      .catch(() => setData([]));
  }, [profilId]);

  if (!data) return null;

  const exercice = data.find((e) => e.exercice === selected);
  const avecCharge = exercice?.record.chargeMax > 0;
  const unit = avecCharge ? "kg" : "reps";
  const points = exercice?.points.map((p) => ({ ...p, valeur: avecCharge ? p.chargeMax : p.repsMax })) ?? [];

  return (
    <section className="card-surface p-5 flex flex-col gap-4" aria-labelledby="exercice-progression-title">
      <div className="flex flex-col gap-1">
        <h2 id="exercice-progression-title" className="text-h3">
          Records et performances
        </h2>
        <p className="text-caption text-muted-foreground">À partir des séries saisies en fin de séance.</p>
      </div>

      {data.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          Aucune performance enregistrée. Lance une séance et saisis tes répétitions et charges à chaque série.
        </p>
      ) : (
        <>
          <Select label="Exercice" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {data.map((e) => (
              <option key={e.exercice} value={e.exercice}>
                {e.exercice}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <KpiTile label="Charge max" value={formatLest(exercice.record.chargeMax) ?? "—"} />
            <KpiTile label="Reps max" value={exercice.record.repsMax || "—"} />
          </div>

          {points.length > 1 ? (
            <div
              className="h-[200px]"
              role="img"
              aria-label={`${avecCharge ? "Charge maximale" : "Répétitions maximales"} par séance : ${points
                .map((p) => `${formatDate(p.date)} ${p.valeur} ${unit}`)
                .join(", ")}`}
            >
              <ResponsiveContainer>
                <LineChart data={points} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={TICK} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={TICK} width={40} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "var(--border)" }} />
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke="var(--info)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--info)", stroke: "var(--card)", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-caption text-muted-foreground">La courbe apparaîtra dès la deuxième séance saisie.</p>
          )}
        </>
      )}
    </section>
  );
}

export default ExerciceProgression;
