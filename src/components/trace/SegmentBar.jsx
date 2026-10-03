// Barre de progression segmentée : `filled` segments pleins sur `total`.
function SegmentBar({ filled, total = 10, className = "" }) {
  const n = Math.max(0, Math.min(total, Math.round(filled)));
  return (
    <div
      className={`st-segbar ${className}`}
      style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}
      role="img"
      aria-label={`${n} sur ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < n ? "is-filled" : undefined} />
      ))}
    </div>
  );
}

export default SegmentBar;
