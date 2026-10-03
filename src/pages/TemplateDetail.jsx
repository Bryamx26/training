import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { templates as templatesApi } from "../lib/api";
import { TYPE_LABEL, formatLest } from "../lib/exerciceForm";
import TopAppBar from "../components/layout/TopAppBar";
import { Loading, ErrorState } from "../components/ui/States";
import TemplateActions from "../components/templates/TemplateActions";

// Paramètres renseignés d'un exercice, ex. « 3 séries · 12 reps · repos 60 s ».
function params(ex) {
  return [
    ex.series && `${ex.series} série${ex.series > 1 ? "s" : ""}`,
    ex.nbRep && `${ex.nbRep} reps`,
    ex.duree && `${ex.duree} s`,
    ex.tempsDeRepos && `repos ${ex.tempsDeRepos} s`,
    formatLest(ex.lest) && `lest ${formatLest(ex.lest)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    templatesApi.get(id).then(setTemplate, (e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!template) return <Loading />;

  return (
    <div>
      <TopAppBar title={template.nom} titleSize="sm" onBack={true} />

      <div className="px-5 flex flex-col gap-5 pb-8">
        <p className="text-caption text-muted-foreground">
          {[template.type && TYPE_LABEL[template.type], template.niveau || "Difficulté non précisée"].filter(Boolean).join(" · ")}
        </p>

        <TemplateActions
          template={template}
          onDeleted={(t) => navigate("/templates", { replace: true, state: { flash: `Template « ${t.nom} » supprimé.` } })}
        />

        <div className="flex flex-col gap-3">
          <span className="text-label text-muted-foreground">
            {template.exercices.length} exercice{template.exercices.length > 1 ? "s" : ""}
          </span>
          {template.exercices.map((ex, i) => (
            <div key={ex.id} className="card-surface p-4 flex flex-col gap-1">
              <span className="text-sm font-bold">
                {i + 1}. {ex.exercice}
              </span>
              {params(ex) && <span className="text-caption text-muted-foreground">{params(ex)}</span>}
              {ex.objectif && <span className="text-caption">Objectif : {ex.objectif}</span>}
              {ex.consignes && <span className="text-caption">Consignes : {ex.consignes}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TemplateDetail;
