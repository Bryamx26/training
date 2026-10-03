import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth as authApi, setAuthToken, setSessionExpiredHandler } from "../lib/api";

const AuthContext = createContext(null);

const PROFIL_KEY = "profil";
const TOKEN_KEY = "token";

// Session enregistrée : le profil et son jeton vont ensemble. Une ancienne
// session sans jeton (avant l'authentification de l'API) est ignorée.
function readStoredSession() {
  try {
    const profil = JSON.parse(localStorage.getItem(PROFIL_KEY));
    const token = localStorage.getItem(TOKEN_KEY);
    if (profil && token) return { profil, token };
  } catch {
    // Données corrompues : on repart d'une session vide.
  }
  localStorage.removeItem(PROFIL_KEY);
  localStorage.removeItem(TOKEN_KEY);
  return null;
}

export function AuthProvider({ children }) {
  // Lecture synchrone : le jeton est en place avant le premier appel API des pages.
  const [user, setUser] = useState(() => {
    const session = readStoredSession();
    setAuthToken(session?.token ?? null);
    return session?.profil ?? null;
  });

  function startSession({ token, profil }) {
    localStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(profil);
    return profil;
  }

  const logout = useCallback(() => {
    localStorage.removeItem(PROFIL_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  // Jeton refusé par l'API : on déconnecte, ProtectedRoute renvoie vers /login.
  useEffect(() => {
    setSessionExpiredHandler(logout);
  }, [logout]);

  async function login(mail, motDePasse) {
    return startSession(await authApi.login(mail, motDePasse));
  }

  async function loginWithGoogle(credential) {
    return startSession(await authApi.google(credential));
  }

  function updateUser(profil) {
    localStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
    setUser(profil);
  }

  const isAdmin = user?.role === "ADMIN" || user?.role === "COACH";

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
