import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Play, Trash2 } from "lucide-react";
import { templates as templatesApi } from "../../lib/api";
import Button from "../ui/Button";

// Actions d'un template : créer une séance, modifier, supprimer (avec
// confirmation en deux temps). `onDeleted(template)` est appelé après suppression.
function TemplateActions({ template, onDeleted }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await templatesApi.remove(template.id);
      onDeleted(template);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2" role="alertdialog" aria-label={`Supprimer le template ${template.nom}`}>
        <p className="text-caption">Supprimer définitivement « {template.nom} » ? Les séances déjà créées ne sont pas touchées.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Suppression…" : "Supprimer"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={deleting}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => navigate(`/seances/nouvelle?template=${template.id}`)} className="flex-1">
          <Play className="w-4 h-4" /> Créer une séance
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/templates/${template.id}/modifier`)} aria-label={`Modifier ${template.nom}`}>
          <Pencil className="w-4 h-4" /> Modifier
        </Button>
        <Button variant="danger-soft" size="sm" onClick={() => setConfirming(true)} aria-label={`Supprimer ${template.nom}`}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      {error && <p className="text-caption text-destructive">{error}</p>}
    </div>
  );
}

export default TemplateActions;
