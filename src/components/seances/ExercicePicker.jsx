import { useEffect, useMemo, useState } from "react";
import { Plus, ChevronUp } from "lucide-react";
import { exercices as exercicesApi } from "../../lib/api";
import { sameName } from "../../lib/exerciceForm";
import Button from "../ui/Button";
import Chip from "../ui/Chip";
import Input from "../ui/Input";
import SearchField from "../ui/SearchField";

// Exercices du catalogue affichés avant « Afficher plus », pour alléger le formulaire.
const APERCU_CATALOGUE = 3;

// Empêche Entrée de soumettre le formulaire de séance depuis les champs du sélecteur.
function onEnter(action) {
  return (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    action?.();
  };
}

// Ajout d'exercices : catalogue filtrable (exercices de base + ceux déjà
// utilisés par le coach) et option « Autre » pour un nom libre. Un même
// exercice peut être ajouté plusieurs fois ; la puce indique combien de fois.
// `exercices` : exercices déjà dans la séance ; `onAdd(entrée | { exercice })`.
function ExercicePicker({ exercices, onAdd }) {
  const [catalogue, setCatalogue] = useState(null);
  const [catalogueError, setCatalogueError] = useState(null);
  const [query, setQuery] = useState("");
  const [toutAfficher, setToutAfficher] = useState(false);
  const [autre, setAutre] = useState("");
  const [autreError, setAutreError] = useState(null);

  useEffect(() => {
    exercicesApi.catalogue().then(setCatalogue, (e) => setCatalogueError(e.message));
  }, []);

  const count = (name) => exercices.filter((ex) => sameName(ex.exercice, name)).length;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalogue ?? [];
    return q ? list.filter((c) => c.exercice.toLowerCase().includes(q)) : list;
  }, [catalogue, query]);

  function addAutre() {
    const name = autre.trim();
    if (!name) return setAutreError("Saisis le nom de l'exercice.");
    onAdd({ exercice: name });
    setAutre("");
    setAutreError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchField
        value={query}
        onChange={(q) => {
          setQuery(q);
          setToutAfficher(false);
        }}
        onKeyDown={onEnter()}
        placeholder="Rechercher un exercice"
      />

      {catalogueError && <p className="text-caption text-destructive">Catalogue indisponible : {catalogueError}</p>}
      {!catalogue && !catalogueError && <p className="text-caption text-muted-foreground">Chargement des exercices…</p>}
      {catalogue && suggestions.length === 0 && (
        <p className="text-caption text-muted-foreground">Aucun exercice ne correspond : ajoute-le avec « Autre ».</p>
      )}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Catalogue d'exercices">
          {(toutAfficher ? suggestions : suggestions.slice(0, APERCU_CATALOGUE)).map((entry) => (
            <Chip
              key={entry.exercice}
              onClick={() => onAdd(entry)}
              badge={count(entry.exercice) > 0 ? `×${count(entry.exercice)}` : null}
              aria-label={`Ajouter ${entry.exercice}${count(entry.exercice) ? ` (déjà ${count(entry.exercice)} fois dans la séance)` : ""}`}
            >
              <Plus className="w-3.5 h-3.5" />
              {entry.exercice}
            </Chip>
          ))}
        </div>
      )}
      {suggestions.length > APERCU_CATALOGUE && (
        <Button variant="outline" size="sm" onClick={() => setToutAfficher((v) => !v)} aria-expanded={toutAfficher} className="self-start">
          {toutAfficher ? (
            <>
              Afficher moins <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Afficher plus ({suggestions.length - APERCU_CATALOGUE})
            </>
          )}
        </Button>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Autre"
              placeholder="Nom d'un exercice personnalisé"
              value={autre}
              onChange={(e) => {
                setAutre(e.target.value);
                setAutreError(null);
              }}
              onKeyDown={onEnter(addAutre)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={addAutre} aria-label="Ajouter l'exercice personnalisé">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
        {autreError && <p className="text-caption text-destructive">{autreError}</p>}
      </div>
    </div>
  );
}

export default ExercicePicker;
