import { Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { CloudOff } from "lucide-react";
import BottomNav from "./BottomNav";
import { Loading } from "../ui/States";
import { NotificationsProvider } from "../../context/NotificationsContext";
import { flushQueue } from "../../lib/offlineQueue";
import { useAuth } from "../../context/AuthContext";

// Bandeau affiché quand le navigateur est hors ligne.
function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function AppLayout() {
  const online = useOnline();
  const { user } = useAuth();
  const profilId = user?.id;

  // Séances terminées hors ligne : envoyées au démarrage, au retour du réseau
  // et à la reconnexion, uniquement celles du compte connecté.
  useEffect(() => {
    if (online && profilId) flushQueue(profilId);
  }, [online, profilId]);

  return (
    <NotificationsProvider>
      <div className="min-h-dvh flex flex-col">
        {!online && (
          <div role="status" className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-caption font-semibold bg-secondary text-secondary-foreground border-b border-border">
            <CloudOff className="w-4 h-4" /> Hors ligne : les séances déjà ouvertes restent disponibles.
          </div>
        )}
        <main className="flex-1 pb-24 max-w-xl w-full mx-auto">
          {/* Pages chargées à la demande : la barre de navigation reste affichée. */}
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </NotificationsProvider>
  );
}

export default AppLayout;
