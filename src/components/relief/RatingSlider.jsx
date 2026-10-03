// Note /10 du coach : un vrai <input type="range"> (clavier, lecteurs d'écran),
// stylé avec une piste creusée et un curseur en relief.
function RatingSlider({ value, onChange }) {
  const v = value ?? 0;
  // Le remplissage (décalé de 3px dans la piste) s'arrête au centre du curseur,
  // qui fait 28px de large : 14px - 3px = 11px à la note 0.
  const fillWidth = `calc(${v / 10} * (100% - 28px) + 11px)`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="rl-label">Note</span>
        <span className="text-[24px] leading-[28px] font-extrabold rl-progress-ink">{v}/10</span>
      </div>
      <div className="rl-slider">
        <div className="rl-slider-track">
          <div className="rl-slider-fill" style={{ width: fillWidth }} />
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Note sur 10"
        />
      </div>
    </div>
  );
}

export default RatingSlider;
