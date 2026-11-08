import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import ProgressRow from "../trace/ProgressRow";
import ScoreRing from "../relief/ScoreRing";
import ProgressBar from "../relief/ProgressBar";
import TrendBadge from "../relief/TrendBadge";
import { useDesign } from "../../context/DesignContext";
import { formatDelta } from "../../lib/trend";

// Sens de la tendance, avec une zone neutre de ±0,5 point.
function directionOf(trend) {
  if (trend.delta >= 0.5) return "up";
  if (trend.delta <= -0.5) return "down";
  return "flat";
}

// Infobulle et libellé accessible : ce que compare la tendance.
function describe(trend) {
  return `${Math.round(trend.current)} % sur les 30 derniers jours (${trend.currentCount} séance${trend.currentCount > 1 ? "s" : ""} notée${trend.currentCount > 1 ? "s" : ""}) contre ${Math.round(trend.previous)} % sur les 30 jours précédents (${trend.previousCount})`;
}

// `trend` : résultat de scoreTrend (lib/trend.js), ou null sans données suffisantes.
function MoyenneDiv({ users, text, trend }) {
  const total = users.reduce((acc, user) => acc + user.progress, 0);
  const moyenne = users.length > 0 ? total / users.length : 0;
  const { design } = useDesign();

  if (design === "trace") {
    return (
      <div className="st-slab flex flex-col gap-5 animate-rise">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="t-label">Progression moyenne</span>
            <span className="t-heading">Groupe entier</span>
          </div>
          {trend ? (
            <span
              className="t-mono inline-flex items-center gap-1 text-[13px] font-semibold"
              style={{ color: { up: "var(--volt)", down: "var(--signal)", flat: "var(--on-slab-muted)" }[directionOf(trend)] }}
              title={describe(trend)}
              aria-label={`Tendance ${formatDelta(trend.delta)} : ${describe(trend)}`}
            >
              {{ up: <TrendingUp className="w-3.5 h-3.5" />, down: <TrendingDown className="w-3.5 h-3.5" />, flat: <Minus className="w-3.5 h-3.5" /> }[directionOf(trend)]}
              {formatDelta(trend.delta)}
            </span>
          ) : (
            <span className="t-mono text-[12px]" style={{ color: "var(--on-slab-muted)" }} title="Il faut des séances notées sur les 30 derniers jours et sur les 30 jours précédents.">
              Tendance : pas assez de données
            </span>
          )}
        </div>
        <span className="t-metric-xl t-metric-xl--lg st-volt-text">{Math.round(moyenne)}%</span>
        <div className="flex flex-col gap-3">
          {users.map((user) => (
            <ProgressRow key={user.id} name={user.name} value={user.progress} display={`${user.progress / 10}/10`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rl-card flex flex-col gap-5 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="rl-label">Progression moyenne</span>
          <h2 className="text-[20px] leading-7 font-extrabold">Groupe entier</h2>
        </div>
        {trend ? (
          <TrendBadge direction={directionOf(trend)} title={describe(trend)} aria-label={`Tendance ${formatDelta(trend.delta)} : ${describe(trend)}`}>
            {formatDelta(trend.delta)}
          </TrendBadge>
        ) : (
          <span className="text-caption text-muted-foreground text-right max-w-[9rem]" title="Il faut des séances notées sur les 30 derniers jours et sur les 30 jours précédents.">
            Tendance : pas assez de données
          </span>
        )}
      </div>
      <div className="flex items-center gap-5 flex-wrap">
        <ScoreRing value={Math.round(moyenne)} caption={text} size={128} />
        <div className="flex-1 basis-40 min-w-0 flex flex-col gap-3">
          {users.map((user) => (
            <ProgressBar key={user.id} value={user.progress} name={user.name} display={`${user.progress / 10}/10`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MoyenneDiv;
