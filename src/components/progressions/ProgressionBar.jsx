function ProgressBar({ user }) {
  const progress = Math.max(0, Math.min(user.progress, 100));
  const colorClass =
    progress < 25 ? "bg-destructive" : progress < 50 ? "bg-warning" : progress < 75 ? "bg-progress-mid" : "bg-success";

  return (
    <div>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm font-bold text-foreground">
        <span className="font-[200] text-card-foreground min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {user.name}
        </span>
        <span className="shrink-0">{user.progress / 10}/10</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-[width] duration-300 ease-in-out ${colorClass}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
