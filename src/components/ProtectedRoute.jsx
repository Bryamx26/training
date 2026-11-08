import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CguGate from "./legal/CguGate";

// Route réservée aux personnes connectées qui ont accepté les CGU (sinon
// CguGate les leur demande d'abord).
export function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <CguGate>{children}</CguGate>;
}

// Confort d'affichage uniquement : c'est l'API qui fait respecter les droits.
export function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
