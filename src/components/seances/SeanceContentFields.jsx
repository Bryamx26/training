import { useState } from "react";
import { Trash2, Plus, ChevronUp } from "lucide-react";
import Button from "../ui/Button";
import Input, { Textarea, Select } from "../ui/Input";
import DifficultySelect from "./DifficultySelect";
import ExercicePicker from "./ExercicePicker";
import ExerciceOrderList from "./ExerciceOrderList";
import { TYPES, exerciceDraft } from "../../lib/exerciceForm";

// Nombre de fiches d'exercice affichées avant « Voir les autres », pour alléger le formulaire.
const APERCU_EXERCICES = 2;

// Contenu d'une séance, partagé par le formulaire de séance et celui des
// templates : nom, type, difficulté et exercices avec leurs paramètres.
// `value` = { nom, type, niveau, exercices } ; `onChange(nouvelleValeur)`.
// L'ordre du tableau `exercices` est celui de la séance (réglable par glisser-déposer).
// `nameLabel` adapte le libellé du nom ; `afterMeta` s'insère avant les exercices
// (la date pour une séance).
function SeanceContentFields({ value, onChange, nameLabel = "Nom de la séance", afterMeta }) {
  const set = (field) => (v) => onChange({ ...value, [field]: v });
  const [toutAfficher, setToutAfficher] = useState(false);
  const nbExercices = value.exercices.length;
  const fichesVisibles = toutAfficher ? value.exercices : value.exercices.slice(0, APERCU_EXERCICES);
  const nbMasques = nbExercices - APERCU_EXERCICES;

  function updateExercice(key, field, v) {
    onChange({ ...value, exercices: value.exercices.map((ex) => (ex.key === key ? { ...ex, [field]: v } : ex)) });
  }

  function addExercice(entry) {
    onChange({ ...value, exercices: [...value.exercices, exerciceDraft(entry)] });
    // Un exercice ajouté au-delà de l'aperçu doit rester visible pour saisir ses paramètres.
    if (nbExercices >= APERCU_EXERCICES) setToutAfficher(true);
  }

  function removeExercice(key) {
    onChange({ ...value, exercices: value.exercices.filter((ex) => ex.key !== key) });
  }

  function reorderExercices(exercices) {
    onChange({ ...value, exercices });
  }

  return (
    <>
      <Input label={nameLabel} placeholder="Renforcement" value={value.nom} onChange={(e) => set("nom")(e.target.value)} required />

      <div className="grid grid-cols-2 gap-3 items-start">
        <Select label="Type" value={value.type} onChange={(e) => set("type")(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <DifficultySelect value={value.niveau} onChange={set("niveau")} />
      </div>

      {afterMeta}

      <div className="flex flex-col gap-3">
        <span className="text-label text-muted-foreground">Exercices</span>
        <ExercicePicker exercices={value.exercices} onAdd={addExercice} />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-label text-muted-foreground">Ordre de la séance</span>
        {nbExercices === 0 ? (
          <p className="text-caption text-muted-foreground">Aucun exercice ajouté pour le moment.</p>
        ) : (
          <>
            {nbExercices > 1 && (
              <p className="text-caption text-muted-foreground">Fais glisser la poignée pour réorganiser les exercices.</p>
            )}
            <ExerciceOrderList exercices={value.exercices} onReorder={reorderExercices} onRemove={removeExercice} />
          </>
        )}
      </div>

      {nbExercices > 0 && (
        <div className="flex flex-col gap-4">
          {fichesVisibles.map((ex, i) => (
            <div key={ex.key} className="card-surface p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold truncate">
                  {i + 1}. {ex.exercice}
                </span>
                <button type="button" onClick={() => removeExercice(ex.key)} className="press p-2" aria-label={`Retirer ${ex.exercice}`}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
              <Textarea placeholder="Consignes" rows={2} value={ex.consignes} onChange={(e) => updateExercice(ex.key, "consignes", e.target.value)} />
              <Input placeholder="Objectif" value={ex.objectif} onChange={(e) => updateExercice(ex.key, "objectif", e.target.value)} />
              <div className="grid grid-cols-4 gap-2">
                <Input aria-label="Séries" placeholder="Séries" inputMode="numeric" value={ex.series} onChange={(e) => updateExercice(ex.key, "series", e.target.value)} />
                <Input aria-label="Répétitions" placeholder="Reps" inputMode="numeric" value={ex.nbRep} onChange={(e) => updateExercice(ex.key, "nbRep", e.target.value)} />
                <Input aria-label="Durée (s)" placeholder="Durée(s)" inputMode="numeric" value={ex.duree} onChange={(e) => updateExercice(ex.key, "duree", e.target.value)} />
                <Input aria-label="Repos (s)" placeholder="Repos(s)" inputMode="numeric" value={ex.tempsDeRepos} onChange={(e) => updateExercice(ex.key, "tempsDeRepos", e.target.value)} />
              </div>
            </div>
          ))}
          {nbMasques > 0 && (
            <Button variant="outline" onClick={() => setToutAfficher((v) => !v)} aria-expanded={toutAfficher}>
              {toutAfficher ? (
                <>
                  Voir moins <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {nbMasques === 1 ? "Voir l'autre exercice" : `Voir les ${nbMasques} autres exercices`}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export default SeanceContentFields;
