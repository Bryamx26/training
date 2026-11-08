import { Link } from "react-router-dom";
import { LEGAL_DOCS } from "../../config/legal";

// Liens vers les documents légaux, en pied des pages publiques (connexion, inscription).
function LegalLinks() {
  return (
    <nav aria-label="Informations légales" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
      {LEGAL_DOCS.map((d) => (
        <Link key={d.slug} to={`/legal/${d.slug}`} className="underline underline-offset-2">
          {d.title}
        </Link>
      ))}
    </nav>
  );
}

export default LegalLinks;
