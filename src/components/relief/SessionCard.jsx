import { Calendar, Users } from "lucide-react";
import { Tag, StatusPill } from "./Tags";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// Carte de séance Relief. Les valeurs (score, statut) sont calculées par
// SeanceCard, qui choisit le rendu selon le design actif.
function SessionCard({ circuit, typeLabel, personnes, showParticipants, score, gradedCount, upcoming, onClick }) {
  const nbExercices = circuit.exercices?.length ?? 0;

  let status;
  if (score?.graded) {
    status = (
      <StatusPill tone="done">
        {score.total}/{score.max} · {score.percentage}%
      </StatusPill>
    );
  } else if (score === null && personnes.length > 1 && !upcoming) {
    status = <StatusPill tone={gradedCount === personnes.length ? "done" : undefined}>{gradedCount}/{personnes.length} notées</StatusPill>;
  } else if (upcoming) {
    status = <StatusPill tone="info">À venir</StatusPill>;
  } else {
    status = <StatusPill>Non notée</StatusPill>;
  }

  return (
    <button type="button" onClick={onClick} className="rl-tile rl-session animate-rise">
      <div className="rl-line">
        <h3 className="text-[18px] leading-6 font-bold truncate">{circuit.nom}</h3>
        <Tag>{typeLabel}</Tag>
      </div>
      <div className="st-meta flex items-center">
        <Calendar />
        {formatDate(circuit.date)}
      </div>
      {showParticipants && personnes.length > 0 && (
        <div className="st-meta flex items-center min-w-0">
          <Users className="shrink-0" />
          <span className="truncate">{personnes.map((p) => `${p.profil.prenom} ${p.profil.nom}`).join(", ")}</span>
        </div>
      )}
      <div className="rl-line">
        <span className="rl-small">
          {nbExercices} exercice{nbExercices > 1 ? "s" : ""}
        </span>
        {status}
      </div>
    </button>
  );
}

export default SessionCard;
