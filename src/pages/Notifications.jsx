import { useNavigate } from "react-router-dom";
import { Bell, CalendarPlus, Star, UserPlus, CheckCircle2, ShieldCheck, CheckCheck } from "lucide-react";
import { useNotifications } from "../context/NotificationsContext";
import TopAppBar from "../components/layout/TopAppBar";
import { Loading, EmptyState } from "../components/ui/States";

const ICONS = {
  NOUVELLE_SEANCE: CalendarPlus,
  SEANCE_NOTEE: Star,
  NOUVEL_ABONNE: UserPlus,
  SEANCE_REALISEE: CheckCircle2,
  DEMANDE_COACH: ShieldCheck,
  COACH_VALIDE: ShieldCheck,
};

function formatWhen(iso) {
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 24 * 60) return `il y a ${Math.round(minutes / 60)} h`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function Notifications() {
  const navigate = useNavigate();
  const { notifications, nonLues, loaded, markRead } = useNotifications();

  function open(n) {
    if (!n.lu) markRead([n.id]);
    if (n.lien) navigate(n.lien);
  }

  return (
    <div>
      <TopAppBar
        title="Notifications"
        action={
          nonLues > 0 && (
            <button
              type="button"
              onClick={() => markRead()}
              className="press flex items-center justify-center w-9 h-9 rounded-full bg-secondary st-iconbutton"
              aria-label="Tout marquer comme lu"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )
        }
      />
      <div className="px-5 pb-8 flex flex-col gap-3">
        {!loaded && <Loading />}
        {loaded && notifications.length === 0 && (
          <EmptyState title="Aucune notification" subtitle="Tu seras prévenu ici des nouvelles séances, notes et abonnements." />
        )}
        {notifications.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => open(n)}
              className={`press card-surface flex items-start gap-3 p-4 text-left ${n.lu ? "opacity-70" : ""}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${n.lu ? "text-muted-foreground" : "text-[var(--info)]"}`} aria-hidden="true" />
              <span className="flex-1 min-w-0 flex flex-col gap-1">
                <span className={`text-sm ${n.lu ? "" : "font-bold"}`}>{n.message}</span>
                <span className="text-caption text-muted-foreground">{formatWhen(n.createdAt)}</span>
              </span>
              {!n.lu && <span className="w-2.5 h-2.5 rounded-full bg-[var(--info)] shrink-0 mt-1.5" aria-label="Non lue" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Notifications;
