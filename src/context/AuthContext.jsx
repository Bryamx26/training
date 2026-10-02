import { createContext, useContext, useEffect, useState } from "react";
import { auth as authApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("profil");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("profil");
      }
    }
    setLoading(false);
  }, []);

  async function login(mail, motDePasse) {
    const profil = await authApi.login(mail, motDePasse);
    localStorage.setItem("profil", JSON.stringify(profil));
    setUser(profil);
    return profil;
  }

  async function loginWithGoogle(credential) {
    const profil = await authApi.google(credential);
    localStorage.setItem("profil", JSON.stringify(profil));
    setUser(profil);
    return profil;
  }

  function logout() {
    localStorage.removeItem("profil");
    setUser(null);
  }

  function updateUser(profil) {
    localStorage.setItem("profil", JSON.stringify(profil));
    setUser(profil);
  }

  const isAdmin = user?.role === "ADMIN" || user?.role === "COACH";

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
