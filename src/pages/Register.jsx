import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profils as profilsApi } from "../lib/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

function Register() {
  const { login } = useAuth();
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

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8 animate-rise">
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-3xl"
            style={{ background: "var(--color-primary)" }}
          >
            <Dumbbell className="w-8 h-8" style={{ color: "var(--color-primary-foreground)" }} />
          </div>
          <h1 className="text-display">Créer un compte</h1>
          <p className="text-caption text-muted-foreground text-center">
            Rejoins Sport Track pour suivre tes séances et ta progression
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-1.5">
            <span className="text-label text-muted-foreground">Je suis…</span>
            <div className="flex p-1 rounded-2xl gap-1" style={{ background: "var(--color-secondary)" }}>
              <button
                type="button"
                onClick={() => setRole("USER")}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={role === "USER" ? { background: "var(--color-card)", boxShadow: "var(--shadow-soft)" } : undefined}
              >
                Sportif
              </button>
              <button
                type="button"
                onClick={() => setRole("COACH")}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={role === "COACH" ? { background: "var(--color-card)", boxShadow: "var(--shadow-soft)" } : undefined}
              >
                Coach
              </button>
            </div>
          </div>

          {error && (
            <p className="text-caption text-center" style={{ color: "var(--color-destructive)" }}>
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Création..." : "Créer mon compte"}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          <span className="text-caption text-muted-foreground">ou</span>
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
        </div>

        <GoogleSignInButton />

        <p className="text-caption text-muted-foreground text-center">
          Déjà un compte ?{" "}
          <Link to="/login" className="font-bold" style={{ color: "var(--color-foreground)" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
