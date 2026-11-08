import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDesign } from "../../context/DesignContext";
import Button from "../ui/Button";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", resolve, { once: true }));
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const { design } = useDesign();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [error, setError] = useState(null);
  // Le script Google n'est chargé qu'après un clic : avant, aucune donnée
  // (adresse IP, cookies Google) n'est transmise à Google.
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !activated) return;
    let cancelled = false;

    loadGoogleScript().then(() => {
      if (cancelled || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            await loginWithGoogle(response.credential);
            navigate("/", { replace: true });
          } catch (err) {
            setError(err.message);
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        locale: "fr",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activated, loginWithGoogle, navigate]);

  if (!CLIENT_ID) {
    if (design === "relief") {
      return (
        <Button variant="soft" disabled className="w-full">
          Connexion Google non configurée
        </Button>
      );
    }
    return <p className="text-caption text-center text-muted-foreground">Connexion Google non configurée.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {activated ? (
        <div ref={buttonRef} className="min-h-[44px] flex items-center">
          <span className="text-caption text-muted-foreground">Chargement de Google…</span>
        </div>
      ) : (
        <Button variant={design === "relief" ? "soft" : "outline"} onClick={() => setActivated(true)} className="w-full">
          Continuer avec Google
        </Button>
      )}
      <p className="text-caption text-center text-muted-foreground">
        {activated ? "Le bouton Google est chargé : clique dessus pour continuer. " : ""}
        En continuant avec Google, tu acceptes les{" "}
        <Link to="/legal/cgu" className="underline">
          conditions d'utilisation
        </Link>{" "}
        et la{" "}
        <Link to="/legal/confidentialite" className="underline">
          politique de confidentialité
        </Link>
        .
      </p>
      {error && <p className="text-caption text-center text-destructive">{error}</p>}
    </div>
  );
}

export default GoogleSignInButton;
