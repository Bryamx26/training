import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UserPlus, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { circuits as circuitsApi, profils as profilsApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import SeanceCard from "../components/seances/SeanceCard";
import Badge from "../components/seances/Badge.jsx";
import CircularProgress from "../components/progressions/CircularProgress";
import Avatar from "../components/ui/Avatar";
import { Loading } from "../components/ui/States";
import { computeScoreForProfil, scoreColor } from "../lib/score";

function isUpcoming(circuit) {
  return new Date(circuit.date) >= new Date(new Date().toDateString());
}

function DashboardUtilisateur({ user }) {
  const [circuits, setCircuits] = useState(null);

  useEffect(() => {
    circuitsApi.list({ profilId: user.id }).then(setCircuits);
  }, [user.id]);

  if (!circuits) return <Loading />;

  const prochaine = [...circuits].filter(isUpcoming).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const passees = [...circuits].filter((c) => !isUpcoming(c)).sort((a, b) => new Date(b.date) - new Date(a.date));
  const gradees = passees.map((c) => ({ circuit: c, score: computeScoreForProfil(c.exercices, user.id) })).filter((x) => x.score.graded);

  const moyennePct = gradees.length ? Math.round(gradees.reduce((s, g) => s + g.score.percentage, 0) / gradees.length) : 0;
  const moyenne10 = gradees.length ? gradees.reduce((s, g) => s + g.score.moyenne10, 0) / gradees.length : 0;
  const derniere = gradees[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted-foreground">Bonjour,</p>
        <h1 className="text-display">{user.prenom}</h1>
      </div>

      {prochaine ? (
        <div>
          <p className="text-label text-muted-foreground mb-2">Prochaine séance</p>
          <SeanceCard circuit={prochaine} profilId={user.id} />
        </div>
      ) : (
        <div className="card-surface p-5 text-center text-caption text-muted-foreground">Aucune séance à venir pour le moment.</div>
      )}

      {gradees.length > 0 && (
        <>
          <div className="card-surface p-5 flex items-center justify-around gap-4">
            <CircularProgress value={moyennePct} text="progression" r={56} s={10} fS={22} color={scoreColor(moyennePct)} />
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-label text-muted-foreground">Note moyenne</p>
                <p className="text-h1">{moyenne10.toFixed(1)}/10</p>
              </div>
              <div>
                <p className="text-label text-muted-foreground">Séances réalisées</p>
                <p className="text-h1">{passees.length}</p>
              </div>
            </div>
          </div>

          {derniere && (
            <div>
              <p className="text-label text-muted-foreground mb-2">Dernière séance réalisée</p>
              <SeanceCard circuit={derniere.circuit} profilId={user.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DashboardAdmin({ user }) {
  const navigate = useNavigate();
  const [circuits, setCircuits] = useState(null);
  const [sportifs, setSportifs] = useState(null);

  useEffect(() => {
    circuitsApi.list().then(setCircuits);
    profilsApi.list().then((all) => setSportifs(all.filter((p) => p.role === "USER")));
  }, []);

  if (!circuits || !sportifs) return <Loading />;

  const aVenir = circuits.filter(isUpcoming);
  // Chaque participant d'une séance est noté indépendamment : on moyenne sur
  // chaque couple (séance, sportif) déjà noté, pas sur les séances seules.
  const gradees = circuits
    .flatMap((c) => (c.personnes ?? []).map((p) => computeScoreForProfil(c.exercices, p.profilId)))
    .filter((s) => s.graded);
  const moyennePct = gradees.length ? Math.round(gradees.reduce((s, g) => s + g.percentage, 0) / gradees.length) : 0;
  const recents = [...sportifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-caption text-muted-foreground">Tableau de bord</p>
        <h1 className="text-display">Coach {user.prenom}</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Badge title="SPORTIFS" text={String(sportifs.length)} />
        <Badge title="SÉANCES CRÉÉES" text={String(circuits.length)} />
        <Badge title="À VENIR" text={String(aVenir.length)} accent="var(--color-info)" />
        <Badge title="PROGRESSION MOY." text={`${moyennePct}%`} accent={scoreColor(moyennePct)} />
      </div>

      <div className="flex gap-3">
        <button onClick={() => navigate("/seances/nouvelle")} className="card-surface press flex-1 flex flex-col items-center gap-2 p-4">
          <Plus className="w-5 h-5 text-success" />
          <span className="text-caption font-bold">Créer une séance</span>
        </button>
        <button onClick={() => navigate("/admin/utilisateurs")} className="card-surface press flex-1 flex flex-col items-center gap-2 p-4">
          <UserPlus className="w-5 h-5 text-info" />
          <span className="text-caption font-bold">Ajouter un sportif</span>
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-label text-muted-foreground">Sportifs récents</p>
          <button onClick={() => navigate("/admin/utilisateurs")} className="flex items-center text-caption font-bold text-info">
            Voir tout <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {recents.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => navigate(`/admin/sportifs/${s.id}`)}
              className="card-surface press flex items-center gap-3 p-3 text-left"
            >
              <Avatar nom={s.nom} prenom={s.prenom} size={40} />
              <span className="text-sm font-bold flex-1">
                {s.prenom} {s.nom}
              </span>
            </button>
          ))}
          {recents.length === 0 && <p className="text-caption text-muted-foreground">Aucun sportif pour le moment.</p>}
        </div>
      </div>

      {aVenir.length > 0 && (
        <div>
          <p className="text-label text-muted-foreground mb-2">Séances à venir</p>
          <div className="flex flex-col gap-3">
            {aVenir.slice(0, 3).map((c) => (
              <SeanceCard key={c.id} circuit={c} showParticipants />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { user, isAdmin } = useAuth();

  return (
    <div>
      <TopAppBar title="Sport Track" />
      <div className="px-5 pb-8">{isAdmin ? <DashboardAdmin user={user} /> : <DashboardUtilisateur user={user} />}</div>
    </div>
  );
}

export default Dashboard;
