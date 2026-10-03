import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDesign } from "../context/DesignContext";
import { profils as profilsApi } from "../lib/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import HeroBand from "../components/trace/HeroBand";
import TraceSegmentedControl from "../components/trace/SegmentedControl";
import ReliefSegmentedControl from "../components/relief/SegmentedControl";
import Separator from "../components/relief/Separator";

const ROLES = [
  { value: "USER", label: "Sportif" },
  { value: "COACH", label: "Coach" },
];

function Register() {
  const { login } = useAuth();
  const { design } = useDesign();
  const navigate = useNavigate();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [mail, setMail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await profilsApi.create({ prenom, nom, mail, motDePasse, role });
      await login(mail, motDePasse);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const identityFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Prénom" autoComplete="given-name" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        <Input label="Nom" autoComplete="family-name" value={nom} onChange={(e) => setNom(e.target.value)} required />
      </div>
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        value={mail}
        onChange={(e) => setMail(e.target.value)}
        required
      />
      <Input
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        value={motDePasse}
        onChange={(e) => setMotDePasse(e.target.value)}
        required
      />
    </>
  );

  if (design === "trace") {
    return (
      <div className="min-h-dvh flex flex-col">
        <HeroBand variant="register" onBack={() => navigate("/login")} />
        <div className="w-full max-w-sm mx-auto flex flex-col gap-6 px-5 py-6">
          <h1 className="t-page">Créer un compte</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {identityFields}

            <div className="flex flex-col gap-2">
              <span className="t-label">Je suis…</span>
              <TraceSegmentedControl
                options={ROLES}
                value={role}
                onChange={setRole}
                label="Je suis…"
              />
            </div>

            {error && <p className="text-caption text-center text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full mt-2" trailing={<ArrowRight />}>
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="st-divider">
            <span className="t-label">ou</span>
          </div>

          <GoogleSignInButton />

          <p className="t-body t-muted text-center">
            Déjà un compte ?{" "}
            <Link to="/login" className="font-bold text-foreground">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center px-5 py-6">
      <div className="w-full max-w-sm flex flex-col gap-6 animate-rise">
        <button type="button" onClick={() => navigate("/login")} aria-label="Retour" className="st-iconbutton">
          <ChevronLeft />
        </button>

        <div className="flex flex-col gap-2">
          <h1 className="rl-display">Créer un compte</h1>
          <p className="rl-body rl-muted">Rejoins Sport Track pour suivre tes séances et ta progression</p>
        </div>

        <form onSubmit={handleSubmit} className="rl-card flex flex-col gap-4 p-6">
          {identityFields}

          <div className="flex flex-col gap-2">
            <span className="rl-label">Je suis…</span>
            <ReliefSegmentedControl options={ROLES} value={role} onChange={setRole} label="Je suis…" />
          </div>

          {error && <p className="text-caption text-center text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Création..." : "Créer mon compte"}
          </Button>
        </form>

        <Separator />

        <GoogleSignInButton />

        <p className="rl-body rl-muted text-center">
          Déjà un compte ?{" "}
          <Link to="/login" className="font-bold text-foreground">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
