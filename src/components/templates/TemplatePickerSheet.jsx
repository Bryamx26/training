import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { templates as templatesApi } from "../../lib/api";
import { contentSummary } from "../../lib/exerciceForm";
import BottomSheet from "../ui/BottomSheet";
import { Loading, EmptyState, ErrorState } from "../ui/States";

// Liste des templates du coach pour pré-remplir une nouvelle séance.
// `onSelect(template complet)` reçoit le détail, exercices compris.
function TemplatePickerSheet({ onClose, onSelect }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    templatesApi.list().then(setList, (e) => setError(e.message));
  }, []);

  async function choose(id) {
    setLoadingId(id);
    setError(null);
    try {
      onSelect(await templatesApi.get(id));
    } catch (err) {
      setError(err.message);
      setLoadingId(null);
    }
  }

  return (
    <BottomSheet title="Templates" onClose={onClose} autoFocusClose>
      {error && <ErrorState message={error} />}
      {!list && !error && <Loading />}
      {list?.length === 0 && (
        <EmptyState title="Aucun template enregistré" subtitle="Enregistre une séance comme template depuis son détail pour la réutiliser ici." />
      )}
      {list?.length > 0 && (
        <div className="flex flex-col gap-3">
          {list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => choose(t.id)}
              disabled={loadingId !== null}
              className="card-surface press flex items-center gap-3 p-4 text-left disabled:opacity-60"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold truncate">{t.nom}</span>
                <span className="block text-caption text-muted-foreground">{contentSummary(t)}</span>
              </span>
              {loadingId === t.id ? (
                <span className="text-caption text-muted-foreground">Chargement…</span>
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

export default TemplatePickerSheet;
