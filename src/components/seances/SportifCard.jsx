import { LineChart, Line, ResponsiveContainer } from "recharts";

function SportifCard({ initiales, nom, sousTitre, notes = [], moyenne, onClick }) {
  const data = notes.map((note, i) => ({ i, note }));

  return (
    <button
      onClick={onClick}
      className="press flex items-center gap-2.5 w-full bg-card rounded-[38px] px-5 py-2.5 text-left cursor-pointer shadow-[var(--shadow-card)]"
    >
      <div className="shrink-0 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base tracking-wide">
        {initiales}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-lg text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{nom}</div>
        <div className="text-[15px] text-muted-foreground mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{sousTitre}</div>
      </div>

      <div className="w-[100px] h-8 shrink-0">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
            <Line type="monotone" dataKey="note" stroke="var(--color-success)" strokeWidth={3} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="shrink-0 font-extrabold text-2xl text-foreground min-w-[52px] text-right">{moyenne.toFixed(1)}</div>
    </button>
  );
}

export default SportifCard;
