import { Home, Dumbbell, BarChart3, User, Bell } from "lucide-react";
import { useNotifications } from "../../context/NotificationsContext";
import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/seances", label: "Séances", icon: Dumbbell },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/notifications", label: "Alertes", icon: Bell, badge: true },
  { to: "/profil", label: "Profil", icon: User },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nonLues } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[max(8px,env(safe-area-inset-bottom))] st-tabbar">
      <div className="flex items-center justify-around px-2 py-2 max-w-xl mx-auto st-tabbar-inner">
        {TABS.map(({ to, label, icon: Icon, badge }) => {
          const active = location.pathname === to;
          return (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              aria-current={active ? "page" : undefined}
              aria-label={badge && nonLues > 0 ? `${label} (${nonLues} non lue${nonLues > 1 ? "s" : ""})` : undefined}
              className="press relative flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-2xl st-tab"
            >
              {/* `contents` : la tuile n'existe qu'en Tracé ; Relief garde l'icône seule. */}
              <span className="contents st-tab-icon">
                {badge && nonLues > 0 && (
                  <span className="absolute top-0.5 left-1/2 ml-1.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-4 text-center" aria-hidden="true">
                    {nonLues > 9 ? "9+" : nonLues}
                  </span>
                )}
                <Icon className={`w-5 h-5 ${active ? "text-accent-foreground" : "text-muted-foreground"}`} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={`text-[11px] font-semibold ${active ? "text-foreground" : "text-muted-foreground"} st-tab-label`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
