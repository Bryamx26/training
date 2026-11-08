import { useEffect, useState } from "react";
import { circuits as circuitsApi } from "../../lib/api";
import CourbeDeProgression from "./CourbeDeProgression";
import MuscleVolume from "./MuscleVolume";
import ExerciceProgression from "./ExerciceProgression";
import { Loading, EmptyState } from "../ui/States";
import KpiTile from "../ui/KpiTile";
import { computeScoreForProfil } from "../../lib/score";
import { useDesign } from "../../context/DesignContext";

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

  const seances = gradees.map((g) => ({ date: g.date, note: g.score.moyenne10 }));
  const moyenneGenerale = seances.length ? seances.reduce((s, x) => s + x.note, 0) / seances.length : 0;
  const objectifsAtteints = gradees.filter((g) => g.score.percentage >= 70).length;

  return (
    <div className={`flex flex-col ${design === "trace" ? "gap-4" : "gap-5"}`}>
      {gradees.length === 0 ? (
        <EmptyState title="Pas encore de séance notée" subtitle="La courbe de progression apparaîtra après la première séance notée." />
      ) : (
        <>
          <CourbeDeProgression seances={seances} vueInitiale="mois" />
          <div className={`grid grid-cols-2 ${design === "trace" ? "gap-3" : "gap-4"}`}>
            <KpiTile label="Moyenne générale" value={moyenneGenerale.toFixed(1)} sub={`sur ${seances.length} séance${seances.length > 1 ? "s" : ""}`} />
            <KpiTile
              label="Objectifs atteints"
              value={objectifsAtteints}
              suffix={`/${seances.length}`}
              tone="progress"
              progress={{ value: objectifsAtteints, max: seances.length }}
            />
          </div>
        </>
      )}
      <MuscleVolume profilId={profilId} />
      <ExerciceProgression profilId={profilId} />
    </div>
  );
}

export default IndividualStats;
