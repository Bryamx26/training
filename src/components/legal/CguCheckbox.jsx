import { Link } from "react-router-dom";

// Case obligatoire de l'inscription : acceptation des CGU et de la politique
// de confidentialité (l'API refuse l'inscription sans elle et date l'accord).
function CguCheckbox({ checked, onChange }) {
  return (
    <label className="flex items-start gap-3 text-caption leading-snug cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--color-primary)]"
      />
      <span>
        J'ai au moins 15 ans (ou l'accord d'un parent) et j'accepte les{" "}
        <Link to="/legal/cgu" className="font-bold underline">
          conditions d'utilisation
        </Link>{" "}
        et la{" "}
        <Link to="/legal/confidentialite" className="font-bold underline">
          politique de confidentialité
        </Link>
        .
      </span>
    </label>
  );
}

export default CguCheckbox;
