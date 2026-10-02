import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { circuits as circuitsApi, profils as profilsApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import SportifCard from "../components/seances/SportifCard.jsx";
import MoyenneDiv from "../components/container/MoyenneDiv.jsx";
import IndividualStats from "../components/progressions/IndividualStats.jsx";
import { Loading, EmptyState } from "../components/ui/States";
import { computeScoreForProfil } from "../lib/score";

function StatsUtilisateur({ user }) {
  return <IndividualStats profilId={user.id} />;
}

function StatsAdmin() {
  const navigate = useNavigate();
  const [sportifs, setSportifs] = useState(null);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    profilsApi.list().then((all) => setSportifs(all.filter((p) => p.role === "USER")));
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
  if (rows.length === 0) return <EmptyState title="Aucun sportif" subtitle="Crée des comptes utilisateurs pour suivre leur progression." />;

  return (
    <div className="flex flex-col gap-4">
      <MoyenneDiv users={rows} text="moyenne" />
      <div className="flex flex-col gap-3">
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

  return (
    <div>
      <TopAppBar title="Statistiques" />
      <div className="px-5 pb-8">{isAdmin ? <StatsAdmin /> : <StatsUtilisateur user={user} />}</div>
    </div>
  );
}

export default Stats;
