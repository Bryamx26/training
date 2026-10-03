import { useState } from "react";
import { useDesign } from "../../context/DesignContext";
import TraceExerciseCard from "../trace/ExerciseCard";
import ReliefExerciseCard from "../relief/ExerciseCard";

function ExerciceCard({ exercice, index, editable = false, grade, onGrade }) {
  const { design } = useDesign();
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

  const props = {
    exercice,
    index,
    editable,
    grade,
    note,
    setNote,
    commentaire,
    setCommentaire,
    saving,
    saved,
    onSave: handleSave,
  };

  return design === "trace" ? <TraceExerciseCard {...props} /> : <ReliefExerciseCard {...props} />;
}

export default ExerciceCard;
