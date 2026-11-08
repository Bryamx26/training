import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { me as meApi } from "../../lib/api";
import Button from "../ui/Button";
import CguCheckbox from "./CguCheckbox";
import LegalLinks from "./LegalLinks";

// Compte créé par un coach : la personne n'a jamais accepté les CGU ni la
// politique de confidentialité. L'application reste bloquée sur cet écran
// tant qu'elle ne les a pas acceptées (la date est enregistrée par l'API).
function CguGate({ children }) {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [accepte, setAccepte] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (user.cguAccepteesLe) return children;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      updateUser({ ...user, ...(await meApi.acceptCgu()) });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm card-surface p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-h2">Bienvenue {user.prenom}</h1>
          <p className="text-caption text-muted-foreground">
            Ton coach a créé ton compte. Avant de continuer, lis et accepte les conditions d'utilisation et la politique de
            confidentialité.
          </p>
        </div>

        <CguCheckbox checked={accepte} onChange={setAccepte} />

        {error && <p className="text-caption text-center text-destructive">{error}</p>}

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={!accepte || saving}>
            {saving ? "Enregistrement..." : "Continuer"}
          </Button>
          <Button type="button" variant="ghost" onClick={handleLogout}>
            Se déconnecter
          </Button>
        </div>

        <LegalLinks />
      </form>
    </div>
  );
}

export default CguGate;
