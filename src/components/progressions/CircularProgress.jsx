//CircularProgress est un composant qui permet d'afficher une bare de progression en cercle 
//celle-ci accepte ses valeurs:
//value : valeur afficher par la bare de progression insi que dans le cercle 
//text : valeur ou textes affichées en dessous 
// r : radius taille du cercle
// s : traille de la bare de progression
// fS: taille de la variable text 
// color : couleur de la bare de progression (optionnel, défaut = success)
//
function CircularProgress({ value, text, r, s, fS, color }) {
  const radius = r ? r : 60;
  const stroke = s ? s : 12;
  const fontSize = fS ? fS : 28;
  const progressColor = color ? color : "var(--color-success)";
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (value / 100) * circumference;
  return (
    <svg width={radius * 2} height={radius * 2}>
      {/* Cercle de fond */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        stroke="var(--color-muted)"
        strokeWidth={stroke}
        fill="none"
      />
      {/* Cercle de progression */}
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        stroke={progressColor}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${radius} ${radius})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      {/* Pourcentage */}
      <text
        x="55%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="bold"
        fill="var(--color-foreground)"
      >
        {value}%
      </text>
      {/* Texte */}
      <text
        x="50%"
        y="68%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize / 2}
        fill="var(--color-muted-foreground)"
      >
        {text ? text : ""}
      </text>
    </svg>
  );
}
export default CircularProgress;
