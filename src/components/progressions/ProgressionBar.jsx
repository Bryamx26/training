function ProgressBar({ user }) {
  const progress = Math.max(0, Math.min(user.progress, 100));
  const color =
    progress < 25 ? "var(--color-destructive)" :  // rouge
      progress < 50 ? "var(--color-warning)" :    // orange
        progress < 75 ? "#BEEB49" :                // jaune olive (pas de token dédié)
          "var(--color-success)";                  // vert

  return (
    <>
      <style>{`
        .progress-container{
          width:100%;
          height:8px;
          background:var(--color-muted);
          border-radius:999px;
          overflow:hidden;
        }
        .progress-bar{
          height:100%;
          border-radius:inherit;
          transition:width .3s ease;
        }
        .progress-text{
          margin-top:8px;
          display:flex;
          justify-content:space-between;
          font-size:14px;
          font-weight:bold;
          color:var(--color-foreground);
        }
        .progress-name{
          font-weight:200;
          color:var(--color-card-foreground);
        }
      `}</style>
      <div>
        <div className="progress-text">
          <span className="progress-name">{user.name}</span>
          <span>{user.progress / 10}/10</span>
        </div>
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{
              width: `${progress}%`,
              background: color,
            }}
          />
        </div>
      </div>
    </>
  );
}
export default ProgressBar
