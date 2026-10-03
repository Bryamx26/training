import { useDesign } from "../../context/DesignContext";
import TraceSparkline from "../trace/Sparkline";
import ReliefSparkline from "../relief/Sparkline";

function SportifCard({ initiales, nom, sousTitre, notes = [], moyenne, onClick }) {
  const { design } = useDesign();

  // En Tracé, la carte devient une ligne de ListGroup (le conteneur est posé par la page).
  if (design === "trace") {
    return (
      <button type="button" onClick={onClick} className="st-row">
        <span className="st-avatar" style={{ width: 44, height: 44 }}>
          {initiales}
        </span>
        <span className="st-row-main">
          <span className="st-row-title">{nom}</span>
          <span className="st-row-sub truncate">{sousTitre}</span>
        </span>
        <TraceSparkline values={notes} />
        <span className="st-row-value min-w-[40px] text-right">{moyenne.toFixed(1)}</span>
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className="rl-row animate-rise">
      <span className="rl-avatar w-11 h-11 text-[14px]">{initiales}</span>
      <span className="rl-row-main">
        <span className="rl-row-title">{nom}</span>
        <span className="text-[12px] leading-4 rl-muted font-semibold truncate">{sousTitre}</span>
      </span>
      <ReliefSparkline values={notes} />
      <span className="rl-row-value">{moyenne.toFixed(1)}</span>
    </button>
  );
}

export default SportifCard;
