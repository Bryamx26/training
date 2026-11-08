import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { stats as statsApi } from "../../lib/api";
import { addDays, startOfWeek, toDayString } from "../../lib/seance";
import { Loading } from "../ui/States";

function formatJour(date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Séries travaillées par groupe musculaire sur une semaine : barres
// horizontales d'une seule teinte (la longueur porte la valeur), triées de la
// plus travaillée à la moins travaillée. Les muscles non travaillés restent
// listés en bas, pour repérer les oublis.
function MuscleVolume({ profilId }) {
  const [semaine, setSemaine] = useState(() => startOfWeek(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    statsApi
      .muscles({ profilId, from: toDayString(semaine), to: toDayString(addDays(semaine, 6)) })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [profilId, semaine]);

  const muscles = data ? [...data.muscles].sort((a, b) => b.series - a.series || a.nom.localeCompare(b.nom, "fr")) : [];
  const max = Math.max(1, ...muscles.map((m) => m.series));
  const fin = addDays(semaine, 6);
  const estSemaineCourante = toDayString(semaine) === toDayString(startOfWeek(new Date()));

  return (
    <section className="card-surface p-5 flex flex-col gap-4" aria-labelledby="muscle-volume-title">
      <div className="flex flex-col gap-1">
        <h2 id="muscle-volume-title" className="text-h3">
          Volume par muscle
        </h2>
        <p className="text-caption text-muted-foreground">Séries réalisées (ou prévues si la séance n'a pas été saisie).</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setSemaine((s) => addDays(s, -7))} aria-label="Semaine précédente" className="st-iconbutton">
          <ChevronLeft />
        </button>
        <span className="text-sm font-bold">
          {formatJour(semaine)} – {formatJour(fin)}
        </span>
        <button
          type="button"
          onClick={() => setSemaine((s) => addDays(s, 7))}
          aria-label="Semaine suivante"
          className="st-iconbutton disabled:opacity-40"
          disabled={estSemaineCourante}
        >
          <ChevronRight />
        </button>
      </div>

      {error && <p className="text-caption text-destructive">{error}</p>}
      {!data && !error && <Loading />}
      {data && (
        <ul className="flex flex-col gap-2.5">
          {muscles.map((m) => (
            <li
              key={m.nom}
              className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3"
              title={`${m.nom} : ${m.series} série${m.series > 1 ? "s" : ""}${m.volume ? `, ${Math.round(m.volume)} kg soulevés` : ""}`}
            >
              <span className={`text-sm truncate ${m.series ? "font-semibold" : "text-muted-foreground"}`}>{m.nom}</span>
              <span className="h-3 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                {m.series > 0 && (
                  <span className="block h-full rounded-full bg-[var(--info)]" style={{ width: `${(m.series / max) * 100}%` }} />
                )}
              </span>
              <span className="text-sm tabular-nums text-right min-w-[4.5rem]">
                {m.series} série{m.series > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MuscleVolume;
