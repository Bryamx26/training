
import { LineChart, Line, ResponsiveContainer } from "recharts";

function SportifCard({ initiales, nom, sousTitre, notes = [], moyenne, onClick }) {
  const data = notes.map((note, i) => ({ i, note }));

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",

        background: "var(--color-card)",
        border: "none",
        borderRadius: 38,
        padding: "10px 20px",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",

        boxShadow: "var(--shadow-card)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#111111",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: "0.02em",
        }}
      >
        {initiales}
      </div>

      {/* Nom + sous-titre */}
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 19,

            color: "var(--color-foreground)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {nom}
        </div>
        <div
          style={{
            fontSize: 15,
            color: "#8a8a8a",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {sousTitre}
        </div>
      </div>

      {/* Mini courbe */}
      <div style={{ width: 100, height: 32, flexShrink: 0 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
            <Line
              type="monotone"
              dataKey="note"
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Score */}
      <div
        style={{
          flexShrink: 0,
          fontWeight: 800,
          fontSize: 24,

          color: "var(--color-foreground)",
          minWidth: 52,
          textAlign: "right",
        }}
      >
        {moyenne.toFixed(1)}
      </div>
    </button>
  );
}

export default SportifCard;
