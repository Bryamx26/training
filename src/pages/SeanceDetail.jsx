import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2, Calendar, Users, Play, Pencil, LayoutTemplate } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDesign } from "../context/DesignContext";
import { circuits as circuitsApi, exercices as exercicesApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import ExerciceCard from "../components/seances/ExerciceCard";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import { Loading, ErrorState } from "../components/ui/States";
import { computeScoreForProfil, noteForProfil } from "../lib/score";
import ScorePanel from "../components/trace/ScorePanel";
import { TypeTag } from "../components/trace/Tags";
import { Tag } from "../components/relief/Tags";
import ScoreRing from "../components/relief/ScoreRing";
import SegmentedControl from "../components/relief/SegmentedControl";
import SaveTemplateSheet from "../components/templates/SaveTemplateSheet";

const TYPE_LABEL = { FORCE: "Force", ENDURANCE: "Endurance", HYPERTROPHIE: "Hypertrophie", FIGURE: "Figure" };

function SeanceDetail() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const { design } = useDesign();
  const trace = design === "trace";
  const navigate = useNavigate();
  const [circuit, setCircuit] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProfilId, setSelectedProfilId] = useState(isAdmin ? null : user.id);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

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
  const typeLabel = TYPE_LABEL[circuit.type] ?? circuit.type;
  const dateLabel = new Date(circuit.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const selected = circuit.personnes?.find((p) => p.profilId === selectedProfilId);
  const nbExercices = circuit.exercices.length;
  // Un coach peut participer à ses propres séances : il se note et la lance comme un sportif.
  const participe = circuit.personnes?.some((p) => p.profilId === user.id);
  const prenomAffiche = (p) => (p.profilId === user.id ? "Moi" : p.profil.prenom);

  return (
    <div>
      <TopAppBar
        title={circuit.nom}
        titleSize="sm"
        onBack={true}
        action={
          isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/seances/${id}/modifier`)}
                className="press flex items-center justify-center w-9 h-9 rounded-full bg-secondary st-iconbutton"
                aria-label="Modifier"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="press flex items-center justify-center w-9 h-9 rounded-full bg-secondary st-iconbutton st-iconbutton--danger"
                aria-label="Supprimer"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          )
        }
      />

      <div className="px-5 flex flex-col gap-5 pb-8">
        {trace ? (
          <div className="flex items-center gap-2 flex-wrap">
            <TypeTag>{typeLabel}</TypeTag>
            {circuit.niveau && <TypeTag>{circuit.niveau}</TypeTag>}
            <span className="st-meta">
              <Calendar />
              <span className="t-mono">{new Date(circuit.date).toLocaleDateString("fr-FR")}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <Tag>{typeLabel}</Tag>
            {circuit.niveau && <Tag>{circuit.niveau}</Tag>}
            <span className="st-meta flex items-center">
              <Calendar />
              {dateLabel}
            </span>
          </div>
        )}

        {trace && isAdmin && circuit.personnes?.length > 1 && (
          <div className="st-athletes -mx-1 px-1 pb-1" role="group" aria-label="Sportif noté">
            {circuit.personnes.map((p) => {
              const active = selectedProfilId === p.profilId;
              return (
                <button
                  key={p.profilId}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedProfilId(p.profilId)}
                  className="st-athlete"
                >
                  <Avatar nom={p.profil.nom} prenom={p.profil.prenom} size={32} highlight={active} />
                  {prenomAffiche(p)}
                </button>
              );
            })}
          </div>
        )}

        {!trace && isAdmin && circuit.personnes?.length > 1 && (
          <SegmentedControl
            label="Sportif noté"
            value={selectedProfilId}
            onChange={setSelectedProfilId}
            options={circuit.personnes.map((p) => ({
              value: p.profilId,
              label: prenomAffiche(p),
              icon: <Avatar nom={p.profil.nom} prenom={p.profil.prenom} size={28} muted={selectedProfilId !== p.profilId} />,
            }))}
          />
        )}

        {isAdmin && circuit.personnes?.length === 0 && (
          <p className="text-caption text-muted-foreground">
            Aucun participant : attribue la séance à tes sportifs (ou à toi-même) pour pouvoir la noter.
          </p>
        )}

        {(!isAdmin || circuit.personnes?.length === 1) && circuit.personnes?.length > 0 && (
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground st-meta">
            <Users className="w-3.5 h-3.5" />
            {circuit.personnes.map((p) => (p.profilId === user.id ? "Moi" : `${p.profil.prenom} ${p.profil.nom}`)).join(", ")}
          </div>
        )}

        {isAdmin && circuit.exercices.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowSaveTemplate(true)} className="self-start">
            <LayoutTemplate className="w-4 h-4" /> Enregistrer comme template
          </Button>
        )}

        {(!isAdmin || participe) && circuit.exercices.length > 0 && (
          <Button
            onClick={() => navigate(`/seances/${id}/lancer`)}
            className="w-full"
            size="lg"
            trailing={`${nbExercices} exercice${nbExercices > 1 ? "s" : ""}`}
          >
            <Play className={trace ? "w-4 h-4" : "w-4 h-4 fill-current"} /> Lancer la séance
          </Button>
        )}

        {trace && score.notesCount > 0 && (
          <ScorePanel
            label={isAdmin && selected ? `Score · ${prenomAffiche(selected)}` : "Score"}
            percentage={score.percentage}
            total={score.total}
            max={score.max}
            moyenne10={score.moyenne10}
          />
        )}

        {trace && <span className="t-label -mb-2">Exercices</span>}

        {!trace && score.notesCount > 0 && (
          <div className="rl-card flex items-center justify-around gap-4 animate-rise">
            <ScoreRing value={score.percentage} caption="score" size={128} />
            <div className="flex flex-col gap-3">
              <div>
                <p className="rl-label">Total</p>
                <p className="rl-metric-sm">
                  {score.total}/{score.max}
                </p>
              </div>
              <div>
                <p className="rl-label">Moyenne</p>
                <p className="rl-metric-sm">{score.moyenne10.toFixed(1)}/10</p>
              </div>
            </div>
          </div>
        )}

        <div className={`flex flex-col ${trace ? "gap-4" : "gap-5"}`}>
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

      {showSaveTemplate && <SaveTemplateSheet circuit={circuit} onClose={() => setShowSaveTemplate(false)} />}
    </div>
  );
}

export default SeanceDetail;
