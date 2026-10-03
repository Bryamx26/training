// Mini-courbe 64×24 : ligne cobalt, points carrés.
function Sparkline({ values = [], max = 10 }) {
  const W = 64;
  const H = 24;
  const pad = 3;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (values.length - 1);
    const y = H - pad - (Math.max(0, Math.min(max, v)) / max) * (H - 2 * pad);
    return [x, y];
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0">
      {pts.length > 1 && (
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--cobalt)" strokeWidth={2} strokeLinejoin="miter" />
      )}
      {pts.map(([x, y], i) => (
        <rect key={i} x={x - 2} y={y - 2} width={4} height={4} fill="var(--cobalt)" />
      ))}
    </svg>
  );
}

export default Sparkline;
