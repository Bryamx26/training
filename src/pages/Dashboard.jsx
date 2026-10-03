import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UserPlus, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDesign } from "../context/DesignContext";
import { circuits as circuitsApi, me as meApi } from "../lib/api";
import SeanceCard from "../components/seances/SeanceCard";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import { Loading } from "../components/ui/States";
import { computeScoreForProfil } from "../lib/score";
import BrandMark from "../components/trace/BrandMark";
import TraceKpiTile from "../components/trace/KpiTile";
import ScorePanel from "../components/trace/ScorePanel";
import ReliefKpiTile from "../components/relief/KpiTile";
import ScoreRing from "../components/relief/ScoreRing";

// En-tête Relief de l'accueil : sur-titre, nom en grand et avatar.
function ReliefGreeting({ label, title, user }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex flex-col gap-1">
        <span className="rl-label">{label}</span>
        <h1 className="rl-display truncate">{title}</h1>
      </div>
      <Avatar nom={user.nom} prenom={user.prenom} size={52} />
    </div>
  );
}

function isUpcoming(circuit) {
  return new Date(circuit.date) >= new Date(new Date().toDateString());
}

function DashboardUtilisateur({ user }) {
  const { design } = useDesign();
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

  if (design === "trace") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="t-label">Bonjour,</span>
          <h1 className="t-display t-display--coach">{user.prenom}</h1>
        </div>

        {prochaine ? (
          <div>
            <p className="t-label mb-2">Prochaine séance</p>
            <SeanceCard circuit={prochaine} profilId={user.id} />
          </div>
        ) : (
          <div className="st-card t-body t-muted text-center">Aucune séance à venir pour le moment.</div>
        )}

        {gradees.length > 0 && (
          <>
            <ScorePanel
              label="Progression"
              percentage={moyennePct}
              figures={[
                { label: "Note moy.", value: `${moyenne10.toFixed(1)}/10` },
                { label: "Séances", value: passees.length },
              ]}
            />

            {derniere && (
              <div>
                <p className="t-label mb-2">Dernière séance réalisée</p>
                <SeanceCard circuit={derniere.circuit} profilId={user.id} />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ReliefGreeting label="Bonjour," title={user.prenom} user={user} />

      {prochaine ? (
        <div>
          <p className="rl-label mb-3">Prochaine séance</p>
          <SeanceCard circuit={prochaine} profilId={user.id} />
        </div>
      ) : (
        <div className="rl-card rl-body rl-muted text-center">Aucune séance à venir pour le moment.</div>
      )}

      {gradees.length > 0 && (
        <>
          <div className="rl-card flex items-center justify-around gap-4 animate-rise">
            <ScoreRing value={moyennePct} caption="progression" size={128} />
            <div className="flex flex-col gap-3">
              <div>
                <p className="rl-label">Note moyenne</p>
                <p className="rl-metric-sm">{moyenne10.toFixed(1)}/10</p>
              </div>
              <div>
                <p className="rl-label">Séances réalisées</p>
                <p className="rl-metric-sm">{passees.length}</p>
              </div>
            </div>
          </div>

          {derniere && (
            <div>
              <p className="rl-label mb-3">Dernière séance réalisée</p>
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
  const { design } = useDesign();
  const [circuits, setCircuits] = useState(null);
  const [sportifs, setSportifs] = useState(null);

  useEffect(() => {
    circuitsApi.list().then(setCircuits);
    meApi.subscribers().then(setSportifs);
  }, []);

  if (!circuits || !sportifs) return <Loading />;

  const aVenir = circuits.filter(isUpcoming);
  // Chaque participant d'une séance est noté indépendamment : on moyenne sur
  // chaque couple (séance, sportif) déjà noté, pas sur les séances seules.
  // Les notes du coach (quand il participe à ses séances) sont exclues : ses
  // stats personnelles sont dans Stats › Mes stats.
  const gradees = circuits
    .flatMap((c) => (c.personnes ?? []).filter((p) => p.profilId !== user.id).map((p) => computeScoreForProfil(c.exercices, p.profilId)))
    .filter((s) => s.graded);
  const moyennePct = gradees.length ? Math.round(gradees.reduce((s, g) => s + g.percentage, 0) / gradees.length) : 0;
  const recents = [...sportifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  if (design === "trace") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <BrandMark />
            <span className="t-label">Tableau de bord</span>
          </div>
          <h1 className="t-display t-display--coach">Coach {user.prenom}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TraceKpiTile label="Sportifs" value={sportifs.length} />
          <TraceKpiTile label="Séances créées" value={circuits.length} />
          <TraceKpiTile label="À venir" value={aVenir.length} tone="cobalt" />
          <TraceKpiTile label="Progression moy." value={`${moyennePct}%`} featured segments={{ filled: moyennePct / 10, total: 10 }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => navigate("/seances/nouvelle")} size="sm" className="px-3">
            <Plus /> Créer une séance
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/utilisateurs")} size="sm" className="px-3">
            <UserPlus /> Ajouter un sportif
          </Button>
        </div>

        <div>
          <div className="st-section-head">
            <span className="t-label">Sportifs récents</span>
            <button type="button" onClick={() => navigate("/admin/utilisateurs")} className="st-link">
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {recents.length === 0 ? (
            <p className="t-body t-muted">Aucun sportif pour le moment.</p>
          ) : (
            <div className="st-list">
              {recents.map((s) => (
                <button key={s.id} type="button" onClick={() => navigate(`/admin/sportifs/${s.id}`)} className="st-row">
                  <Avatar nom={s.nom} prenom={s.prenom} size={40} />
                  <span className="st-row-main">
                    <span className="st-row-title">
                      {s.prenom} {s.nom}
                    </span>
                    {s.mail && <span className="st-row-sub truncate">{s.mail}</span>}
                  </span>
                  <ChevronRight className="st-row-chevron" />
                </button>
              ))}
            </div>
          )}
        </div>

        {aVenir.length > 0 && (
          <div>
            <p className="t-label mb-2">Séances à venir</p>
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

  return (
    <div className="flex flex-col gap-6">
      <ReliefGreeting label="Tableau de bord" title={`Coach ${user.prenom}`} user={user} />

      <div className="grid grid-cols-2 gap-4">
        <ReliefKpiTile label="Sportifs" value={sportifs.length} />
        <ReliefKpiTile label="Séances créées" value={circuits.length} />
        <ReliefKpiTile label="À venir" value={aVenir.length} tone="info" />
        <ReliefKpiTile label="Progression moy." value={`${moyennePct}%`} tone="progress" bar={moyennePct} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => navigate("/seances/nouvelle")} className="px-3">
          <Plus /> Créer une séance
        </Button>
        <Button variant="soft" onClick={() => navigate("/admin/utilisateurs")} className="px-3">
          <UserPlus className="rl-info" /> Ajouter un sportif
        </Button>
      </div>

      <div>
        <div className="rl-section-head">
          <span className="rl-label">Sportifs récents</span>
          <button type="button" onClick={() => navigate("/admin/utilisateurs")} className="rl-link">
            Voir tout <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {recents.map((s) => (
            <button key={s.id} type="button" onClick={() => navigate(`/admin/sportifs/${s.id}`)} className="rl-row">
              <Avatar nom={s.nom} prenom={s.prenom} size={40} />
              <span className="rl-row-main">
                <span className="rl-row-title">
                  {s.prenom} {s.nom}
                </span>
                {s.mail && <span className="text-[12px] leading-4 rl-muted font-semibold truncate">{s.mail}</span>}
              </span>
              <ChevronRight className="rl-row-chevron" />
            </button>
          ))}
          {recents.length === 0 && <p className="rl-body rl-muted">Aucun sportif pour le moment.</p>}
        </div>
      </div>

      {aVenir.length > 0 && (
        <div>
          <p className="rl-label mb-3">Séances à venir</p>
          <div className="flex flex-col gap-4">
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
  const { design } = useDesign();

  return (
    <div>
      <div className={design === "trace" ? "h-6" : "h-7"} />
      <div className="px-5 pb-8">{isAdmin ? <DashboardAdmin user={user} /> : <DashboardUtilisateur user={user} />}</div>
    </div>
  );
}

export default Dashboard;
