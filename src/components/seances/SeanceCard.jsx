import { useNavigate } from "react-router-dom";
import { Calendar, Users } from "lucide-react";
import { computeScoreForProfil, scoreColor } from "../../lib/score";

const TYPE_LABEL = {
  FORCE: "Force",
  ENDURANCE: "Endurance",
  HYPERTROPHIE: "Hypertrophie",
  FIGURE: "Figure",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function SeanceCard({ circuit, showParticipants = false, profilId = null }) {
  const navigate = useNavigate();
  const personnes = circuit.personnes ?? [];
  // Sans profilId explicite (vue coach multi-participants), on ne peut pas résumer
  // la séance en un seul score : chaque sportif a sa propre note.
  const singleProfilId = profilId ?? (personnes.length === 1 ? personnes[0].profilId : null);
  const score = singleProfilId != null ? computeScoreForProfil(circuit.exercices, singleProfilId) : null;
  const gradedCount = personnes.filter((p) => computeScoreForProfil(circuit.exercices, p.profilId).graded).length;
  const upcoming = new Date(circuit.date) >= new Date(new Date().toDateString());

  return (
    <button
      onClick={() => navigate(`/seances/${circuit.id}`)}
      className="card-surface press w-full text-left p-5 flex flex-col gap-3 animate-rise"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-h2 truncate">{circuit.nom}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-caption text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(circuit.date)}
          </div>
        </div>
        <span className="text-label px-3 py-1.5 rounded-full shrink-0 bg-secondary">
          {TYPE_LABEL[circuit.type] ?? circuit.type}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-caption text-muted-foreground">
          {circuit.exercices?.length ?? 0} exercice{(circuit.exercices?.length ?? 0) > 1 ? "s" : ""}
        </span>

        {score?.graded ? (
          <span className="text-h3" style={{ color: scoreColor(score.percentage) }}>
            {score.total}/{score.max} · {score.percentage}%
          </span>
        ) : score === null && personnes.length > 1 && !upcoming ? (
          <span className={`text-caption font-bold ${gradedCount === personnes.length ? "text-success" : "text-muted-foreground"}`}>
            {gradedCount}/{personnes.length} notées
          </span>
        ) : (
          <span className={`text-caption font-bold ${upcoming ? "text-info" : "text-muted-foreground"}`}>
            {upcoming ? "À venir" : "Non notée"}
          </span>
        )}
      </div>

      {showParticipants && personnes.length > 0 && (
        <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          {personnes.map((p) => `${p.profil.prenom} ${p.profil.nom}`).join(", ")}
        </div>
      )}
    </button>
  );
}

export default SeanceCard;
