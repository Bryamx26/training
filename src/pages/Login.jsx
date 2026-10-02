import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mail, setMail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
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
          <h1 className="text-display">Sport Track</h1>
          <p className="text-caption text-muted-foreground text-center">
            Connecte-toi pour suivre tes séances et ta progression
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />

          {error && (
            <p className="text-caption text-center" style={{ color: "var(--color-destructive)" }}>
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          <span className="text-caption text-muted-foreground">ou</span>
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
        </div>

        <GoogleSignInButton />

        <p className="text-caption text-muted-foreground text-center">
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="font-bold" style={{ color: "var(--color-foreground)" }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
