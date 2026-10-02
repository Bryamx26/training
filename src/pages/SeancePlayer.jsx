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

function SeancePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circuit, setCircuit] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("exercice"); // "exercice" | "repos" | "fin"
  const [remaining, setRemaining] = useState(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    circuitsApi.get(id).then(setCircuit).catch((e) => setError(e.message));
  }, [id]);

  const exercices = circuit?.exercices ?? [];
  const current = exercices[index];

  // Initialise le compte à rebours à chaque changement d'exercice ou de phase.
  useEffect(() => {
    if (!current) return;
    if (phase === "exercice") {
      setRemaining(current.duree > 0 ? current.duree : null);
    } else if (phase === "repos") {
      setRemaining(current.tempsDeRepos > 0 ? current.tempsDeRepos : null);
    }
  }, [index, phase, current]);

  function advance() {
    if (index < exercices.length - 1) {
      setIndex((i) => i + 1);
      setPhase("exercice");
    } else {
      setPhase("fin");
    }
  }

  function goToNext() {
    if (phase === "exercice" && current.tempsDeRepos > 0 && index < exercices.length - 1) {
      setPhase("repos");
    } else {
      advance();
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
  if (!circuit) return <Loading />;
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

  const next = exercices[index + 1];

  return (
    <div className="min-h-dvh flex flex-col px-6 py-6 gap-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/seances/${id}`, { replace: true })}
          aria-label="Quitter la séance"
          className="press flex items-center justify-center w-9 h-9 rounded-full"
          style={{ background: "var(--color-secondary)" }}
        >
          <X className="w-4 h-4" />
        </button>
        <span className="text-caption font-bold text-muted-foreground">
          {index + 1} / {exercices.length}
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
            <p className="text-label text-muted-foreground">Exercice {index + 1}</p>
            <h1 className="text-display">{current.exercice}</h1>
            {current.consignes && <p className="text-caption text-muted-foreground max-w-xs">{current.consignes}</p>}
            {remaining !== null ? (
              <p className="font-display text-[4.5rem] leading-none font-extrabold tracking-[-0.02em] tabular-nums">
                {formatTime(remaining)}
              </p>
            ) : (
              <p className="text-h2 text-muted-foreground">
                {current.series && current.nbRep
                  ? `${current.series} séries x ${current.nbRep} reps`
                  : "Appuie sur Suivant une fois terminé"}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {remaining !== null && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Reprendre" : "Pause"}
            className="press flex items-center justify-center w-14 h-14 rounded-full shrink-0"
            style={{ background: "var(--color-secondary)" }}
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
