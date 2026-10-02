import { useEffect, useState } from "react";
import { circuits as circuitsApi } from "../../lib/api";
import CourbeDeProgression from "./CourbeDeProgression";
import Badge from "../seances/Badge";
import { Loading, EmptyState } from "../ui/States";
import { computeScoreForProfil } from "../../lib/score";

function toDateOnly(iso) {
  return iso.slice(0, 10);
}

function IndividualStats({ profilId }) {
  const [circuits, setCircuits] = useState(null);

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

  return (
    <div className="flex flex-col gap-5">
      <CourbeDeProgression seances={seances} vueInitiale="mois" />
      <div className="grid grid-cols-2 gap-4">
        <Badge title="MOYENNE GÉNÉRALE" text={moyenneGenerale.toFixed(1)} subtext={`sur ${seances.length} séances`} />
        <Badge title="OBJECTIFS ATTEINTS" text={String(objectifsAtteints)} subtext={`sur ${seances.length}`} accent="var(--color-success)" />
      </div>
    </div>
  );
}

export default IndividualStats;
