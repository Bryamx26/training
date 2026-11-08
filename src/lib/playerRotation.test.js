import { describe, it, expect } from "vitest";
import { findNextIndex, initialSeriesLeft, nextState, phaseDuration, plannedSet, totalRounds } from "./playerRotation";

// Rejoue la séance jusqu'à la fin en appuyant sur « Suivant », et renvoie
// l'ordre des phases traversées.
function play(exercices) {
  let state = { index: 0, phase: "exercice", left: initialSeriesLeft(exercices) };
  const trace = [];
  const sets = [];
  while (state.phase !== "fin") {
    trace.push(`${state.phase}:${exercices[state.index].exercice}`);
    state = nextState(exercices, state);
    if (state.finishedSet) sets.push(state.finishedSet);
    if (trace.length > 100) throw new Error("boucle infinie");
  }
  return { trace, sets };
}

describe("rotation du lecteur de séance", () => {
  it("tourne sur les exercices et retire ceux dont les séries sont faites", () => {
    const { trace } = play([
      { exercice: "Pompes", series: 2 },
      { exercice: "Squats", series: 1 },
    ]);
    expect(trace).toEqual(["exercice:Pompes", "exercice:Squats", "exercice:Pompes"]);
  });

  it("intercale le repos de l'exercice terminé, sauf après la dernière série", () => {
    const { trace } = play([
      { exercice: "Pompes", series: 2, tempsDeRepos: 30 },
      { exercice: "Gainage", duree: 45 },
    ]);
    expect(trace).toEqual(["exercice:Pompes", "repos:Pompes", "exercice:Gainage", "exercice:Pompes"]);
  });

  it("numérote les séries réalisées par exercice", () => {
    const { sets } = play([
      { exercice: "A", series: 3 },
      { exercice: "B", series: 1 },
    ]);
    expect(sets).toEqual([
      { index: 0, serie: 1 },
      { index: 1, serie: 1 },
      { index: 0, serie: 2 },
      { index: 0, serie: 3 },
    ]);
  });

  it("compte une série pour un exercice sans séries", () => {
    expect(initialSeriesLeft([{ series: 0 }, { series: null }, { series: 4 }])).toEqual([1, 1, 4]);
    expect(totalRounds([{ series: 0 }, { series: 4 }])).toBe(5);
  });

  it("cherche le prochain exercice en boucle", () => {
    expect(findNextIndex([0, 2, 0], 1)).toBe(1);
    expect(findNextIndex([1, 0, 0], 2)).toBe(0);
    expect(findNextIndex([0, 0], 0)).toBeNull();
  });

  it("ne chronomètre que les phases avec une durée", () => {
    expect(phaseDuration({ duree: 45, tempsDeRepos: 0 }, "exercice")).toBe(45);
    expect(phaseDuration({ duree: 45, tempsDeRepos: 0 }, "repos")).toBeNull();
    expect(phaseDuration({ nbRep: 10 }, "exercice")).toBeNull();
  });

  it("pré-remplit une série avec les valeurs prévues", () => {
    expect(plannedSet({ id: 7, nbRep: 10, lest: 20 }, 2)).toEqual({ exerciceId: 7, serie: 2, reps: 10, lest: 20, duree: null });
  });
});
