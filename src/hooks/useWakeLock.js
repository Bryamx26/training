import { useEffect } from "react";

// Garde l'écran allumé tant que `active` est vrai (lecteur de séance). Le
// navigateur relâche le verrou quand l'onglet passe en arrière-plan : il est
// redemandé au retour. Sans support (Firefox ancien…), ne fait rien.
export default function useWakeLock(active) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let sentinel = null;
    let cancelled = false;

    async function request() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) sentinel.release();
      } catch {
        // Refusé (batterie faible, onglet masqué…) : l'écran suivra son délai habituel.
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") request();
    }

    request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
