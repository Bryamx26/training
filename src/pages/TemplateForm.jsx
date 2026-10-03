import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { templates as templatesApi } from "../lib/api";
import { exerciceDraft, exerciceToApi } from "../lib/exerciceForm";
import TopAppBar from "../components/layout/TopAppBar";
import Button from "../components/ui/Button";
import { Loading, ErrorState } from "../components/ui/States";
import SeanceContentFields from "../components/seances/SeanceContentFields";

const EMPTY_CONTENT = { nom: "", type: "FORCE", niveau: "", exercices: [] };

// Création / modification d'un template : même formulaire que la séance, sans
// date ni participants. Modifier un template ne change pas les séances déjà créées.
function TemplateForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [contenu, setContenu] = useState(EMPTY_CONTENT);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!editing) return;
    templatesApi
      .get(id)
      .then((t) => setContenu({ nom: t.nom, type: t.type ?? "FORCE", niveau: t.niveau ?? "", exercices: t.exercices.map(exerciceDraft) }))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (contenu.exercices.length === 0) return setError("Ajoute au moins un exercice au template.");
    setSaving(true);
    setError(null);
    try {
      const payload = {
        nom: contenu.nom.trim(),
        type: contenu.type,
        niveau: contenu.niveau.trim() || null,
        exercices: contenu.exercices.map((ex, i) => exerciceToApi(ex, i)),
      };
      const saved = editing ? await templatesApi.update(id, payload) : await templatesApi.create(payload);
      navigate("/templates", { replace: true, state: { flash: `Template « ${saved.nom} » enregistré.` } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div>
      <TopAppBar title={editing ? "Modifier le template" : "Nouveau template"} onBack={true} />

      <form onSubmit={handleSubmit} className="px-5 flex flex-col gap-5 pb-8">
        <SeanceContentFields value={contenu} onChange={setContenu} nameLabel="Nom du template" />

        {error && <p className="text-caption text-center text-destructive">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : editing ? "Enregistrer le template" : "Créer le template"}
        </Button>
      </form>
    </div>
  );
}

export default TemplateForm;
