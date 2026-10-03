import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { templates as templatesApi } from "../lib/api";
import { TYPE_LABEL, contentSummary } from "../lib/exerciceForm";
import TopAppBar from "../components/layout/TopAppBar";
import { Loading, EmptyState, ErrorState } from "../components/ui/States";
import Button from "../components/ui/Button";
import TemplateActions from "../components/templates/TemplateActions";

// Templates du coach connecté (le backend ne renvoie que les siens).
function Templates() {
  const navigate = useNavigate();
  const location = useLocation();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  // Message de confirmation transmis par la page précédente (enregistrement, suppression).
  const [flash, setFlash] = useState(location.state?.flash ?? null);

  useEffect(() => {
    templatesApi.list().then(setList, (e) => setError(e.message));
  }, []);

  function handleDeleted(template) {
    setList((l) => l.filter((t) => t.id !== template.id));
    setFlash(`Template « ${template.nom} » supprimé.`);
  }

  return (
    <div>
      <TopAppBar
        title="Templates"
        onBack={true}
        action={
          <button
            type="button"
            onClick={() => navigate("/templates/nouveau")}
            className="press flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground st-iconbutton st-iconbutton--primary"
            aria-label="Nouveau template"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-5 flex flex-col gap-4 pb-8">
        {flash && (
          <p className="text-caption text-success font-bold" role="status">
            {flash}
          </p>
        )}
        {error && <ErrorState message={error} />}
        {!list && !error && <Loading />}
        {list?.length === 0 && (
          <EmptyState
            title="Aucun template enregistré"
            subtitle="Depuis le détail d'une séance, « Enregistrer comme template » la rend réutilisable."
            action={<Button onClick={() => navigate("/templates/nouveau")}>Créer un template</Button>}
          />
        )}
        {list?.map((t) => (
          <div key={t.id} className="card-surface p-4 flex flex-col gap-3 animate-rise">
            <Link to={`/templates/${t.id}`} className="flex flex-col gap-0.5">
              <span className="text-h3">{t.nom}</span>
              <span className="text-caption text-muted-foreground">
                {[t.type && TYPE_LABEL[t.type], contentSummary(t)].filter(Boolean).join(" · ")}
              </span>
            </Link>
            <TemplateActions template={t} onDeleted={handleDeleted} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Templates;
