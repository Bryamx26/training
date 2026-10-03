import { useNavigate } from "react-router-dom";
import { computeScoreForProfil } from "../../lib/score";
import { useDesign } from "../../context/DesignContext";
import TraceSessionCard from "../trace/SessionCard";
import ReliefSessionCard from "../relief/SessionCard";

const TYPE_LABEL = {
  FORCE: "Force",
  ENDURANCE: "Endurance",
  HYPERTROPHIE: "Hypertrophie",
  FIGURE: "Figure",
};

function SeanceCard({ circuit, showParticipants = false, profilId = null }) {
  const navigate = useNavigate();
  const { design } = useDesign();
  const personnes = circuit.personnes ?? [];
  // Sans profilId explicite (vue coach multi-participants), on ne peut pas résumer
  // la séance en un seul score : chaque sportif a sa propre note.
  const singleProfilId = profilId ?? (personnes.length === 1 ? personnes[0].profilId : null);
  const score = singleProfilId != null ? computeScoreForProfil(circuit.exercices, singleProfilId) : null;
  const gradedCount = personnes.filter((p) => computeScoreForProfil(circuit.exercices, p.profilId).graded).length;
  const upcoming = new Date(circuit.date) >= new Date(new Date().toDateString());

  const props = {
    circuit,
    typeLabel: TYPE_LABEL[circuit.type] ?? circuit.type,
    personnes,
    showParticipants,
    score,
    gradedCount,
    upcoming,
    onClick: () => navigate(`/seances/${circuit.id}`),
  };

  return design === "trace" ? <TraceSessionCard {...props} /> : <ReliefSessionCard {...props} />;
}

export default SeanceCard;
