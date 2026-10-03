import { useEffect, useState } from "react";
import { circuits as circuitsApi } from "../../lib/api";
import CourbeDeProgression from "./CourbeDeProgression";
import { Loading, EmptyState } from "../ui/States";
import { computeScoreForProfil } from "../../lib/score";
import { useDesign } from "../../context/DesignContext";
import TraceKpiTile from "../trace/KpiTile";
import ReliefKpiTile from "../relief/KpiTile";

function toDateOnly(iso) {
  return iso.slice(0, 10);
}

function IndividualStats({ profilId }) {
  const [circuits, setCircuits] = useState(null);
  const { design } = useDesign();

  useEffect(() => {
    setCircuits(null);
    circuitsApi.list({ profilId }).then(setCircuits);
  }, [profilId]);

  if (!circuits) return <Loading />;

  const gradees = circuits
    .map((c) => ({ date: toDateOnly(c.date), score: computeScoreForProfil(c.exercices, profilId) }))
    .filter((c) => c.score.graded);

  if (gradees.length === 0) {
    return <EmptyState title="Pas encore de statistiques" subtitle="Elles apparaîtront après la première séance notée." />;
  }

  const seances = gradees.map((g) => ({ date: g.date, note: g.score.moyenne10 }));
  const moyenneGenerale = seances.reduce((s, x) => s + x.note, 0) / seances.length;
  const objectifsAtteints = gradees.filter((g) => g.score.percentage >= 70).length;

  if (design === "trace") {
    return (
      <div className="flex flex-col gap-4">
        <CourbeDeProgression seances={seances} vueInitiale="mois" />
        <div className="grid grid-cols-2 gap-3">
          <TraceKpiTile
            label="Moyenne générale"
            value={moyenneGenerale.toFixed(1)}
            sub={`sur ${seances.length} séance${seances.length > 1 ? "s" : ""}`}
          />
          <TraceKpiTile
            label="Objectifs atteints"
            value={`${objectifsAtteints}/${seances.length}`}
            featured
            segments={{ filled: objectifsAtteints, total: seances.length }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <CourbeDeProgression seances={seances} vueInitiale="mois" />
      <div className="grid grid-cols-2 gap-4">
        <ReliefKpiTile
          label="Moyenne générale"
          value={moyenneGenerale.toFixed(1)}
          sub={`sur ${seances.length} séance${seances.length > 1 ? "s" : ""}`}
        />
        <ReliefKpiTile
          label="Objectifs atteints"
          value={objectifsAtteints}
          suffix={`/${seances.length}`}
          tone="progress"
          bar={(objectifsAtteints / seances.length) * 100}
        />
      </div>
    </div>
  );
}

export default IndividualStats;
