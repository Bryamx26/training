// Logique du lecteur de séance, sans React (testée dans playerRotation.test.js).
//
// Chaque exercice a ses propres séries restantes : la séance tourne en
// rotation sur tous les exercices, et un exercice sort de la rotation une
// fois ses séries épuisées (ex: pompes 2 séries, squats 1 série -> pompes,
// squats, pompes, terminé).

// Nombre de passages de chaque exercice (au moins un).
export function roundsOf(exercice) {
  return exercice.series > 0 ? exercice.series : 1;
}

export function initialSeriesLeft(exercices) {
  return exercices.map(roundsOf);
}

export function totalRounds(exercices) {
  return exercices.reduce((sum, ex) => sum + roundsOf(ex), 0);
}

// Prochain exercice ayant encore des séries, après `afterIndex` (en boucle), ou null.
export function findNextIndex(left, afterIndex) {
  for (let step = 1; step <= left.length; step++) {
    const idx = (afterIndex + step) % left.length;
    if (left[idx] > 0) return idx;
  }
  return null;
}

// Durée (en secondes) d'une phase, ou null si elle n'est pas chronométrée.
export function phaseDuration(exercice, phase) {
  const secs = phase === "repos" ? exercice.tempsDeRepos : exercice.duree;
  return secs > 0 ? secs : null;
}

// État suivant après « Suivant » (fin d'une série ou d'un repos).
// state = { index, phase: "exercice" | "repos" | "fin", left }
// Renvoie aussi `finishedSet` ({ index, serie }) quand une série vient d'être faite.
export function nextState(exercices, { index, phase, left }) {
  if (phase === "repos") {
    return { index: findNextIndex(left, index), phase: "exercice", left, finishedSet: null };
  }

  const nextLeft = [...left];
  nextLeft[index] = Math.max(0, nextLeft[index] - 1);
  const finishedSet = { index, serie: roundsOf(exercices[index]) - nextLeft[index] };

  if (!nextLeft.some((n) => n > 0)) return { index, phase: "fin", left: nextLeft, finishedSet };
  if (exercices[index].tempsDeRepos > 0) return { index, phase: "repos", left: nextLeft, finishedSet };
  return { index: findNextIndex(nextLeft, index), phase: "exercice", left: nextLeft, finishedSet };
}

// Série saisie par défaut : les valeurs prévues par le coach.
export function plannedSet(exercice, serie) {
  return {
    exerciceId: exercice.id,
    serie,
    reps: exercice.nbRep ?? null,
    lest: exercice.lest ?? null,
    duree: exercice.duree ?? null,
  };
}
