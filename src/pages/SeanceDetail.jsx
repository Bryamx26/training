import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2, Calendar, Users, Play, Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { circuits as circuitsApi, exercices as exercicesApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import ExerciceCard from "../components/seances/ExerciceCard";
import CircularProgress from "../components/progressions/CircularProgress";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import { Loading, ErrorState } from "../components/ui/States";
import { computeScoreForProfil, noteForProfil, scoreColor } from "../lib/score";

const TYPE_LABEL = { FORCE: "Force", ENDURANCE: "Endurance", HYPERTROPHIE: "Hypertrophie", FIGURE: "Figure" };

function SeanceDetail() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [circuit, setCircuit] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProfilId, setSelectedProfilId] = useState(isAdmin ? null : user.id);

  const reload = useCallback(() => {
    circuitsApi
      .get(id)
      .then((c) => {
        setCircuit(c);
        if (isAdmin) {
          setSelectedProfilId((prev) => (prev && c.personnes.some((p) => p.profilId === prev) ? prev : c.personnes[0]?.profilId ?? null));
        }
      })
      .catch((e) => setError(e.message));
  }, [id, isAdmin]);

  useEffect(reload, [reload]);

  async function handleGrade(exerciceId, { note, commentaire }) {
    await exercicesApi.grade(exerciceId, selectedProfilId, { note, commentaire });
    reload();
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer définitivement cette séance ?")) return;
    await circuitsApi.remove(id);
    navigate("/seances", { replace: true });
  }

  if (error) return <ErrorState message={error} />;
  if (!circuit) return <Loading />;

  const score = computeScoreForProfil(circuit.exercices, selectedProfilId);

  return (
    <div>
      <TopAppBar
        title={circuit.nom}
        onBack={true}
        action={
          isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/seances/${id}/modifier`)}
                className="press flex items-center justify-center w-9 h-9 rounded-full"
                style={{ background: "var(--color-secondary)" }}
                aria-label="Modifier"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="press flex items-center justify-center w-9 h-9 rounded-full" style={{ background: "var(--color-secondary)" }} aria-label="Supprimer">
                <Trash2 className="w-4 h-4" style={{ color: "var(--color-destructive)" }} />
              </button>
            </div>
          )
        }
      />

      <div className="px-5 flex flex-col gap-5 pb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-label px-3 py-1.5 rounded-full" style={{ background: "var(--color-secondary)" }}>
            {TYPE_LABEL[circuit.type] ?? circuit.type}
          </span>
          {circuit.niveau && (
            <span className="text-label px-3 py-1.5 rounded-full" style={{ background: "var(--color-secondary)" }}>
              {circuit.niveau}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(circuit.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {isAdmin && circuit.personnes?.length > 1 && (
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
            {circuit.personnes.map((p) => {
              const active = selectedProfilId === p.profilId;
              return (
                <button
                  key={p.profilId}
                  type="button"
                  onClick={() => setSelectedProfilId(p.profilId)}
                  className="press shrink-0 flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full"
                  style={{
                    background: active ? "var(--color-primary)" : "var(--color-secondary)",
                    color: active ? "var(--color-primary-foreground)" : "var(--color-foreground)",
                  }}
                >
                  <Avatar nom={p.profil.nom} prenom={p.profil.prenom} size={24} />
                  <span className="text-sm font-bold">{p.profil.prenom}</span>
                </button>
              );
            })}
          </div>
        )}

        {isAdmin && circuit.personnes?.length === 0 && (
          <p className="text-caption text-muted-foreground">
            Aucun sportif attribué à cette séance : attribue-la pour pouvoir la noter.
          </p>
        )}

        {(!isAdmin || circuit.personnes?.length === 1) && circuit.personnes?.length > 0 && (
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {circuit.personnes.map((p) => `${p.profil.prenom} ${p.profil.nom}`).join(", ")}
          </div>
        )}

        {!isAdmin && circuit.exercices.length > 0 && (
          <Button onClick={() => navigate(`/seances/${id}/lancer`)} className="w-full">
            <Play className="w-4 h-4" /> Lancer la séance
          </Button>
        )}

        {score.notesCount > 0 && (
          <div className="card-surface p-5 flex items-center justify-around gap-4 animate-rise">
            <CircularProgress value={score.percentage} text="score" r={56} s={10} fS={22} color={scoreColor(score.percentage)} />
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-label text-muted-foreground">Total</p>
                <p className="text-h1">
                  {score.total}/{score.max}
                </p>
              </div>
              <div>
                <p className="text-label text-muted-foreground">Moyenne</p>
                <p className="text-h1">{score.moyenne10.toFixed(1)}/10</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {circuit.exercices.map((ex, i) => (
            <ExerciceCard
              key={`${ex.id}-${selectedProfilId ?? "none"}`}
              exercice={ex}
              index={i}
              editable={isAdmin && selectedProfilId != null}
              grade={noteForProfil(ex, selectedProfilId)}
              onGrade={handleGrade}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SeanceDetail;
