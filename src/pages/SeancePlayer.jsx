import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pause, Play, SkipForward, X } from "lucide-react";
import { circuits as circuitsApi } from "../lib/api";
import Button from "../components/ui/Button";
import { Loading, ErrorState, EmptyState } from "../components/ui/States";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function roundLabel(exercice, roundsLeft) {
  const parts = [];
  if (exercice.series > 0) parts.push(`Série ${exercice.series - roundsLeft + 1}/${exercice.series}`);
  if (exercice.nbRep) parts.push(`${exercice.nbRep} reps`);
  return parts.join(" · ");
}

function SeancePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circuit, setCircuit] = useState(null);
  const [error, setError] = useState(null);

  // Chaque exercice a ses propres séries restantes : la séance tourne en
  // rotation sur tous les exercices, et un exercice sort de la rotation une
  // fois ses séries épuisées (ex: pompes 2 séries, squats 1 série -> pompes,
  // squats, pompes, terminé).
  const [seriesLeft, setSeriesLeft] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("exercice"); // "exercice" | "repos" | "fin"
  const [remaining, setRemaining] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    circuitsApi
      .get(id)
      .then((c) => {
        setCircuit(c);
        setSeriesLeft(c.exercices.map((ex) => (ex.series > 0 ? ex.series : 1)));
        const first = c.exercices[0];
        setRemaining(first && first.duree > 0 ? first.duree : null);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const exercices = circuit?.exercices ?? [];
  const current = exercices[currentIndex];

  function findNextIndex(afterIndex, left) {
    for (let step = 1; step <= exercices.length; step++) {
      const idx = (afterIndex + step) % exercices.length;
      if (left[idx] > 0) return idx;
    }
    return null;
  }

  // Change de phase et initialise le compte à rebours dans la même mise à jour,
  // pour qu'aucun rendu n'associe la nouvelle phase à l'ancien temps restant
  // (sinon le minuteur voit remaining=0 en repos et saute le repos).
  function startPhase(nextPhase, idx) {
    const ex = exercices[idx];
    const secs = nextPhase === "repos" ? ex.tempsDeRepos : ex.duree;
    setCurrentIndex(idx);
    setPhase(nextPhase);
    setRemaining(secs > 0 ? secs : null);
  }

  function goToNext() {
    if (phase === "repos") {
      startPhase("exercice", findNextIndex(currentIndex, seriesLeft));
      return;
    }

    const left = [...seriesLeft];
    left[currentIndex] = Math.max(0, left[currentIndex] - 1);
    setSeriesLeft(left);

    if (!left.some((n) => n > 0)) {
      setPhase("fin");
    } else if (current.tempsDeRepos > 0) {
      startPhase("repos", currentIndex);
    } else {
      startPhase("exercice", findNextIndex(currentIndex, left));
    }
  }

  useEffect(() => {
    if (remaining === null || paused || phase === "fin") return;
    if (remaining <= 0) {
      goToNext();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, paused, phase]);

  if (error) return <ErrorState message={error} />;
  if (!circuit || !seriesLeft) return <Loading />;
  if (exercices.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center">
        <EmptyState title="Aucun exercice" subtitle="Cette séance n'a pas d'exercice à réaliser." />
        <Button onClick={() => navigate(`/seances/${id}`, { replace: true })}>Retour</Button>
      </div>
    );
  }

  if (phase === "fin") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-display">Séance terminée</h1>
        <p className="text-caption text-muted-foreground">{circuit.nom} est terminée, bien joué.</p>
        <Button onClick={() => navigate(`/seances/${id}`, { replace: true })}>Retour à la séance</Button>
      </div>
    );
  }

  const totalRounds = exercices.reduce((sum, ex) => sum + (ex.series > 0 ? ex.series : 1), 0);
  const roundsDone = totalRounds - seriesLeft.reduce((sum, n) => sum + n, 0);
  const nextIndex = phase === "repos" ? findNextIndex(currentIndex, seriesLeft) : null;
  const next = nextIndex !== null ? exercices[nextIndex] : null;
  const label = roundLabel(current, seriesLeft[currentIndex]);

  return (
    <div className="min-h-dvh flex flex-col px-6 py-6 gap-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/seances/${id}`, { replace: true })}
          aria-label="Quitter la séance"
          className="press flex items-center justify-center w-9 h-9 rounded-full bg-secondary"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="text-caption font-bold text-muted-foreground">
          {roundsDone} / {totalRounds}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
        {phase === "repos" ? (
          <>
            <p className="text-label text-muted-foreground">Repos</p>
            <p className="font-display text-[4.5rem] leading-none font-extrabold tracking-[-0.02em] tabular-nums">
              {formatTime(remaining ?? 0)}
            </p>
            {next && <p className="text-caption text-muted-foreground">Prochain exercice : {next.exercice}</p>}
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
            onClick={() => setPaused((p) => !p)}
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
