import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Users as UsersIcon, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { circuits as circuitsApi, profils as profilsApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import DarkModeToggle from "../components/bouton/DarkModeToggle.jsx";
import { computeScoreForProfil } from "../lib/score";

function Profil() {
  const { user, updateUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ poids: user.poids ?? "", taille: user.taille ?? "", age: user.age ?? "", blessures: user.blessures ?? "" });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isAdmin) return;
    circuitsApi.list({ profilId: user.id }).then((circuits) => {
      const gradees = circuits.map((c) => computeScoreForProfil(c.exercices, user.id)).filter((s) => s.graded);
      const moyenne = gradees.length ? gradees.reduce((sum, g) => sum + g.moyenne10, 0) / gradees.length : 0;
      setStats({ total: circuits.length, moyenne });
    });
  }, [user.id, isAdmin]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profilsApi.update(user.id, {
        poids: form.poids ? Number(form.poids) : null,
        taille: form.taille ? Number(form.taille) : null,
        age: form.age ? Number(form.age) : null,
        blessures: form.blessures || null,
      });
      updateUser({ ...user, ...updated });
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <TopAppBar title="Profil" action={<DarkModeToggle />} />

      <div className="px-5 flex flex-col gap-6 pb-8">
        <div className="flex items-center gap-4">
          <Avatar nom={user.nom} prenom={user.prenom} size={64} />
          <div>
            <h2 className="text-h1">
              {user.prenom} {user.nom}
            </h2>
            <p className="text-caption text-muted-foreground">{user.mail}</p>
            <span className="text-label mt-1 inline-block px-2.5 py-1 rounded-full" style={{ background: "var(--color-secondary)" }}>
              {user.role === "ADMIN" ? "Entraîneur" : user.role === "COACH" ? "Coach" : "Sportif"}
            </span>
          </div>
        </div>

        {!isAdmin && stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="card-surface p-4">
              <p className="text-label text-muted-foreground">Séances</p>
              <p className="text-display mt-1">{stats.total}</p>
            </div>
            <div className="card-surface p-4">
              <p className="text-label text-muted-foreground">Moyenne</p>
              <p className="text-display mt-1">{stats.moyenne.toFixed(1)}</p>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate("/admin/utilisateurs")} className="card-surface press flex items-center gap-3 p-4 text-left">
              <UsersIcon className="w-5 h-5" style={{ color: "var(--color-info)" }} />
              <span className="text-sm font-bold flex-1">Gérer les utilisateurs</span>
            </button>
            <button onClick={() => navigate("/seances/nouvelle")} className="card-surface press flex items-center gap-3 p-4 text-left">
              <Plus className="w-5 h-5" style={{ color: "var(--color-success)" }} />
              <span className="text-sm font-bold flex-1">Créer une séance</span>
            </button>
          </div>
        )}

        {!isAdmin && (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <span className="text-label text-muted-foreground">Mes informations</span>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Âge" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              <Input label="Poids (kg)" type="number" value={form.poids} onChange={(e) => setForm({ ...form, poids: e.target.value })} />
              <Input label="Taille (cm)" type="number" value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })} />
            </div>
            <Input label="Blessures / objectifs" value={form.blessures} onChange={(e) => setForm({ ...form, blessures: e.target.value })} />
            <Button type="submit" variant="secondary" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        )}

        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Déconnexion
        </Button>
      </div>
    </div>
  );
}

export default Profil;
