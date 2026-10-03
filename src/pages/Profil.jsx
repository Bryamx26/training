import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Users as UsersIcon, Plus, ChevronRight, LayoutTemplate, UserSearch } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDesign } from "../context/DesignContext";
import { circuits as circuitsApi, profils as profilsApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import DarkModeToggle from "../components/bouton/DarkModeToggle.jsx";
import DesignPicker from "../components/bouton/DesignPicker.jsx";
import TraceKpiTile from "../components/trace/KpiTile";
import ReliefKpiTile from "../components/relief/KpiTile";
import MenuRow from "../components/relief/MenuRow";
import { StatusPill } from "../components/relief/Tags";
import SocialDrawer from "../components/social/SocialDrawer";
import { computeScoreForProfil } from "../lib/score";

function Profil() {
  const { user, updateUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { design } = useDesign();
  const [form, setForm] = useState({ poids: user.poids ?? "", taille: user.taille ?? "", age: user.age ?? "", blessures: user.blessures ?? "" });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  // Social : recherche de coachs (sportif) ou liste des abonnés (coach).
  const [socialOpen, setSocialOpen] = useState(false);

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

  const roleLabel = user.role === "ADMIN" ? "Entraîneur" : user.role === "COACH" ? "Coach" : "Sportif";

  const socialDrawer = socialOpen && <SocialDrawer onClose={() => setSocialOpen(false)} />;

  const infoForm = !isAdmin && (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <span className="text-label text-muted-foreground t-label rl-label">Mes informations</span>
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
  );

  if (design === "trace") {
    return (
      <div>
        <TopAppBar title="Profil" action={<DarkModeToggle />} />

        <div className="px-5 flex flex-col gap-6 pb-8">
          <div className="st-slab flex items-center gap-4">
            <Avatar nom={user.nom} prenom={user.prenom} size={72} highlight />
            <div className="min-w-0 flex flex-col gap-1">
              <h2 className="text-[24px] leading-[28px] font-extrabold tracking-[-0.02em] truncate">
                {user.prenom} {user.nom}
              </h2>
              <p className="t-mono text-[13px] truncate" style={{ color: "var(--on-slab-muted)" }}>
                {user.mail}
              </p>
              <span
                className="t-label self-start px-1.5 py-0.5"
                style={{ background: "var(--on-slab)", color: "var(--slab)", borderRadius: "var(--radius-xs)" }}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="t-label">Apparence</span>
            <DesignPicker />
          </div>

          {!isAdmin && stats && (
            <div className="grid grid-cols-2 gap-3">
              <TraceKpiTile label="Séances" value={stats.total} />
              <TraceKpiTile label="Moyenne" value={stats.moyenne.toFixed(1)} sub="sur 10" />
            </div>
          )}

          <div className="st-list">
            <button type="button" onClick={() => setSocialOpen(true)} aria-haspopup="dialog" className="st-row">
              <UserSearch className="w-5 h-5 st-cobalt-text" />
              <span className="st-row-main text-[15px] font-semibold">Social</span>
              <ChevronRight className="st-row-chevron" />
            </button>
            {isAdmin && (
              <>
                <button type="button" onClick={() => navigate("/admin/utilisateurs")} className="st-row">
                  <UsersIcon className="w-5 h-5 st-cobalt-text" />
                  <span className="st-row-main text-[15px] font-semibold">Gérer les utilisateurs</span>
                  <ChevronRight className="st-row-chevron" />
                </button>
                <button type="button" onClick={() => navigate("/seances/nouvelle")} className="st-row">
                  <Plus className="w-5 h-5 st-volt-ink" />
                  <span className="st-row-main text-[15px] font-semibold">Créer une séance</span>
                  <ChevronRight className="st-row-chevron" />
                </button>
                <button type="button" onClick={() => navigate("/templates")} className="st-row">
                  <LayoutTemplate className="w-5 h-5" />
                  <span className="st-row-main text-[15px] font-semibold">Templates</span>
                  <ChevronRight className="st-row-chevron" />
                </button>
              </>
            )}
          </div>

          {infoForm}

          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Déconnexion
          </Button>
        </div>

        {socialDrawer}
      </div>
    );
  }

  return (
    <div>
      <TopAppBar title="Profil" action={<DarkModeToggle />} />

      <div className="px-5 flex flex-col gap-6 pb-8">
        <div className="rl-card flex items-center gap-4">
          <span className="rl-pedestal">
            <Avatar nom={user.nom} prenom={user.prenom} size={60} />
          </span>
          <div className="min-w-0 flex flex-col items-start gap-1.5">
            <h2 className="text-[22px] leading-7 font-extrabold tracking-[-0.02em] truncate max-w-full">
              {user.prenom} {user.nom}
            </h2>
            <p className="rl-small truncate max-w-full">{user.mail}</p>
            <StatusPill>
              <span className="uppercase tracking-[0.08em] text-[11px]">{roleLabel}</span>
            </StatusPill>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="rl-label">Apparence</span>
          <DesignPicker />
        </div>

        {!isAdmin && stats && (
          <div className="grid grid-cols-2 gap-4">
            <ReliefKpiTile label="Séances" value={stats.total} />
            <ReliefKpiTile label="Moyenne" value={stats.moyenne.toFixed(1)} sub="sur 10" tone="progress" />
          </div>
        )}

        <div className="flex flex-col gap-4">
          <MenuRow icon={UserSearch} iconClassName="rl-info" label="Social" onClick={() => setSocialOpen(true)} />
          {isAdmin && (
            <>
              <MenuRow icon={UsersIcon} iconClassName="rl-info" label="Gérer les utilisateurs" onClick={() => navigate("/admin/utilisateurs")} />
              <MenuRow icon={Plus} iconClassName="rl-progress-ink" label="Créer une séance" onClick={() => navigate("/seances/nouvelle")} />
              <MenuRow icon={LayoutTemplate} label="Templates" onClick={() => navigate("/templates")} />
            </>
          )}
        </div>

        {infoForm}

        <Button variant="danger-soft" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Déconnexion
        </Button>
      </div>

      {socialDrawer}
    </div>
  );
}

export default Profil;
