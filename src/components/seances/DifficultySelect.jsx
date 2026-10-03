import { useEffect, useRef, useState } from "react";
import Input, { Select } from "../ui/Input";
import { DIFFICULTES } from "../../lib/exerciceForm";

const AUTRE = "__autre__";

// Difficulté : valeur prédéfinie, ou texte libre avec « Autre ». `value` est
// toujours la chaîne envoyée à l'API (prédéfinie ou saisie).
function DifficultySelect({ value, onChange }) {
  const isCustomValue = Boolean(value) && !DIFFICULTES.includes(value);
  // « Autre » choisi mais encore vide : il faut le retenir, `value` vaut "".
  const [custom, setCustom] = useState(isCustomValue);
  const customRef = useRef(null);

  // Valeur chargée de l'extérieur (séance modifiée, template appliqué).
  useEffect(() => {
    if (isCustomValue) setCustom(true);
  }, [isCustomValue]);

  function handleSelect(e) {
    if (e.target.value === AUTRE) {
      setCustom(true);
      onChange("");
      requestAnimationFrame(() => customRef.current?.focus());
    } else {
      setCustom(false);
      onChange(e.target.value);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Select label="Difficulté" value={custom ? AUTRE : value} onChange={handleSelect}>
        <option value="">Non précisée</option>
        {DIFFICULTES.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
        <option value={AUTRE}>Autre…</option>
      </Select>
      {custom && (
        <Input
          ref={customRef}
          aria-label="Difficulté personnalisée"
          placeholder="Ex : Reprise après blessure"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      )}
    </div>
  );
}

export default DifficultySelect;
