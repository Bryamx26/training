import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { me as meApi } from "../../lib/api";
import { useDesign } from "../../context/DesignContext";
import Avatar from "../ui/Avatar";
import { Loading, EmptyState, ErrorState } from "../ui/States";

// Vue Social d'un coach : ses abonnés actifs, les seuls qu'il peut ajouter à ses séances.
function MySubscribers({ onNavigate }) {
  const { design } = useDesign();
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    meApi.subscribers().then(setSubscribers, (e) => setError(e.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!subscribers) return <Loading />;
  if (subscribers.length === 0) {
    return (
      <EmptyState
        title="Aucun abonné"
        subtitle="Les sportifs te trouvent et s'abonnent à toi depuis leur menu Social. Seuls tes abonnés peuvent être ajoutés à tes séances."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label text-muted-foreground t-label rl-label">
        Mes abonnés ({subscribers.length})
      </p>
      <div className={design === "trace" ? "st-list" : "flex flex-col gap-3"}>
        {subscribers.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              onNavigate();
              navigate(`/admin/sportifs/${s.id}`);
            }}
            className={design === "trace" ? "st-row" : "rl-row"}
          >
            <Avatar nom={s.nom} prenom={s.prenom} size={40} />
            <span className="flex-1 min-w-0 flex flex-col text-left">
              <span className="text-sm font-bold truncate">
                {s.prenom} {s.nom}
              </span>
              <span className="text-caption text-muted-foreground">
                Abonné depuis le {new Date(s.subscribedAt).toLocaleDateString("fr-FR")}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default MySubscribers;
