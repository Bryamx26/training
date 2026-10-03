import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { templates as templatesApi } from "../../lib/api";
import { exerciceDraft, exerciceToApi } from "../../lib/exerciceForm";
import BottomSheet from "../ui/BottomSheet";
import Button from "../ui/Button";
import Input from "../ui/Input";

// « Enregistrer comme template » : demande un nom puis enregistre le CONTENU
// de la séance (type, difficulté, exercices et leurs paramètres), jamais ses
// participants ni sa date.
function SaveTemplateSheet({ circuit, onClose }) {
  const navigate = useNavigate();
  const [nom, setNom] = useState(circuit.nom);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const template = await templatesApi.create({
        nom: nom.trim(),
        type: circuit.type,
        niveau: circuit.niveau || null,
        exercices: circuit.exercices.map((ex, i) => exerciceToApi(exerciceDraft(ex), i)),
      });
      setSaved(template);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet title="Enregistrer comme template" onClose={onClose}>
      {saved ? (
        <div className="flex flex-col gap-4" role="status">
          <p className="text-sm">
            Template <strong>« {saved.nom} »</strong> enregistré avec {saved.exercices.length} exercice
            {saved.exercices.length > 1 ? "s" : ""}.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button onClick={() => navigate("/templates")}>Mes templates</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-caption text-muted-foreground">
            Le template reprend le type, la difficulté et les {circuit.exercices.length} exercice
            {circuit.exercices.length > 1 ? "s" : ""} de la séance, sans les sportifs ni la date.
          </p>
          <Input label="Nom du template" value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus />
          {error && <p className="text-caption text-destructive">{error}</p>}
          <Button type="submit" disabled={saving || !nom.trim()}>
            {saving ? "Enregistrement…" : "Enregistrer le template"}
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}

export default SaveTemplateSheet;
