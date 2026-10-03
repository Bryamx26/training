// Mini-courbe 56×20 : ligne verte, point final plein.
function Sparkline({ values = [], max = 10 }) {
  const W = 56;
  const H = 20;
  const pad = 4;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (values.length - 1);
    const y = H - pad - (Math.max(0, Math.min(max, v)) / max) * (H - 2 * pad);
    return [x, y];
  });
  const last = pts[pts.length - 1];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0">
      {pts.length > 1 && (
        <polyline
          points={pts.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="var(--progress)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {last && <circle cx={last[0]} cy={last[1]} r={3.5} fill="var(--progress)" />}
    </svg>
  );
}

export default Sparkline;
