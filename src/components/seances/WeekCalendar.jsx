import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { circuits as circuitsApi } from "../../lib/api";
import { addDays, startOfWeek, toDayString, typeLabel } from "../../lib/seance";
import { Loading, ErrorState } from "../ui/States";

function formatJour(date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Vue semaine : un jour par ligne (lisible sur mobile), séances du jour en dessous.
// `params` : filtres de GET /circuits (ex. { profilId } pour un sportif).
function WeekCalendar({ params }) {
  const navigate = useNavigate();
  const [semaine, setSemaine] = useState(() => startOfWeek(new Date()));
  const [circuits, setCircuits] = useState(null);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    setCircuits(null);
    setError(null);
    circuitsApi
      .list({ ...JSON.parse(paramsKey), from: toDayString(semaine), to: toDayString(addDays(semaine, 6)) })
      .then(setCircuits)
      .catch((e) => setError(e.message));
  }, [semaine, paramsKey]);

  const today = toDayString(new Date());
  const jours = Array.from({ length: 7 }, (_, i) => addDays(semaine, i));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setSemaine((s) => addDays(s, -7))} aria-label="Semaine précédente" className="st-iconbutton">
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => setSemaine(startOfWeek(new Date()))}
          className="text-sm font-bold"
          title="Revenir à cette semaine"
        >
          {formatJour(jours[0])} – {formatJour(jours[6])}
        </button>
        <button type="button" onClick={() => setSemaine((s) => addDays(s, 7))} aria-label="Semaine suivante" className="st-iconbutton">
          <ChevronRight />
        </button>
      </div>

      {error && <ErrorState message={error} />}
      {!circuits && !error && <Loading />}
      {circuits && (
        <ol className="flex flex-col gap-2">
          {jours.map((jour) => {
            const key = toDayString(jour);
            const duJour = circuits.filter((c) => toDayString(c.date) === key);
            const isToday = key === today;
            return (
              <li key={key} className={`card-surface p-3 flex gap-3 ${isToday ? "ring-2 ring-[var(--info)]" : ""}`}>
                <div className="w-12 shrink-0 flex flex-col items-center">
                  <span className="text-label text-muted-foreground">
                    {jour.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}
                  </span>
                  <span className={`text-h2 tabular-nums ${isToday ? "text-[var(--info)]" : ""}`}>{jour.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-center">
                  {duJour.length === 0 ? (
                    <span className="text-caption text-muted-foreground">Repos</span>
                  ) : (
                    duJour.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => navigate(`/seances/${c.id}`)}
                        className="press text-left rounded-xl bg-secondary px-3 py-2 flex flex-col"
                      >
                        <span className="text-sm font-bold truncate">{c.nom}</span>
                        <span className="text-caption text-muted-foreground truncate">
                          {[
                            typeLabel(c.type),
                            `${c.exercices.length} exercice${c.exercices.length > 1 ? "s" : ""}`,
                            c.personnes.length > 0 && params?.profilId === undefined
                              ? c.personnes.map((p) => p.profil.prenom).join(", ")
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default WeekCalendar;
