import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDesign } from "../context/DesignContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import HeroBand from "../components/trace/HeroBand";
import Logo from "../components/relief/Logo";
import Separator from "../components/relief/Separator";

function Login() {
  const { login } = useAuth();
  const { design } = useDesign();
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

  const fields = (
    <>
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

      {error && <p className="text-caption text-center text-destructive">{error}</p>}
    </>
  );

  if (design === "trace") {
    return (
      <div className="min-h-dvh flex flex-col">
        <HeroBand variant="login" />
        <div className="w-full max-w-sm mx-auto flex flex-col gap-6 px-5 py-6">
          <div className="flex flex-col gap-2">
            <h1 className="t-display">Sport Track</h1>
            <p className="t-body t-muted">Connecte-toi pour suivre tes séances et ta progression</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields}
            <Button type="submit" disabled={loading} className="w-full mt-2" trailing={<ArrowRight />}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="st-divider">
            <span className="t-label">ou</span>
          </div>

          <GoogleSignInButton />

          <p className="t-body t-muted text-center">
            Pas encore de compte ?{" "}
            <Link to="/inscription" className="font-bold text-foreground">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm flex flex-col gap-7 animate-rise">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo />
          <h1 className="rl-display rl-display--lg">Sport Track</h1>
          <p className="rl-body rl-muted">Connecte-toi pour suivre tes séances et ta progression</p>
        </div>

        <form onSubmit={handleSubmit} className="rl-card flex flex-col gap-4 p-6">
          {fields}
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Connexion..." : "Se connecter"}
            {!loading && <ArrowRight />}
          </Button>
        </form>

        <Separator />

        <GoogleSignInButton />

        <p className="rl-body rl-muted text-center">
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="font-bold text-foreground">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
