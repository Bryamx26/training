import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { me as meApi } from "../lib/api";

const NotificationsContext = createContext(null);

// Rafraîchissement régulier tant que l'onglet est visible, et au retour sur l'onglet.
const POLL_MS = 60_000;

// Notifications de l'utilisateur connecté (cloche de la barre de navigation).
export function NotificationsProvider({ children }) {
  const [data, setData] = useState({ notifications: [], nonLues: 0 });
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    return meApi
      .notifications()
      .then((d) => {
        setData(d);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    reload();
    const timer = setInterval(() => document.visibilityState === "visible" && reload(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  // Sans `ids`, marque tout comme lu. Mise à jour immédiate de l'affichage.
  const markRead = useCallback(async (ids) => {
    setData((d) => {
      const notifications = d.notifications.map((n) => (!ids || ids.includes(n.id) ? { ...n, lu: true } : n));
      return { notifications, nonLues: ids ? Math.max(0, d.nonLues - d.notifications.filter((n) => ids.includes(n.id) && !n.lu).length) : 0 };
    });
    await meApi.markNotificationsRead(ids).catch(() => {});
  }, []);

  return (
    <NotificationsContext.Provider value={{ ...data, loaded, reload, markRead }}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications doit être utilisé dans un NotificationsProvider");
  return ctx;
}
