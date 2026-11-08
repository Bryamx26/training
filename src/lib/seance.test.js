import { describe, it, expect } from "vitest";
import { addDays, isUpcoming, startOfWeek, toDayString, typeLabel } from "./seance";

describe("dates de séance", () => {
  it("une séance d'aujourd'hui est à venir, celle d'hier non", () => {
    const today = new Date();
    today.setHours(0, 0, 1, 0);
    expect(isUpcoming({ date: today.toISOString() })).toBe(true);
    expect(isUpcoming({ date: addDays(today, -1).toISOString() })).toBe(false);
  });

  it("cale une semaine sur le lundi", () => {
    expect(toDayString(startOfWeek(new Date(2026, 9, 6)))).toBe("2026-10-05"); // mardi -> lundi
    expect(toDayString(startOfWeek(new Date(2026, 9, 11)))).toBe("2026-10-05"); // dimanche -> lundi précédent
    expect(toDayString(startOfWeek(new Date(2026, 9, 5)))).toBe("2026-10-05");
  });

  it("libellé du type", () => {
    expect(typeLabel("FORCE")).toBe("Force");
    expect(typeLabel("AUTRE")).toBe("AUTRE");
  });
});
