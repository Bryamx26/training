import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth as authApi, setSessionExpiredHandler } from "../lib/api";

const AuthContext = createContext(null);

// Seul le profil est gardé dans le navigateur, pour afficher l'application
// sans attendre le réseau. Le jeton de session vit dans un cookie httpOnly,
// inaccessible au JavaScript : il n'est jamais stocké ici.
const PROFIL_KEY = "profil";
// Cache du service worker (voir vite.config.js).
const API_CACHE = "api-data";
// Clé de l'ancienne version, qui stockait le jeton : supprimée au chargement.
const LEGACY_TOKEN_KEY = "token";

function readStoredProfil() {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return JSON.parse(localStorage.getItem(PROFIL_KEY));
  } catch {
    return null;
  }
}

function storeProfil(profil) {
  try {
    if (profil) localStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
    else localStorage.removeItem(PROFIL_KEY);
  } catch {
    // Stockage indisponible : la session reste valable tant que l'onglet est ouvert.
  }
}

// Données de l'API gardées pour le mode hors ligne : propres au compte, à
// oublier dès que la session se termine (déconnexion ou expiration).
function clearApiCache() {
  return window.caches?.delete(API_CACHE).catch(() => {});
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredProfil);

  const setProfil = useCallback((profil) => {
    storeProfil(profil);
    setUser(profil);
    return profil;
  }, []);

  // Session refusée par l'API : on oublie le profil, ProtectedRoute renvoie vers /login.
  const forget = useCallback(() => {
    setProfil(null);
    clearApiCache();
  }, [setProfil]);

  const logout = useCallback(async () => {
    forget();
    await authApi.logout().catch(() => {});
    await clearApiCache();
  }, [forget]);

  useEffect(() => {
    setSessionExpiredHandler(forget);
  }, [forget]);

  // Au démarrage, vérifie que la session est toujours valable et rafraîchit le
  // profil (rôle changé par un admin…). Hors ligne, on garde le profil connu.
  useEffect(() => {
    if (!readStoredProfil()) return;
    authApi
      .me()
      .then(({ profil }) => setProfil(profil))
      .catch(() => {});
  }, [setProfil]);

  async function login(mail, motDePasse) {
    return setProfil((await authApi.login(mail, motDePasse)).profil);
  }

  async function loginWithGoogle(credential) {
    return setProfil((await authApi.google(credential)).profil);
  }

  const isAdmin = user?.role === "ADMIN" || user?.role === "COACH";

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, updateUser: setProfil, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
