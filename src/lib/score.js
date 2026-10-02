// Calcul automatique du score d'une séance à partir des notes (/10) de chaque exercice.
export function computeScore(exercices = []) {
  const notes = exercices.map((e) => e.note).filter((n) => n !== null && n !== undefined);

  if (notes.length === 0) {
    return { total: 0, max: 0, percentage: 0, moyenne10: 0, notesCount: 0, graded: false };
  }

  const total = notes.reduce((sum, n) => sum + n, 0);
  const max = notes.length * 10;
  const percentage = Math.round((total / max) * 100);
  const moyenne10 = total / notes.length;

  return {
    total,
    max,
    percentage,
    moyenne10,
    notesCount: notes.length,
    graded: notes.length === exercices.length && exercices.length > 0,
  };
}

// La note d'un exercice pour un participant précis (chaque sportif d'une séance
// de groupe est noté indépendamment des autres).
export function noteForProfil(exercice, profilId) {
  if (profilId === null || profilId === undefined) return null;
  return exercice.notes?.find((n) => n.profilId === profilId) ?? null;
}

// Score d'une séance pour UN participant donné : ne regarde que ses propres notes.
export function computeScoreForProfil(exercices = [], profilId) {
  return computeScore(exercices.map((ex) => ({ note: noteForProfil(ex, profilId)?.note })));
}

// Rouge 0-39%, Orange 40-69%, Vert 70-100%
export function scoreColor(percentage) {
  if (percentage < 40) return "var(--color-destructive)";
  if (percentage < 70) return "var(--color-warning)";
  return "var(--color-success)";
}
