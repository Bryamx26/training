import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profils as profilsApi, me as meApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Loading, EmptyState } from "../components/ui/States";

const EMPTY_FORM = { nom: "", prenom: "", mail: "", motDePasse: "", poids: "", taille: "", age: "" };

function UserForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?.id);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        mail: form.mail,
        poids: form.poids ? Number(form.poids) : null,
        taille: form.taille ? Number(form.taille) : null,
        age: form.age ? Number(form.age) : null,
      };
      if (form.motDePasse) payload.motDePasse = form.motDePasse;

      const saved = editing ? await profilsApi.update(initial.id, payload) : await profilsApi.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-5 flex flex-col gap-3 animate-rise">
      <div className="flex items-center justify-between">
        <h3 className="text-h3">{editing ? "Modifier" : "Nouveau sportif"}</h3>
        <button type="button" onClick={onCancel} aria-label="Fermer" className="press">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
        <Input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
      </div>
      <Input placeholder="E-mail" type="email" value={form.mail} onChange={(e) => setForm({ ...form, mail: e.target.value })} required />
      <Input
        placeholder={editing ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
        type="password"
        value={form.motDePasse}
        onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
        required={!editing}
      />
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="Âge" inputMode="numeric" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        <Input placeholder="Poids" inputMode="numeric" value={form.poids} onChange={(e) => setForm({ ...form, poids: e.target.value })} />
        <Input placeholder="Taille" inputMode="numeric" value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })} />
      </div>
      {error && (
        <p className="text-caption text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer le compte"}
      </Button>
    </form>
  );
}

// Demandes de compte coach (inscriptions publiques « coach ») : visibles et
// validées par un admin uniquement.
function DemandesCoach() {
  const [demandes, setDemandes] = useState(null);
  const [error, setError] = useState(null);

  function reload() {
    profilsApi.demandesCoach().then(setDemandes, (e) => setError(e.message));
  }

  useEffect(reload, []);

  async function decide(profil, accept) {
    setError(null);
    try {
      await profilsApi.update(profil.id, accept ? { role: "COACH" } : { demandeCoach: false });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!demandes?.length && !error) return null;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="demandes-coach-title">
      <h2 id="demandes-coach-title" className="text-label text-muted-foreground">
        Demandes de compte coach
      </h2>
      {error && <p className="text-caption text-destructive">{error}</p>}
      {demandes?.map((d) => (
        <div key={d.id} className="card-surface flex items-center gap-3 p-4">
          <Avatar nom={d.nom} prenom={d.prenom} size={40} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">
              {d.prenom} {d.nom}
            </p>
            <p className="text-caption text-muted-foreground truncate">{d.mail}</p>
          </div>
          <Button size="sm" onClick={() => decide(d, true)} className="px-3 py-2" aria-label={`Valider ${d.prenom} ${d.nom} comme coach`}>
            <Check className="w-4 h-4" /> Valider
          </Button>
          <button onClick={() => decide(d, false)} className="press p-2" aria-label={`Refuser la demande de ${d.prenom} ${d.nom}`}>
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>
      ))}
    </section>
  );
}

function AdminUsers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const [formTarget, setFormTarget] = useState(null); // null = closed, {} = create, {id,...} = edit

  function reload() {
    // Un coach ne gère que ses abonnés actifs ; un sportif créé ici lui est abonné d'office.
    meApi.subscribers().then(setUsers);
  }

  useEffect(reload, []);

  async function handleDelete(id) {
    if (!window.confirm("Supprimer cet utilisateur et toutes ses séances ?")) return;
    await profilsApi.remove(id);
    reload();
  }

  function handleSaved() {
    setFormTarget(null);
    reload();
  }

  return (
    <div>
      <TopAppBar
        title="Utilisateurs"
        onBack={true}
        action={
          <button
            onClick={() => setFormTarget({})}
            className="press flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground"
            aria-label="Ajouter un utilisateur"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-5 flex flex-col gap-3 pb-8">
        {user.role === "ADMIN" && <DemandesCoach />}
        {formTarget && <UserForm initial={formTarget.id ? formTarget : null} onCancel={() => setFormTarget(null)} onSaved={handleSaved} />}

        {!users && <Loading />}
        {users && users.length === 0 && !formTarget && <EmptyState title="Aucun abonné" subtitle="Les sportifs s'abonnent à toi depuis Social, ou ajoute-en un ici." />}

        {users?.map((u) => (
          <div key={u.id} className="card-surface flex items-center gap-3 p-4">
            <button
              type="button"
              onClick={() => navigate(`/admin/sportifs/${u.id}`)}
              className="press flex items-center gap-3 flex-1 min-w-0 text-left"
            >
              <Avatar nom={u.nom} prenom={u.prenom} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">
                  {u.prenom} {u.nom}
                </p>
                <p className="text-caption text-muted-foreground truncate">{u.mail}</p>
              </div>
            </button>
            <button onClick={() => setFormTarget(u)} className="press p-2" aria-label="Modifier">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(u.id)} className="press p-2" aria-label="Supprimer">
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminUsers;
