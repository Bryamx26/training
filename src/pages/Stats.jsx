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
import { scoreTrend } from "../lib/trend";
import SegmentedControl from "../components/ui/SegmentedControl";

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
          // Séances notées, de la plus ancienne à la plus récente (l'API les
          // renvoie de la plus récente à la plus ancienne).
          const gradees = circuits
            .map((c) => ({ date: c.date, ...computeScoreForProfil(c.exercices, s.id) }))
            .filter((g) => g.graded)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          const moyenne = gradees.length ? gradees.reduce((sum, g) => sum + g.percentage, 0) / gradees.length : 0;
          // Mini-courbe : les 5 séances notées les plus récentes, dans l'ordre chronologique.
          const notes = gradees.slice(-5).map((g) => g.moyenne10);
          return {
            ...s,
            name: `${s.prenom} ${s.nom}`,
            progress: Math.round(moyenne),
            notes,
            points: gradees.map((g) => ({ date: g.date, percentage: g.percentage })),
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
      {/* Tendance du groupe : toutes les séances notées de tous les sportifs. */}
      <MoyenneDiv users={rows} text="moyenne" trend={scoreTrend(rows.flatMap((r) => r.points))} />
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
  const [vue, setVue] = useState("sportifs");

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
