import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LayoutTemplate } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { circuits as circuitsApi, exercices as exercicesApi, me as meApi, muscles as musclesApi, templates as templatesApi } from "../lib/api";
import { exerciceDraft, exerciceFromApi, exerciceToApi } from "../lib/exerciceForm";
import { addDays } from "../lib/seance";
import TopAppBar from "../components/layout/TopAppBar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Loading, ErrorState } from "../components/ui/States";
import SeanceContentFields from "../components/seances/SeanceContentFields";
import TemplatePickerSheet from "../components/templates/TemplatePickerSheet";

const EMPTY_CONTENT = { nom: "", type: "FORCE", niveau: "", exercices: [] };

function SeanceForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  // ?template=ID : création d'une séance à partir d'un template (écran Templates).
  const [searchParams] = useSearchParams();
  const templateId = editing ? null : searchParams.get("template");

  const [contenu, setContenu] = useState(EMPTY_CONTENT);
  const [date, setDate] = useState("");
  const [originalExerciceIds, setOriginalExerciceIds] = useState([]);
  const [abonnes, setAbonnes] = useState([]);
  // Participants déjà inscrits à la séance (édition) : ils restent proposés même
  // s'ils se sont désabonnés depuis, pour ne pas les retirer sans le vouloir.
  const [anciensParticipants, setAnciensParticipants] = useState([]);
  const [participantIds, setParticipantIds] = useState([]);
  const [loading, setLoading] = useState(editing || Boolean(templateId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [muscles, setMuscles] = useState([]);
  // Création uniquement : nombre de semaines (occurrences) si la séance se répète.
  const [repeter, setRepeter] = useState(false);
  const [semaines, setSemaines] = useState("4");
  const [appliedTemplate, setAppliedTemplate] = useState(null);

  // Pré-remplit le contenu (difficulté, type, exercices) depuis un template.
  // Le nom n'est repris que s'il est encore vide ; date et participants restent
  // à choisir. Les exercices sont COPIÉS : la séance ne dépend pas du template.
  const applyTemplate = useCallback((template) => {
    setContenu((c) => ({
      nom: c.nom || template.nom,
      type: template.type ?? c.type,
      niveau: template.niveau ?? "",
      exercices: template.exercices.map(exerciceDraft),
    }));
    setAppliedTemplate(template.nom);
    setShowTemplates(false);
  }, []);

  useEffect(() => {
    meApi.subscribers().then(setAbonnes);
    musclesApi.list().then(setMuscles).catch(() => setMuscles([]));
  }, []);

  useEffect(() => {
    if (!editing) return;
    circuitsApi
      .get(id)
      .then((c) => {
        setContenu({ nom: c.nom, type: c.type, niveau: c.niveau ?? "", exercices: c.exercices.map(exerciceFromApi) });
        setDate(c.date.slice(0, 10));
        setOriginalExerciceIds(c.exercices.map((ex) => ex.id));
        setParticipantIds(c.personnes.map((p) => p.profilId));
        setAnciensParticipants(c.personnes.map((p) => p.profil));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  useEffect(() => {
    if (!templateId) return;
    templatesApi
      .get(templateId)
      .then(applyTemplate)
      .catch((e) => setError(`Template indisponible : ${e.message}`))
      .finally(() => setLoading(false));
  }, [templateId, applyTemplate]);

  // Le coach lui-même (il peut participer à ses séances), ses abonnés actifs,
  // puis les anciens participants qui ne sont plus abonnés.
  const sportifs = [
    { ...user, moi: true },
    ...abonnes,
    ...anciensParticipants
      .filter((p) => p.id !== user.id && !abonnes.some((a) => a.id === p.id))
      .map((p) => ({ ...p, desabonne: true })),
  ];

  function toggleParticipant(pid) {
    setParticipantIds((prev) => (prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { nom, type, exercices } = contenu;
      const muscleIdsByName = new Map(muscles.map((m) => [m.nom, m.id]));
      const niveau = contenu.niveau.trim() || undefined;

      if (editing) {
        await circuitsApi.update(id, { nom, type, niveau, date });
        await circuitsApi.setParticipants(id, participantIds);

        const keptIds = new Set(exercices.filter((ex) => ex.id).map((ex) => ex.id));
        const removedIds = originalExerciceIds.filter((oid) => !keptIds.has(oid));

        await Promise.all([
          ...exercices.map((ex, i) =>
            ex.id
              ? exercicesApi.update(ex.id, exerciceToApi(ex, i, muscleIdsByName))
              : exercicesApi.create({ ...exerciceToApi(ex, i, muscleIdsByName), circuitId: Number(id) })
          ),
          ...removedIds.map((rid) => exercicesApi.remove(rid)),
        ]);

        navigate(`/seances/${id}`, { replace: true });
      } else {
        const created = await circuitsApi.create({
          nom,
          type,
          niveau,
          date,
          participantIds,
          exercices: exercices.map((ex, i) => exerciceToApi(ex, i, muscleIdsByName)),
          repetition: repeter ? { semaines: Number(semaines) } : undefined,
        });
        navigate(`/seances/${created.id}`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (error && editing && !contenu.nom) return <ErrorState message={error} />;

  return (
    <div>
      <TopAppBar
        title={editing ? "Modifier la séance" : "Nouvelle séance"}
        onBack={true}
        action={
          !editing && (
            <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="px-3 py-2">
              <LayoutTemplate className="w-4 h-4" /> Templates
            </Button>
          )
        }
      />

      <form onSubmit={handleSubmit} className="px-5 flex flex-col gap-5 pb-8">
        {appliedTemplate && (
          <p className="text-caption text-muted-foreground" role="status">
            Pré-rempli avec le template « {appliedTemplate} ». Tu peux tout modifier.
          </p>
        )}

        <SeanceContentFields
          value={contenu}
          onChange={setContenu}
          muscles={muscles}
          afterMeta={
            <>
              <Input label={repeter ? "Première séance" : "Date"} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              {!editing && (
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 card-surface px-4 py-3">
                    <input type="checkbox" checked={repeter} onChange={(e) => setRepeter(e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm font-semibold flex-1">Répéter chaque semaine</span>
                  </label>
                  {repeter && (
                    <Input
                      label="Nombre de séances"
                      type="number"
                      min="2"
                      max="52"
                      inputMode="numeric"
                      value={semaines}
                      onChange={(e) => setSemaines(e.target.value)}
                      required
                    />
                  )}
                  {repeter && date && Number(semaines) > 1 && (
                    <p className="text-caption text-muted-foreground" role="status">
                      {semaines} séances, chaque{" "}
                      {new Date(`${date}T00:00`).toLocaleDateString("fr-FR", { weekday: "long" })}, jusqu'au{" "}
                      {addDays(new Date(`${date}T00:00`), (Number(semaines) - 1) * 7).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                      })}
                      .
                    </p>
                  )}
                </div>
              )}
            </>
          }
        />

        <div>
          <span className="text-label text-muted-foreground">Attribuer à</span>
          <div className="flex flex-col gap-2 mt-3">
            {sportifs.map((s) => (
              <label key={s.id} className="flex items-center gap-3 card-surface px-4 py-3">
                <input type="checkbox" checked={participantIds.includes(s.id)} onChange={() => toggleParticipant(s.id)} className="w-4 h-4" />
                <span className="text-sm font-semibold flex-1">
                  {s.moi ? "Moi (je participe aussi)" : `${s.prenom} ${s.nom}`}
                </span>
                {s.desabonne && <span className="text-caption text-muted-foreground">Désabonné</span>}
              </label>
            ))}
            {sportifs.length === 1 && (
              <p className="text-caption text-muted-foreground">
                Aucun abonné pour le moment : seuls les sportifs abonnés à toi peuvent être ajoutés à tes séances.
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-caption text-center text-destructive">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving
            ? "Enregistrement..."
            : editing
              ? "Enregistrer les modifications"
              : repeter && Number(semaines) > 1
                ? `Créer les ${semaines} séances`
                : "Créer la séance"}
        </Button>
      </form>

      {showTemplates && <TemplatePickerSheet onClose={() => setShowTemplates(false)} onSelect={applyTemplate} />}
    </div>
  );
}

export default SeanceForm;
