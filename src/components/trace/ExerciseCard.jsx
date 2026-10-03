import { Star } from "lucide-react";
import RatingPicker from "./RatingPicker";

function StatCell({ label, value }) {
  return (
    <div className="st-stat">
      <span className="st-stat-value">{value ?? "—"}</span>
      <span className="t-label">{label}</span>
    </div>
  );
}

function summary(ex) {
  const parts = [];
  if (ex.series || ex.nbRep) parts.push([ex.series, ex.nbRep].filter(Boolean).join(" × "));
  if (ex.duree) parts.push(`${ex.duree}s`);
  if (ex.tempsDeRepos) parts.push(`repos ${ex.tempsDeRepos}s`);
  return parts.join(" · ");
}

// Carte d'exercice Tracé. L'état (note, commentaire, enregistrement) reste
// géré par ExerciceCard, qui choisit le rendu selon le design actif.
function ExerciseCard({ exercice, index, editable, grade, note, setNote, commentaire, setCommentaire, saving, saved, onSave }) {
  const hasGrade = grade?.note !== null && grade?.note !== undefined;

  return (
    <div className="st-card st-exercise animate-rise">
      <div className="st-exercise-head">
        <span className="st-exercise-num">{String(index + 1).padStart(2, "0")}</span>
        <h3 className="t-heading flex-1 min-w-0 truncate">{exercice.exercice}</h3>
        {editable ? (
          <span className="st-exercise-summary">{summary(exercice)}</span>
        ) : (
          hasGrade && (
            <span className="st-exercise-grade">
              <Star /> {grade.note}/10
            </span>
          )
        )}
      </div>

      {(exercice.objectif || exercice.description || exercice.consignes || (!editable && grade?.commentaire)) && (
        <div className="st-exercise-body">
          {exercice.objectif && (
            <div className="flex flex-col gap-1">
              <span className="t-label">Objectif</span>
              <span className="t-mono text-[14px]">{exercice.objectif}</span>
            </div>
          )}
          {exercice.description && <p className="t-body">{exercice.description}</p>}
          {exercice.consignes && (
            <p className="st-consignes">
              <span className="font-bold">Consignes : </span>
              {exercice.consignes}
            </p>
          )}
          {!editable && grade?.commentaire && <p className="t-body t-muted italic">« {grade.commentaire} »</p>}
        </div>
      )}

      {editable && (
        <div className="st-grading">
          <RatingPicker value={note} onChange={setNote} />
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
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="st-button st-button--dark st-button--sm self-end flex items-center justify-center disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : saved ? "Enregistré" : "Enregistrer"}
          </button>
        </div>
      )}

      <div className="st-statgrid">
        <StatCell label="Séries" value={exercice.series || null} />
        <StatCell label="Reps" value={exercice.nbRep || null} />
        <StatCell label="Tempo" value={exercice.duree ? `${exercice.duree}s` : null} />
        <StatCell label="Repos" value={exercice.tempsDeRepos ? `${exercice.tempsDeRepos}s` : null} />
      </div>
    </div>
  );
}

export default ExerciseCard;
