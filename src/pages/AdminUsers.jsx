import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, X, Check, UserMinus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profils as profilsApi, me as meApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import SegmentedControl from "../components/ui/SegmentedControl";
import { Loading, EmptyState } from "../components/ui/States";

const EMPTY_FORM = { nom: "", prenom: "", mail: "", motDePasse: "", poids: "", taille: "", age: "", role: "USER" };

const ROLES = [
  { value: "USER", label: "Sportif" },
  { value: "COACH", label: "Coach" },
  { value: "ADMIN", label: "Admin" },
];
const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

// `limited` : sportif inscrit lui-même, le coach ne modifie que son suivi
// physique (l'API refuse le reste).
// `canSetRole` : seul un admin attribue un rôle (l'API refuse sinon). Il ne
// peut pas changer le sien, pour ne pas perdre ses droits par erreur.
function UserForm({ initial, limited = false, canSetRole = false, isSelf = false, onCancel, onSaved }) {
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?.id);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        poids: form.poids ? Number(form.poids) : null,
        taille: form.taille ? Number(form.taille) : null,
        age: form.age ? Number(form.age) : null,
      };
      if (!limited) Object.assign(payload, { nom: form.nom, prenom: form.prenom, mail: form.mail });
      if (!limited && form.motDePasse) payload.motDePasse = form.motDePasse;
      if (canSetRole && !isSelf && form.role !== (initial?.role ?? null)) payload.role = form.role;

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
        <h3 className="text-h3">
          {editing ? (limited ? `Suivi de ${initial.prenom}` : "Modifier") : canSetRole ? "Nouveau compte" : "Nouveau sportif"}
        </h3>
        <button type="button" onClick={onCancel} aria-label="Fermer" className="press">
          <X className="w-4 h-4" />
        </button>
      </div>
      {limited && (
        <p className="text-caption text-muted-foreground">
          {initial.prenom} a créé son compte lui-même : tu peux modifier son suivi physique, pas son identité ni son mot de passe.
        </p>
      )}
      {canSetRole && !isSelf && <SegmentedControl options={ROLES} value={form.role} onChange={(role) => setForm({ ...form, role })} label="Rôle" />}
      {!limited && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
            <Input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
          </div>
          <Input placeholder="E-mail" type="email" value={form.mail} onChange={(e) => setForm({ ...form, mail: e.target.value })} required />
          <Input
            placeholder={editing ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
            type="password"
            value={form.motDePasse ?? ""}
            onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
            required={!editing}
          />
        </>
      )}
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
  const [error, setError] = useState(null);

  const isAdmin = user.role === "ADMIN";

  function reload() {
    // Un admin gère tous les comptes (y compris les coachs et admins qu'il crée).
    // Un coach ne gère que ses abonnés actifs ; un sportif créé ici lui est abonné d'office.
    const load = isAdmin ? profilsApi.list() : meApi.subscribers();
    load.then(setUsers, (e) => setError(e.message));
  }

  useEffect(reload, []);

  // Droits complets (identité, mot de passe, suppression) : admin, ou coach
  // qui a créé ce compte. Sinon, suivi physique et « retirer de mes sportifs ».
  const fullAccess = (u) => isAdmin || u.creeParId === user.id;

  async function run(confirmation, action) {
    if (!window.confirm(confirmation)) return;
    setError(null);
    try {
      await action();
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const handleDelete = (u) =>
    run(`Supprimer définitivement le compte de ${u.prenom} ${u.nom} et toutes ses données ?`, () => profilsApi.remove(u.id));

  // Désabonner : le compte et les séances passées sont conservés. Pour un compte
  // créé par le coach, il perd aussi ses droits dessus (l'API les lie à l'abonnement).
  const handleUnsubscribe = (u) =>
    run(
      `Désabonner ${u.prenom} ${u.nom} de tes sportifs ? Son compte et ses séances passées sont conservés` +
        (fullAccess(u) ? ", mais tu ne pourras plus le gérer." : "."),
      () => meApi.removeSubscriber(u.id)
    );

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
        {isAdmin && <DemandesCoach />}
        {formTarget && (
          <UserForm
            key={formTarget.id ?? "new"}
            initial={formTarget.id ? formTarget : null}
            limited={Boolean(formTarget.id) && !fullAccess(formTarget)}
            canSetRole={isAdmin}
            isSelf={formTarget.id === user.id}
            onCancel={() => setFormTarget(null)}
            onSaved={handleSaved}
          />
        )}
        {error && <p className="text-caption text-destructive" role="alert">{error}</p>}

        {!users && <Loading />}
        {users && users.length === 0 && !formTarget && (isAdmin ? <EmptyState title="Aucun compte" subtitle="Ajoute un compte avec le bouton +." /> : <EmptyState title="Aucun abonné" subtitle="Les sportifs s'abonnent à toi depuis Social, ou ajoute-en un ici." />)}

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
                <p className="text-caption text-muted-foreground truncate">
                  {u.role && u.role !== "USER" ? `${ROLE_LABEL[u.role]} · ` : ""}
                  {u.mail}
                </p>
              </div>
            </button>
            <button onClick={() => setFormTarget(u)} className="press p-2" aria-label="Modifier">
              <Pencil className="w-4 h-4" />
            </button>
            {/* Liste du coach = ses abonnés : il peut toujours désabonner. */}
            {!isAdmin && (
              <button onClick={() => handleUnsubscribe(u)} className="press p-2" aria-label={`Désabonner ${u.prenom} ${u.nom}`} title="Désabonner">
                <UserMinus className="w-4 h-4 text-destructive" />
              </button>
            )}
            {u.id !== user.id && fullAccess(u) && (
              <button onClick={() => handleDelete(u)} className="press p-2" aria-label={`Supprimer le compte de ${u.prenom} ${u.nom}`} title="Supprimer le compte">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminUsers;
