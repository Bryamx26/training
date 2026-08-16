//Badge informatif 
//reçois :
//text : texte afficher au centre. 
//title : titre du Badge.
//subtext: texte ou informations ecris en petit.
function Badge({ title, text, subtext, border, width, height, accent }) {
  const btitle = title ? title : "";
  const btext = text ? text : "";
  const bsubtext = subtext ? subtext : "";
  const bborder = border ? border : 25;
  const bwidth = width ? width : 100;
  const bheight = height ? height : 50;

  return (
    <div
      style={{
        borderRadius: `${bborder}px`,
        width: `${bwidth}%`,
        minHeight: `${bheight}px`,
      }}
      className="card-surface p-5 flex flex-col justify-between animate-rise"
    >
      <span className="text-label text-muted-foreground">
        {btitle}
      </span>

      <span
        className="text-display text-card-foreground mt-2"
        style={accent ? { color: accent } : undefined}
      >
        {btext}
      </span>

      {bsubtext && (
        <span className="text-caption text-muted-foreground mt-1">
          {bsubtext ? bsubtext : ""}
        </span>
      )}
    </div>
  )
}
export default Badge
