import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pause, Play, SkipForward, X, Check, CloudOff } from "lucide-react";
import { circuits as circuitsApi } from "../lib/api";
import Button from "../components/ui/Button";
import { Loading, ErrorState, EmptyState } from "../components/ui/States";
import { formatLest } from "../lib/exerciceForm";
import { initialSeriesLeft, nextState, phaseDuration, plannedSet, roundsOf, totalRounds } from "../lib/playerRotation";
import { saveRealisation } from "../lib/offlineQueue";
import { beep, unlockAudio, vibrate } from "../lib/feedback";
import useWakeLock from "../hooks/useWakeLock";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function roundLabel(exercice, roundsLeft) {
  const parts = [];
  if (exercice.series > 0) parts.push(`Série ${exercice.series - roundsLeft + 1}/${exercice.series}`);
  if (exercice.nbRep) parts.push(`${exercice.nbRep} reps`);
  if (formatLest(exercice.lest)) parts.push(`lest ${formatLest(exercice.lest)}`);
  return parts.join(" · ");
}

// Un exercice « compté » (répétitions ou charge) se saisit en reps / kg ;
// un exercice uniquement chronométré (gainage…) n'a rien à saisir.
function isCounted(exercice) {
  return Boolean(exercice.nbRep || exercice.lest);
}

const numberOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(",", ".")));

// Champs « reps » et « kg » d'une série réalisée. `showLabels=false` : libellés
// réservés aux lecteurs d'écran (lignes suivantes d'un tableau de séries).
function SetInputs({ set, onChange, compact = false, showLabels = true }) {
  const labelText = showLabels ? "" : "sr-only";
  const field = "w-full rounded-xl border border-input bg-popover px-3 py-2 text-sm text-center tabular-nums outline-none focus:ring-2 focus:ring-ring st-input";
  return (
    <div className={`grid grid-cols-2 gap-2 ${compact ? "w-40" : "w-56"}`}>
      <label className="flex flex-col gap-1 text-caption text-muted-foreground">
        <span className={labelText}>Reps</span>
        <input
          className={field}
          inputMode="numeric"
          value={set.reps ?? ""}
          onChange={(e) => onChange({ ...set, reps: e.target.value === "" ? null : e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-caption text-muted-foreground">
        <span className={labelText}>Kg</span>
        <input
          className={field}
          inputMode="decimal"
          value={set.lest ?? ""}
          onChange={(e) => onChange({ ...set, lest: e.target.value === "" ? null : e.target.value })}
        />
      </label>
    </div>
  );
}

// Écran de fin : récapitulatif modifiable des séries et enregistrement.
function FinSeance({ circuit, log, setLog, onQuit }) {
  const [status, setStatus] = useState(null); // null | "saving" | "saved" | "queued"
  const [error, setError] = useState(null);

  function updateSet(i, set) {
    setLog((l) => l.map((s, j) => (j === i ? set : s)));
  }

  async function handleSave() {
    setStatus("saving");
    setError(null);
    try {
      const series = log.map((s) => ({ ...s, reps: numberOrNull(s.reps), lest: numberOrNull(s.lest) }));
      setStatus(await saveRealisation(circuit.id, { series }));
    } catch (err) {
      setError(err.message);
      setStatus(null);
    }
  }

  const byExercice = circuit.exercices
    .map((ex) => ({ ex, sets: log.map((s, i) => ({ s, i })).filter(({ s }) => s.exerciceId === ex.id) }))
    .filter((g) => g.sets.length > 0);

  if (status === "saved" || status === "queued") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-5 px-6 text-center">
        {status === "saved" ? <Check className="w-10 h-10 text-success" /> : <CloudOff className="w-10 h-10 text-muted-foreground" />}
        <h1 className="text-display">{status === "saved" ? "Séance enregistrée" : "Enregistrée hors ligne"}</h1>
        <p className="text-caption text-muted-foreground max-w-xs">
          {status === "saved"
            ? "Ton coach peut voir ce que tu as réalisé."
            : "Pas de connexion : ta séance sera envoyée automatiquement dès que le réseau reviendra."}
        </p>
        <Button onClick={onQuit}>Retour à la séance</Button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh max-w-xl mx-auto flex flex-col gap-6 px-6 py-8">
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-display">Séance terminée</h1>
        <p className="text-caption text-muted-foreground">{circuit.nom} est terminée, bien joué. Vérifie ce que tu as réalisé.</p>
      </div>

      <div className="flex flex-col gap-4">
        {byExercice.map(({ ex, sets }) => (
          <div key={ex.id} className="card-surface p-4 flex flex-col gap-3">
            <h2 className="text-h3">{ex.exercice}</h2>
            {sets.map(({ s, i }, rang) => (
              <div key={i} className="flex items-end justify-between gap-3">
                <span className="text-sm font-semibold pb-2">Série {s.serie}</span>
                {isCounted(ex) ? (
                  <SetInputs set={s} onChange={(set) => updateSet(i, set)} compact showLabels={rang === 0} />
                ) : (
                  <span className="text-sm text-muted-foreground pb-2">{s.duree ? formatTime(s.duree) : "Faite"}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>


      {error && <p className="text-caption text-center text-destructive">{error}</p>}

      <div className="flex flex-col gap-3">
        <Button onClick={handleSave} disabled={status === "saving"}>
          {status === "saving" ? "Enregistrement..." : "Enregistrer ma séance"}
        </Button>
        <Button variant="ghost" onClick={onQuit}>
          Quitter sans enregistrer
        </Button>
      </div>
    </div>
  );
}

function SeancePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circuit, setCircuit] = useState(null);
  const [error, setError] = useState(null);

  const [seriesLeft, setSeriesLeft] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("exercice"); // "exercice" | "repos" | "fin"
  const [remaining, setRemaining] = useState(null);
  const [paused, setPaused] = useState(false);
  // Séries réalisées, pré-remplies avec les valeurs prévues et modifiables.
  const [log, setLog] = useState([]);

  useWakeLock(phase !== "fin");

  useEffect(() => {
    circuitsApi
      .get(id)
      .then((c) => {
        setCircuit(c);
        setSeriesLeft(initialSeriesLeft(c.exercices));
        if (c.exercices[0]) setRemaining(phaseDuration(c.exercices[0], "exercice"));
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const exercices = circuit?.exercices ?? [];
  const current = exercices[currentIndex];

  function goToNext() {
    unlockAudio();
    const next = nextState(exercices, { index: currentIndex, phase, left: seriesLeft });
    if (next.finishedSet) {
      setLog((l) => [...l, plannedSet(exercices[next.finishedSet.index], next.finishedSet.serie)]);
    }
    // Phase et compte à rebours changent dans la même mise à jour, pour
    // qu'aucun rendu n'associe la nouvelle phase à l'ancien temps restant.
    setSeriesLeft(next.left);
    setCurrentIndex(next.index);
    setPhase(next.phase);
    setRemaining(next.phase === "fin" ? null : phaseDuration(exercices[next.index], next.phase));
    if (next.phase === "fin") vibrate([200, 100, 200]);
  }

  useEffect(() => {
    if (remaining === null || paused || phase === "fin") return;
    if (remaining <= 0) {
      beep({ long: true });
      vibrate(300);
      goToNext();
      return;
    }
    if (remaining <= 3) beep();
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, paused, phase]);

  const quit = () => navigate(`/seances/${id}`, { replace: true });

  if (error) return <ErrorState message={error} />;
  if (!circuit || !seriesLeft) return <Loading />;
  if (exercices.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center">
        <EmptyState title="Aucun exercice" subtitle="Cette séance n'a pas d'exercice à réaliser." />
        <Button onClick={quit}>Retour</Button>
      </div>
    );
  }

  if (phase === "fin") return <FinSeance circuit={circuit} log={log} setLog={setLog} onQuit={quit} />;

  const total = totalRounds(exercices);
  const roundsDone = total - seriesLeft.reduce((sum, n) => sum + n, 0);
  const next = phase === "repos" ? exercices[nextState(exercices, { index: currentIndex, phase, left: seriesLeft }).index] : null;
  const label = roundLabel(current, seriesLeft[currentIndex]);
  const lastSet = log[log.length - 1];
  const lastExercice = lastSet && exercices.find((ex) => ex.id === lastSet.exerciceId);

  return (
    <div className="min-h-dvh flex flex-col px-6 py-6 gap-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={quit}
          aria-label="Quitter la séance"
          className="press flex items-center justify-center w-9 h-9 rounded-full bg-secondary"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="text-caption font-bold text-muted-foreground">
          {roundsDone} / {total}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
        {phase === "repos" ? (
          <>
            <p className="text-label text-muted-foreground">Repos</p>
            <p className="font-display text-[4.5rem] leading-none font-extrabold tracking-[-0.02em] tabular-nums" aria-live="off">
              {formatTime(remaining ?? 0)}
            </p>
            {next && <p className="text-caption text-muted-foreground">Prochain exercice : {next.exercice}</p>}
            {lastExercice && isCounted(lastExercice) && (
              <div className="card-surface p-4 flex flex-col items-center gap-3 mt-2">
                <p className="text-sm font-semibold">
                  {lastExercice.exercice} · série {lastSet.serie}/{roundsOf(lastExercice)} réalisée
                </p>
                <SetInputs set={lastSet} onChange={(set) => setLog((l) => [...l.slice(0, -1), set])} />
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-display">{current.exercice}</h1>
            {current.consignes && <p className="text-caption text-muted-foreground max-w-xs">{current.consignes}</p>}
            {label && <p className="text-h2 text-muted-foreground">{label}</p>}
            {remaining !== null ? (
              <p className="font-display text-[4.5rem] leading-none font-extrabold tracking-[-0.02em] tabular-nums">
                {formatTime(remaining)}
              </p>
            ) : !label ? (
              <p className="text-h2 text-muted-foreground">Appuie sur Suivant une fois terminé</p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {remaining !== null && (
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setPaused((p) => !p);
            }}
            aria-label={paused ? "Reprendre" : "Pause"}
            className="press flex items-center justify-center w-14 h-14 rounded-full shrink-0 bg-secondary"
          >
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
        )}
        <Button onClick={goToNext} className="flex-1">
          <SkipForward className="w-4 h-4" />
          {phase === "repos" ? "Passer le repos" : "Suivant"}
        </Button>
      </div>
    </div>
  );
}

export default SeancePlayer;
