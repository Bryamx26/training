import { Home, Dumbbell, BarChart3, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/seances", label: "Séances", icon: Dumbbell },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/profil", label: "Profil", icon: User },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[max(8px,env(safe-area-inset-bottom))] st-tabbar">
      <div className="flex items-center justify-around px-2 py-2 max-w-xl mx-auto st-tabbar-inner">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              aria-current={active ? "page" : undefined}
              className="press flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-2xl st-tab"
            >
              {/* `contents` : la tuile n'existe qu'en Tracé ; Relief garde l'icône seule. */}
              <span className="contents st-tab-icon">
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
