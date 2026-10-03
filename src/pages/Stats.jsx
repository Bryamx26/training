import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDesign } from "../context/DesignContext";
import { circuits as circuitsApi, me as meApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import SportifCard from "../components/seances/SportifCard.jsx";
import MoyenneDiv from "../components/container/MoyenneDiv.jsx";
import IndividualStats from "../components/progressions/IndividualStats.jsx";
import { Loading, EmptyState } from "../components/ui/States";
import { computeScoreForProfil } from "../lib/score";
import TraceSegmentedControl from "../components/trace/SegmentedControl";
import ReliefSegmentedControl from "../components/relief/SegmentedControl";

// Un coach peut aussi participer à ses séances : il bascule entre les
// statistiques de ses sportifs et les siennes.
const VUES_COACH = [
  { value: "sportifs", label: "Mes sportifs" },
  { value: "moi", label: "Mes stats" },
];

function StatsUtilisateur({ user }) {
  return <IndividualStats profilId={user.id} />;
}

function StatsAdmin() {
  const navigate = useNavigate();
  const { design } = useDesign();
  const [sportifs, setSportifs] = useState(null);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    meApi.subscribers().then(setSportifs);
  }, []);

  useEffect(() => {
    if (!sportifs) return;
    Promise.all(
      sportifs.map((s) =>
        circuitsApi.list({ profilId: s.id }).then((circuits) => {
          const gradees = circuits.map((c) => computeScoreForProfil(c.exercices, s.id)).filter((s2) => s2.graded);
          const moyenne = gradees.length ? gradees.reduce((sum, g) => sum + g.percentage, 0) / gradees.length : 0;
          const notes = gradees.slice(-5).map((g) => g.moyenne10);
          return {
            ...s,
            name: `${s.prenom} ${s.nom}`,
            progress: Math.round(moyenne),
            notes,
            moyenne10: gradees.length ? gradees.reduce((sum, g) => sum + g.moyenne10, 0) / gradees.length : 0,
          };
        })
      )
    ).then(setRows);
  }, [sportifs]);

  if (!rows) return <Loading />;
  if (rows.length === 0) return <EmptyState title="Aucun sportif" subtitle="Tes sportifs apparaîtront ici dès qu'ils seront abonnés à toi." />;

  const trace = design === "trace";

  return (
    <div className="flex flex-col gap-4">
      <MoyenneDiv users={rows} text="moyenne" />
      {trace ? <span className="t-label mt-2 -mb-2">Par sportif</span> : <span className="rl-label mt-3 -mb-1">Par sportif</span>}
      <div className={trace ? "st-list" : "flex flex-col gap-4"}>
        {rows.map((r) => (
          <SportifCard
            key={r.id}
            initiales={`${r.prenom?.[0] ?? ""}${r.nom?.[0] ?? ""}`.toUpperCase()}
            nom={`${r.prenom} ${r.nom}`}
            sousTitre={r.notes.length ? `${r.notes.length} séances notées` : "Pas encore de séance notée"}
            notes={r.notes.length ? r.notes : [0]}
            moyenne={r.moyenne10}
            onClick={() => navigate(`/admin/sportifs/${r.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function Stats() {
  const { user, isAdmin } = useAuth();
  const { design } = useDesign();
  const [vue, setVue] = useState("sportifs");
  const SegmentedControl = design === "trace" ? TraceSegmentedControl : ReliefSegmentedControl;

  return (
    <div>
      <TopAppBar title="Statistiques" />
      <div className="px-5 pb-8 flex flex-col gap-5">
        {isAdmin && <SegmentedControl options={VUES_COACH} value={vue} onChange={setVue} label="Statistiques affichées" />}
        {isAdmin && vue === "sportifs" ? <StatsAdmin /> : <StatsUtilisateur user={user} />}
      </div>
    </div>
  );
}

export default Stats;
