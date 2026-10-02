import { TrendingUp } from "lucide-react";
import CircularProgress from "../progressions/CircularProgress";
import ProgressBar from "../progressions/ProgressionBar";

function MoyenneDiv({ users, text }) {
  const total = users.reduce((acc, user) => acc + user.progress, 0);
  const moyenne = users.length > 0 ? total / users.length : 0;

  return (
    <div className="bg-card rounded-[25px] p-6 shadow-[var(--shadow-card)] w-full max-w-[420px] mx-auto">
      <div className="flex items-center justify-between mb-[25px]">
        <div>
          <p className="text-label text-muted-foreground">Progression moyenne</p>
          <h2 className="text-display text-card-foreground">Groupe entier</h2>
        </div>
        <span className="text-success inline-flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> +6,4%
        </span>
      </div>
      <div className="flex items-center justify-evenly gap-5 flex-wrap">
        <CircularProgress value={Math.round(moyenne)} text={text} r={65} />
        <div className="flex-1 basis-40 w-[clamp(160px,40vw,210px)] min-w-0 flex flex-col">
          {users.slice(0, 3).map((user) => (
            <ProgressBar user={user} key={user.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MoyenneDiv;
