import { describe, it, expect } from "vitest";
import { contentSummary, exerciceDraft, exerciceFromApi, exerciceToApi, formatLest, sameName } from "./exerciceForm";

describe("formulaire d'exercice", () => {
  it("crée des brouillons à clé unique, valeurs en chaînes", () => {
    const a = exerciceDraft({ exercice: "Squat", series: 3 });
    const b = exerciceDraft({ exercice: "Squat" });
    expect(a.key).not.toBe(b.key);
    expect(a).toMatchObject({ exercice: "Squat", series: 3, nbRep: "", avecLest: false, muscles: [] });
  });

  it("lit les muscles sous toutes leurs formes", () => {
    expect(exerciceDraft({ muscles: ["Dos"] }).muscles).toEqual(["Dos"]);
    expect(exerciceDraft({ muscles: [{ nom: "Dos" }] }).muscles).toEqual(["Dos"]);
    expect(exerciceDraft({ muscles: [{ muscle: { nom: "Dos" } }] }).muscles).toEqual(["Dos"]);
  });

  it("garde l'id d'un exercice existant", () => {
    expect(exerciceFromApi({ id: 4, exercice: "Dips", lest: 10 })).toMatchObject({ id: 4, avecLest: true });
  });

  it("convertit vers l'API : nombres, lest à virgule, lest retiré = null", () => {
    const ex = { ...exerciceDraft({ exercice: " Squat ", series: "3", lest: "2,5" }) };
    expect(exerciceToApi(ex, 1)).toMatchObject({ exercice: "Squat", series: 3, nbRep: undefined, lest: 2.5, ordre: 1, muscleIds: undefined });
    expect(exerciceToApi({ ...ex, lest: "" }, 0).lest).toBeNull();
  });

  it("envoie les ids des muscles connus quand une table est fournie", () => {
    const ex = exerciceDraft({ exercice: "Tractions", muscles: ["Dos", "Inconnu"] });
    expect(exerciceToApi(ex, 0, new Map([["Dos", 2]])).muscleIds).toEqual([2]);
  });

  it("formate lest, noms et résumés", () => {
    expect(formatLest(2.5)).toBe("2,5 kg");
    expect(formatLest(null)).toBeNull();
    expect(sameName(" Squat", "squat ")).toBe(true);
    expect(contentSummary({ niveau: "Avancé", exercicesCount: 1 })).toBe("Avancé · 1 exercice");
    expect(contentSummary({ exercicesCount: 4 })).toBe("4 exercices");
  });
});
