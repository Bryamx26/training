import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { profils as profilsApi } from "../../lib/api";
import BottomSheet from "../ui/BottomSheet";
import Button from "../ui/Button";

// Confirmation de la suppression du compte (droit à l'effacement, RGPD art. 17).
// L'API efface le profil et, en cascade, tout ce qui lui est rattaché.
function DeleteAccountSheet({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const staff = user.role === "COACH" || user.role === "ADMIN";

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await profilsApi.remove(user.id);
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <BottomSheet title="Supprimer mon compte" onClose={onClose} autoFocusClose>
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Ton compte et toutes tes données (profil, réalisations, notes, abonnements, notifications) seront effacés{" "}
          <strong>immédiatement et définitivement</strong>.
          {staff && " Les séances et templates que tu as créés seront aussi supprimés, y compris pour tes sportifs."}
        </p>
        <p className="text-caption text-muted-foreground">
          Pour garder une copie, utilise d'abord « Télécharger mes données ».
        </p>
        {error && <p className="text-caption text-destructive">{error}</p>}
        <Button variant="danger" onClick={handleDelete} disabled={deleting} className="w-full">
          {deleting ? "Suppression..." : "Supprimer définitivement"}
        </Button>
        <Button variant="ghost" onClick={onClose} className="w-full">
          Annuler
        </Button>
      </div>
    </BottomSheet>
  );
}

export default DeleteAccountSheet;
