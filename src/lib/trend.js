const DAY_MS = 24 * 60 * 60 * 1000;

// Tendance des scores : moyenne (en %) des séances notées des `days` derniers
// jours, comparée à celle des `days` jours d'avant. Renvoie null s'il manque
// des séances sur l'une des deux périodes (pas de comparaison possible).
// points = [{ date, percentage }] ; `delta` est en points de pourcentage.
export function scoreTrend(points, { now = new Date(), days = 30 } = {}) {
  const end = now.getTime();
  const middle = end - days * DAY_MS;
  const start = middle - days * DAY_MS;

  const average = (list) => list.reduce((sum, p) => sum + p.percentage, 0) / list.length;
  const at = (p) => new Date(p.date).getTime();
  const current = points.filter((p) => at(p) > middle && at(p) <= end);
  const previous = points.filter((p) => at(p) > start && at(p) <= middle);
  if (current.length === 0 || previous.length === 0) return null;

  const currentAvg = average(current);
  const previousAvg = average(previous);
  return {
    current: currentAvg,
    previous: previousAvg,
    delta: currentAvg - previousAvg,
    currentCount: current.length,
    previousCount: previous.length,
  };
}

// « +6,4 pts », « −3 pts », « 0 pt ».
export function formatDelta(delta) {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return "0 pt";
  const value = Math.abs(rounded).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return `${rounded > 0 ? "+" : "−"}${value} pts`;
}
