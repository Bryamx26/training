import { useEffect, useState } from "react";

// Valeur qui ne suit `value` qu'après `delay` ms sans changement (ex. une
// recherche envoyée à l'API seulement quand la personne arrête de taper).
export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
