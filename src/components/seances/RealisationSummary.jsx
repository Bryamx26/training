import { formatLest } from "../../lib/exerciceForm";

// « 10 × 40 kg », « 12 reps », « 0:45 » : une série réalisée.
function formatSet(s) {
  if (s.reps != null && s.lest) return `${s.reps} × ${formatLest(s.lest)}`;
  if (s.reps != null) return `${s.reps} reps`;
  if (s.lest) return formatLest(s.lest);
  if (s.duree) return `${Math.floor(s.duree / 60)}:${String(s.duree % 60).padStart(2, "0")}`;
  return "faite";
}

// Ce que le sportif a réellement fait lors de la séance (saisi dans le lecteur).
function RealisationSummary({ realisation, exercices, titre = "Réalisé" }) {
  const parExercice = exercices
    .map((ex) => ({ ex, series: realisation.series.filter((s) => s.exerciceId === ex.id) }))
    .filter((g) => g.series.length > 0);

  return (
    <section className="card-surface p-4 flex flex-col gap-3" aria-label={titre}>
      <h2 className="text-h3">{titre}</h2>
      {parExercice.length === 0 ? (
        <p className="text-caption text-muted-foreground">Séance terminée, sans détail des séries.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {parExercice.map(({ ex, series }) => (
            <li key={ex.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold truncate">{ex.exercice}</span>
              <span className="text-muted-foreground tabular-nums text-right">{series.map(formatSet).join(" · ")}</span>
            </li>
          ))}
        </ul>
      )}
      {realisation.commentaire && <p className="text-caption text-muted-foreground italic">« {realisation.commentaire} »</p>}
    </section>
  );
}

export default RealisationSummary;
