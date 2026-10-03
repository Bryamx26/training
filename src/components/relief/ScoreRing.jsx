// Anneau de score Relief : disque en relief, arc de progression et centre creusé.
function ScoreRing({ value, caption = "score", size = 128 }) {
  const pct = Math.max(0, Math.min(100, value));
  const stroke = size * 0.08;
  const radius = (size - stroke) / 2 - size * 0.06;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="rl-ring" style={{ width: size, height: size }} role="img" aria-label={`${caption} : ${pct}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--progress-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--progress)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
        />
      </svg>
      <div className="rl-inset-disc rl-ring-center">
        <span className="rl-ring-value">{pct}%</span>
        <span className="rl-ring-caption">{caption}</span>
      </div>
    </div>
  );
}

export default ScoreRing;
