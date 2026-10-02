import { useState } from "react";
import { Star, Clock, Repeat, Layers } from "lucide-react";
import { scoreColor } from "../../lib/score";

function Stat({ icon: Icon, value, label }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      <span className="font-semibold text-foreground">{value}</span>
      {label}
    </div>
  );
}

function NoteSlider({ value, onChange }) {
  const v = value ?? 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-label text-muted-foreground">Note</span>
        <span className="text-h2" style={{ color: scoreColor(v * 10) }}>
          {v}/10
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  );
}

function ExerciceCard({ exercice, index, editable = false, grade, onGrade }) {
  const [note, setNote] = useState(grade?.note ?? 0);
  const [commentaire, setCommentaire] = useState(grade?.commentaire ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await onGrade(exercice.id, { note, commentaire });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card-surface p-5 flex flex-col gap-4 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 bg-secondary">
            {index + 1}
          </span>
          <h3 className="text-h3 truncate">{exercice.exercice}</h3>
        </div>
        {!editable && grade?.note !== null && grade?.note !== undefined && (
          <div className="flex items-center gap-1 shrink-0" style={{ color: scoreColor(grade.note * 10) }}>
            <Star className="w-4 h-4 fill-current" />
            <span className="text-h3">{grade.note}/10</span>
          </div>
        )}
      </div>

      {exercice.objectif && (
        <p className="text-caption text-muted-foreground">
          <span className="font-bold">Objectif : </span>
          {exercice.objectif}
        </p>
      )}
      {exercice.description && <p className="text-caption">{exercice.description}</p>}
      {exercice.consignes && (
        <p className="text-caption px-3 py-2 rounded-xl bg-muted">
          <span className="font-bold">Consignes : </span>
          {exercice.consignes}
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <Stat icon={Layers} value={exercice.series} label="séries" />
        <Stat icon={Repeat} value={exercice.nbRep} label="reps" />
        <Stat icon={Clock} value={exercice.duree ? `${exercice.duree}s` : null} label="" />
        <Stat icon={Clock} value={exercice.tempsDeRepos ? `${exercice.tempsDeRepos}s` : null} label="repos" />
      </div>

      {editable ? (
        <div className="flex flex-col gap-3 pt-2 border-t border-border">
          <NoteSlider value={note} onChange={setNote} />
          <textarea
            placeholder="Commentaire (ex: Bonne posture.)"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-input bg-popover px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="press self-end text-sm font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : saved ? "Enregistré" : "Enregistrer"}
          </button>
        </div>
      ) : (
        grade?.commentaire && (
          <p className="text-caption italic text-muted-foreground pt-2 border-t border-border">
            « {grade.commentaire} »
          </p>
        )
      )}
    </div>
  );
}

export default ExerciceCard;
