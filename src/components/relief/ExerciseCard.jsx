import { Star } from "lucide-react";
import Button from "../ui/Button";
import RatingSlider from "./RatingSlider";
import WeightVestIcon from "../ui/WeightVestIcon";
import { formatLest } from "../../lib/exerciceForm";

function StatTile({ label, value }) {
  return (
    <div className="rl-stat">
      <span className="rl-stat-value">{value ?? "—"}</span>
      <span className="rl-stat-label">{label}</span>
    </div>
  );
}

// « 3 × 6 · objectif 30 » : résumé affiché au coach dans l'en-tête.
function summary(ex) {
  const parts = [];
  if (ex.series || ex.nbRep) parts.push([ex.series, ex.nbRep].filter(Boolean).join(" × "));
  if (ex.objectif) parts.push(`objectif ${ex.objectif}`);
  if (formatLest(ex.lest)) parts.push(`lest ${formatLest(ex.lest)}`);
  return parts.join(" · ");
}

// Carte d'exercice Relief. L'état (note, commentaire, enregistrement) reste
// géré par ExerciceCard, qui choisit le rendu selon le design actif.
function ExerciseCard({ exercice, index, editable, grade, note, setNote, commentaire, setCommentaire, saving, saved, onSave }) {
  const hasGrade = grade?.note !== null && grade?.note !== undefined;

  return (
    <div className="rl-card rl-exercise animate-rise">
      <div className="flex items-center gap-3">
        <span className="rl-inset-disc rl-exercise-num">{index + 1}</span>
        <h3 className="text-[17px] leading-6 font-bold flex-1 min-w-0 truncate">{exercice.exercice}</h3>
        {editable ? (
          <span className="rl-small shrink-0">{summary(exercice)}</span>
        ) : (
          hasGrade && (
            <span className="rl-exercise-grade">
              <Star /> {grade.note}/10
            </span>
          )
        )}
      </div>

      {exercice.objectif && (
        <p className="rl-body">
          <span className="font-bold">Objectif : </span>
          {exercice.objectif}
        </p>
      )}
      {formatLest(exercice.lest) && (
        <p className="rl-body flex items-center gap-2">
          <WeightVestIcon className="w-4 h-4 rl-progress-ink" />
          <span>
            <span className="font-bold">Lest : </span>
            {formatLest(exercice.lest)}
          </span>
        </p>
      )}
      {exercice.description && <p className="rl-body rl-muted">{exercice.description}</p>}
      {exercice.consignes && (
        <p className="rl-consignes">
          <span className="font-bold">Consignes : </span>
          {exercice.consignes}
        </p>
      )}

      {editable ? (
        <div className="rl-grading">
          <RatingSlider value={note} onChange={setNote} />
          <label className="st-field flex flex-col">
            <span className="st-field-label">Commentaire</span>
            <textarea
              placeholder="Ex : Bonne posture."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              className="st-input w-full"
            />
          </label>
          <Button size="sm" onClick={onSave} disabled={saving} className="self-end">
            {saving ? "Enregistrement..." : saved ? "Enregistré" : "Enregistrer"}
          </Button>
        </div>
      ) : (
        <>
          <div className="rl-stats">
            <StatTile label="séries" value={exercice.series || null} />
            <StatTile label="reps" value={exercice.nbRep || null} />
            <StatTile label="tempo" value={exercice.duree ? `${exercice.duree}s` : null} />
            <StatTile label="repos" value={exercice.tempsDeRepos ? `${exercice.tempsDeRepos}s` : null} />
          </div>
          {grade?.commentaire && <p className="rl-body rl-muted italic">« {grade.commentaire} »</p>}
        </>
      )}
    </div>
  );
}

export default ExerciseCard;
