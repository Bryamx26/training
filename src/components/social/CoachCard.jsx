import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { coaches as coachesApi } from "../../lib/api";
import { useDesign } from "../../context/DesignContext";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

const ROLE_LABEL = { ADMIN: "Entraîneur", COACH: "Coach" };

// Fiche détaillée chargée à la demande (« Voir le profil »).
function CoachDetails({ coachId }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    coachesApi.get(coachId).then(setDetails, (e) => setError(e.message));
  }, [coachId]);

  if (error) return <p className="text-caption text-destructive">{error}</p>;
  if (!details) return <p className="text-caption text-muted-foreground">Chargement du profil…</p>;
  return (
    <p className="text-caption text-muted-foreground">
      {details.subscribersCount} abonné{details.subscribersCount > 1 ? "s" : ""} · {details.circuitsCount} séance
      {details.circuitsCount > 1 ? "s" : ""} créée{details.circuitsCount > 1 ? "s" : ""} · sur Sport Track depuis{" "}
      {new Date(details.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
    </p>
  );
}

// Carte d'un coach avec son action d'abonnement.
// `pending` : "subscribe" | "unsubscribe" | undefined, piloté par le parent.
function CoachCard({ coach, pending, error, onSubscribe, onUnsubscribe }) {
  const { design } = useDesign();
  const [showDetails, setShowDetails] = useState(false);
  // Le désabonnement demande une confirmation, pour éviter un clic accidentel sur « Abonné ✓ ».
  const [confirming, setConfirming] = useState(false);

  let action;
  if (pending === "subscribe") {
    action = <Button size="sm" disabled>Abonnement…</Button>;
  } else if (pending === "unsubscribe") {
    action = <Button size="sm" variant="secondary" disabled>Désabonnement…</Button>;
  } else if (!coach.subscribed) {
    action = (
      <Button size="sm" onClick={() => onSubscribe(coach)} aria-label={`S'abonner à ${coach.prenom} ${coach.nom}`}>
        S'abonner
      </Button>
    );
  } else if (confirming) {
    action = (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="danger-soft"
          onClick={() => {
            setConfirming(false);
            onUnsubscribe(coach);
          }}
        >
          Se désabonner
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Annuler
        </Button>
      </div>
    );
  } else {
    action = (
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setConfirming(true)}
        aria-label={`Abonné à ${coach.prenom} ${coach.nom}, se désabonner`}
      >
        Abonné <Check className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className={`${design === "trace" ? "st-row" : "rl-tile"} flex flex-col items-stretch gap-2`}>
      <div className="flex items-center gap-3 min-w-0">
        <Avatar nom={coach.nom} prenom={coach.prenom} size={40} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">
            {coach.prenom} {coach.nom}
          </p>
          <p className="text-caption text-muted-foreground">{ROLE_LABEL[coach.role] ?? "Coach"}</p>
        </div>
        {!confirming && action}
      </div>
      {confirming && <div className="flex justify-end">{action}</div>}
      {error && <p className="text-caption text-destructive">{error}</p>}
      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        aria-expanded={showDetails}
        className="self-start inline-flex items-center gap-1 text-caption font-bold text-info min-h-[44px]"
      >
        {showDetails ? "Masquer le profil" : "Voir le profil"}
        {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {showDetails && <CoachDetails coachId={coach.id} />}
    </div>
  );
}

export default CoachCard;
