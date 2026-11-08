import { describe, it, expect } from "vitest";
import { formatDelta, scoreTrend } from "./trend";

const now = new Date("2026-10-06T12:00:00Z");
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

describe("tendance des scores", () => {
  it("compare les 30 derniers jours aux 30 précédents", () => {
    const trend = scoreTrend(
      [
        { date: daysAgo(2), percentage: 80 },
        { date: daysAgo(10), percentage: 90 },
        { date: daysAgo(40), percentage: 70 },
        { date: daysAgo(50), percentage: 80 },
        { date: daysAgo(90), percentage: 0 }, // hors des deux périodes
        { date: daysAgo(-3), percentage: 0 }, // séance future
      ],
      { now }
    );
    expect(trend).toMatchObject({ current: 85, previous: 75, delta: 10, currentCount: 2, previousCount: 2 });
  });

  it("n'a pas de tendance sans séance sur l'une des périodes", () => {
    expect(scoreTrend([{ date: daysAgo(2), percentage: 80 }], { now })).toBeNull();
    expect(scoreTrend([{ date: daysAgo(40), percentage: 80 }], { now })).toBeNull();
    expect(scoreTrend([], { now })).toBeNull();
  });

  it("formate l'écart en points", () => {
    expect(formatDelta(6.44)).toBe("+6,4 pts");
    expect(formatDelta(-3)).toBe("−3 pts");
    expect(formatDelta(0.02)).toBe("0 pt");
  });
});
