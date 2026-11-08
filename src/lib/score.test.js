import { describe, it, expect } from "vitest";
import { computeScore, computeScoreForProfil, noteForProfil } from "./score";

describe("computeScore", () => {
  it("renvoie un score vide sans note", () => {
    expect(computeScore([{ note: null }, {}])).toEqual({ total: 0, max: 0, percentage: 0, moyenne10: 0, notesCount: 0, graded: false });
  });

  it("calcule total, pourcentage et moyenne", () => {
    const score = computeScore([{ note: 8 }, { note: 10 }, { note: 6 }]);
    expect(score).toMatchObject({ total: 24, max: 30, percentage: 80, moyenne10: 8, notesCount: 3, graded: true });
  });

  it("n'est pas « notée » tant qu'un exercice manque", () => {
    expect(computeScore([{ note: 8 }, { note: null }]).graded).toBe(false);
  });

  it("une note de 0 compte", () => {
    expect(computeScore([{ note: 0 }]).graded).toBe(true);
  });
});

describe("notes par participant", () => {
  const exercices = [
    { notes: [{ profilId: 1, note: 9 }, { profilId: 2, note: 4 }] },
    { notes: [{ profilId: 1, note: 7 }] },
  ];

  it("ne lit que la note du participant demandé", () => {
    expect(noteForProfil(exercices[0], 2).note).toBe(4);
    expect(noteForProfil(exercices[1], 2)).toBeNull();
    expect(noteForProfil(exercices[0], null)).toBeNull();
  });

  it("calcule le score d'un seul participant", () => {
    expect(computeScoreForProfil(exercices, 1)).toMatchObject({ total: 16, graded: true });
    expect(computeScoreForProfil(exercices, 2)).toMatchObject({ total: 4, graded: false });
  });
});
