import { TrendingUp } from "lucide-react";
import ProgressRow from "../trace/ProgressRow";
import ScoreRing from "../relief/ScoreRing";
import ProgressBar from "../relief/ProgressBar";
import TrendBadge from "../relief/TrendBadge";
import { useDesign } from "../../context/DesignContext";

function MoyenneDiv({ users, text }) {
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
          <span className="st-volt-text t-mono inline-flex items-center gap-1 text-[13px] font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> +6,4%
          </span>
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
        <TrendBadge>+6,4%</TrendBadge>
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
