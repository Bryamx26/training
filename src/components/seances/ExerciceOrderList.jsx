import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { useDesign } from "../../context/DesignContext";

// Ligne déplaçable. Seule la poignée lance le glisser, pour ne pas gêner le
// défilement au doigt ni le clic sur « Retirer ».
function SortableRow({ exercice, position, onRemove, rowClass }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: exercice.key,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${rowClass} flex items-center gap-2 ${isDragging ? "relative z-10 opacity-80" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Déplacer ${exercice.exercice}, position ${position}`}
        className="flex items-center justify-center w-11 h-11 -my-2 shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="text-sm font-bold w-6 shrink-0 tabular-nums">{position}.</span>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">{exercice.exercice}</span>
      <button
        type="button"
        onClick={() => onRemove(exercice.key)}
        aria-label={`Retirer ${exercice.exercice} (position ${position})`}
        className="flex items-center justify-center w-11 h-11 -my-2 shrink-0 text-muted-foreground hover:text-destructive"
      >
        <X className="w-4 h-4" />
      </button>
    </li>
  );
}

// Ordre des exercices de la séance, réorganisable par glisser-déposer (souris,
// doigt) ou au clavier (Espace pour saisir, flèches pour déplacer, Espace pour
// déposer). L'ordre affiché est celui enregistré.
function ExerciceOrderList({ exercices, onReorder, onRemove }) {
  const { design } = useDesign();
  const sensors = useSensors(
    // Petit seuil : un simple appui sur la poignée ne déclenche pas de déplacement.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const nameOf = (id) => exercices.find((ex) => ex.key === id)?.exercice ?? "";
  const positionOf = (id) => exercices.findIndex((ex) => ex.key === id) + 1;

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(exercices, positionOf(active.id) - 1, positionOf(over.id) - 1));
  }

  const accessibility = {
    screenReaderInstructions: {
      draggable:
        "Pour déplacer un exercice, appuie sur Espace ou Entrée, utilise les flèches haut et bas, puis appuie de nouveau sur Espace ou Entrée pour le déposer. Échap annule.",
    },
    announcements: {
      onDragStart: ({ active }) => `${nameOf(active.id)} saisi, position ${positionOf(active.id)}.`,
      onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} au-dessus de la position ${positionOf(over.id)}.` : undefined),
      onDragEnd: ({ active, over }) => (over ? `${nameOf(active.id)} déposé en position ${positionOf(over.id)}.` : `${nameOf(active.id)} déposé.`),
      onDragCancel: ({ active }) => `Déplacement annulé, ${nameOf(active.id)} reste en position ${positionOf(active.id)}.`,
    },
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      accessibility={accessibility}
    >
      <SortableContext items={exercices.map((ex) => ex.key)} strategy={verticalListSortingStrategy}>
        <ol className={design === "trace" ? "st-list" : "flex flex-col gap-3"} aria-label="Ordre des exercices">
          {exercices.map((ex, i) => (
            <SortableRow
              key={ex.key}
              exercice={ex}
              position={i + 1}
              onRemove={onRemove}
              rowClass={design === "trace" ? "st-row" : "rl-row"}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

export default ExerciceOrderList;
