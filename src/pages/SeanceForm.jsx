import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { circuits as circuitsApi, exercices as exercicesApi, profils as profilsApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import Button from "../components/ui/Button";
import Input, { Textarea, Select } from "../components/ui/Input";
import { Loading, ErrorState } from "../components/ui/States";

const TYPES = [
  { value: "FORCE", label: "Force" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "HYPERTROPHIE", label: "Hypertrophie" },
  { value: "FIGURE", label: "Figure" },
];

function emptyExercice() {
  return { exercice: "", description: "", consignes: "", objectif: "", series: "", nbRep: "", duree: "", tempsDeRepos: "" };
}

function exerciceFromApi(ex) {
  return {
    id: ex.id,
    exercice: ex.exercice ?? "",
    description: ex.description ?? "",
    consignes: ex.consignes ?? "",
    objectif: ex.objectif ?? "",
    series: ex.series ?? "",
    nbRep: ex.nbRep ?? "",
    duree: ex.duree ?? "",
    tempsDeRepos: ex.tempsDeRepos ?? "",
  };
}

function exerciceToApi(ex, ordre) {
  return {
    exercice: ex.exercice,
    description: ex.description || undefined,
    consignes: ex.consignes || undefined,
    objectif: ex.objectif || undefined,
    series: ex.series ? Number(ex.series) : undefined,
    nbRep: ex.nbRep ? Number(ex.nbRep) : undefined,
    duree: ex.duree ? Number(ex.duree) : undefined,
    tempsDeRepos: ex.tempsDeRepos ? Number(ex.tempsDeRepos) : undefined,
    ordre,
  };
}

function SeanceForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [type, setType] = useState("FORCE");
  const [niveau, setNiveau] = useState("");
  const [date, setDate] = useState("");
  const [exercices, setExercices] = useState([emptyExercice()]);
  const [originalExerciceIds, setOriginalExerciceIds] = useState([]);
  const [sportifs, setSportifs] = useState([]);
  const [participantIds, setParticipantIds] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    profilsApi.list().then((all) => setSportifs(all.filter((p) => p.role === "USER")));
  }, []);

  useEffect(() => {
    if (!editing) return;
    circuitsApi
      .get(id)
      .then((c) => {
        setNom(c.nom);
        setType(c.type);
        setNiveau(c.niveau ?? "");
        setDate(c.date.slice(0, 10));
        setExercices(c.exercices.map(exerciceFromApi));
        setOriginalExerciceIds(c.exercices.map((ex) => ex.id));
        setParticipantIds(c.personnes.map((p) => p.profilId));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  function updateExercice(i, field, value) {
    setExercices((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)));
  }

  function addExercice() {
    setExercices((prev) => [...prev, emptyExercice()]);
  }

  function removeExercice(i) {
    setExercices((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleParticipant(pid) {
    setParticipantIds((prev) => (prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const validExercices = exercices.filter((ex) => ex.exercice.trim());

      if (editing) {
        await circuitsApi.update(id, { nom, type, niveau: niveau || undefined, date });
        await circuitsApi.setParticipants(id, participantIds);

        const keptIds = new Set(validExercices.filter((ex) => ex.id).map((ex) => ex.id));
        const removedIds = originalExerciceIds.filter((oid) => !keptIds.has(oid));

        await Promise.all([
          ...validExercices.map((ex, i) =>
            ex.id ? exercicesApi.update(ex.id, exerciceToApi(ex, i)) : exercicesApi.create({ ...exerciceToApi(ex, i), circuitId: Number(id) })
          ),
          ...removedIds.map((rid) => exercicesApi.remove(rid)),
        ]);

        navigate(`/seances/${id}`, { replace: true });
      } else {
        const created = await circuitsApi.create({
          nom,
          type,
          niveau: niveau || undefined,
          date,
          auteurId: user.id,
          participantIds,
          exercices: validExercices.map((ex, i) => exerciceToApi(ex, i)),
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
  if (error && editing && !nom) return <ErrorState message={error} />;

  return (
    <div>
      <TopAppBar title={editing ? "Modifier la séance" : "Nouvelle séance"} onBack={true} />

      <form onSubmit={handleSubmit} className="px-5 flex flex-col gap-5 pb-8">
        <Input label="Nom de la séance" placeholder="Renforcement" value={nom} onChange={(e) => setNom(e.target.value)} required />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <Input label="Niveau" placeholder="Intermédiaire" value={niveau} onChange={(e) => setNiveau(e.target.value)} />
        </div>

        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-label text-muted-foreground">Exercices</span>
            <button type="button" onClick={addExercice} className="press flex items-center gap-1 text-sm font-bold" style={{ color: "var(--color-info)" }}>
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {exercices.map((ex, i) => (
              <div key={ex.id ?? `new-${i}`} className="card-surface p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption font-bold text-muted-foreground">Exercice {i + 1}</span>
                  {exercices.length > 1 && (
                    <button type="button" onClick={() => removeExercice(i)} className="press" aria-label="Supprimer">
                      <Trash2 className="w-4 h-4" style={{ color: "var(--color-destructive)" }} />
                    </button>
                  )}
                </div>
                <Input placeholder="Nom (ex: Squat)" value={ex.exercice} onChange={(e) => updateExercice(i, "exercice", e.target.value)} required />
                <Textarea placeholder="Consignes" rows={2} value={ex.consignes} onChange={(e) => updateExercice(i, "consignes", e.target.value)} />
                <Input placeholder="Objectif" value={ex.objectif} onChange={(e) => updateExercice(i, "objectif", e.target.value)} />
                <div className="grid grid-cols-4 gap-2">
                  <Input placeholder="Séries" inputMode="numeric" value={ex.series} onChange={(e) => updateExercice(i, "series", e.target.value)} />
                  <Input placeholder="Reps" inputMode="numeric" value={ex.nbRep} onChange={(e) => updateExercice(i, "nbRep", e.target.value)} />
                  <Input placeholder="Durée(s)" inputMode="numeric" value={ex.duree} onChange={(e) => updateExercice(i, "duree", e.target.value)} />
                  <Input placeholder="Repos(s)" inputMode="numeric" value={ex.tempsDeRepos} onChange={(e) => updateExercice(i, "tempsDeRepos", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="text-label text-muted-foreground">Attribuer à</span>
          <div className="flex flex-col gap-2 mt-3">
            {sportifs.map((s) => (
              <label key={s.id} className="flex items-center gap-3 card-surface px-4 py-3">
                <input type="checkbox" checked={participantIds.includes(s.id)} onChange={() => toggleParticipant(s.id)} className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {s.prenom} {s.nom}
                </span>
              </label>
            ))}
            {sportifs.length === 0 && <p className="text-caption text-muted-foreground">Aucun sportif disponible.</p>}
          </div>
        </div>

        {error && (
          <p className="text-caption text-center" style={{ color: "var(--color-destructive)" }}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : editing ? "Enregistrer les modifications" : "Créer la séance"}
        </Button>
      </form>
    </div>
  );
}

export default SeanceForm;
