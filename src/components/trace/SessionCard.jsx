import { Users } from "lucide-react";
import DateBlock from "./DateBlock";
import { TypeTag, StatusPill } from "./Tags";

// Carte de séance Tracé. Les valeurs (score, statut) sont calculées par
// SeanceCard, qui choisit le rendu selon le design actif.
function SessionCard({ circuit, typeLabel, personnes, score, gradedCount, upcoming, onClick }) {
  const nbExercices = circuit.exercices?.length ?? 0;

  let status;
  if (score?.graded) {
    status = (
      <span className="t-metric-sm">
        {score.total}/{score.max} · {score.percentage}%
      </span>
    );
  } else if (score === null && personnes.length > 1 && !upcoming) {
    status = <StatusPill tone={gradedCount === personnes.length ? "done" : undefined}>{gradedCount}/{personnes.length} notées</StatusPill>;
  } else if (upcoming) {
    status = <StatusPill tone="cobalt">À venir</StatusPill>;
  } else {
    status = <StatusPill>Non notée</StatusPill>;
  }

  return (
    <button type="button" onClick={onClick} className="st-session animate-rise">
      <DateBlock date={circuit.date} />
      <div className="st-session-body">
        <div className="st-session-line">
          <h3 className="t-heading truncate">{circuit.nom}</h3>
          <TypeTag>{typeLabel}</TypeTag>
        </div>
        {personnes.length > 0 && (
          <div className="st-meta">
            <Users />
            <span className="truncate">{personnes.map((p) => `${p.profil.prenom} ${p.profil.nom}`).join(", ")}</span>
          </div>
        )}
        <div className="st-session-line">
          <span className="t-metric-sm t-muted">
            {nbExercices} exercice{nbExercices > 1 ? "s" : ""}
          </span>
          {status}
        </div>
      </div>
    </button>
  );
}

export default SessionCard;
