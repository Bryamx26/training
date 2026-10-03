import { useEffect, useRef, useState } from "react";
import { coaches as coachesApi, me as meApi } from "../../lib/api";
import { useDesign } from "../../context/DesignContext";
import SearchField from "../ui/SearchField";
import { Loading, EmptyState, ErrorState } from "../ui/States";
import CoachCard from "./CoachCard";

const SEARCH_DELAY_MS = 300;

function SectionLabel({ children }) {
  return <p className="text-label text-muted-foreground t-label rl-label mb-3">{children}</p>;
}

// Vue Social d'un sportif : recherche de coachs, abonnement et « Mes coachs ».
function CoachFinder() {
  const { design } = useDesign();
  const listClass = design === "trace" ? "st-list" : "flex flex-col gap-3";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [myCoaches, setMyCoaches] = useState(null);
  const [myCoachesError, setMyCoachesError] = useState(null);
  // Action en cours et dernière erreur, par id de coach.
  const [pending, setPending] = useState({});
  const [errors, setErrors] = useState({});
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
    meApi.coaches().then(setMyCoaches, (e) => setMyCoachesError(e.message));
  }, []);

  // Recherche différée pendant la frappe ; une réponse obsolète est ignorée.
  useEffect(() => {
    let stale = false;
    setResults(null);
    setSearchError(null);
    const timer = setTimeout(() => {
      coachesApi.search(query.trim()).then(
        (data) => !stale && setResults(data),
        (e) => !stale && setSearchError(e.message)
      );
    }, SEARCH_DELAY_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Met à jour l'état « abonné » d'un coach partout où il apparaît.
  function applySubscribed(coach, subscribed) {
    setResults((list) => list?.map((c) => (c.id === coach.id ? { ...c, subscribed } : c)));
    setMyCoaches((list) => {
      const others = (list ?? []).filter((c) => c.id !== coach.id);
      return subscribed ? [{ ...coach, subscribed: true }, ...others] : others;
    });
  }

  async function runAction(coach, kind) {
    setPending((p) => ({ ...p, [coach.id]: kind }));
    setErrors((e) => ({ ...e, [coach.id]: null }));
    try {
      if (kind === "subscribe") await coachesApi.subscribe(coach.id);
      else await coachesApi.unsubscribe(coach.id);
      applySubscribed(coach, kind === "subscribe");
    } catch (err) {
      // L'état réel diffère de l'affichage (autre onglet…) : on le resynchronise.
      if (err.code === "ALREADY_SUBSCRIBED") applySubscribed(coach, true);
      else if (err.code === "SUBSCRIPTION_NOT_FOUND") applySubscribed(coach, false);
      else setErrors((e) => ({ ...e, [coach.id]: err.message }));
    } finally {
      setPending((p) => ({ ...p, [coach.id]: undefined }));
    }
  }

  const card = (coach) => (
    <CoachCard
      key={coach.id}
      coach={coach}
      pending={pending[coach.id]}
      error={errors[coach.id]}
      onSubscribe={(c) => runAction(c, "subscribe")}
      onUnsubscribe={(c) => runAction(c, "unsubscribe")}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <SearchField ref={searchRef} type="search" value={query} onChange={setQuery} placeholder="Rechercher un coach" />

      <section aria-label="Résultats de la recherche" aria-busy={!results && !searchError}>
        <SectionLabel>{query.trim() ? "Résultats" : "Coachs"}</SectionLabel>
        {searchError && <ErrorState message={searchError} />}
        {!searchError && !results && <Loading label="Recherche…" />}
        {results?.length === 0 && <EmptyState title="Aucun coach trouvé" subtitle="Essaie avec un autre prénom ou nom." />}
        {results?.length > 0 && <div className={listClass}>{results.map(card)}</div>}
      </section>

      <section aria-label="Mes coachs">
        <SectionLabel>Mes coachs</SectionLabel>
        {myCoachesError && <ErrorState message={myCoachesError} />}
        {!myCoachesError && !myCoaches && <Loading />}
        {myCoaches?.length === 0 && (
          <p className="text-caption text-muted-foreground">Tu ne suis aucun coach pour le moment.</p>
        )}
        {myCoaches?.length > 0 && <div className={listClass}>{myCoaches.map(card)}</div>}
      </section>
    </div>
  );
}

export default CoachFinder;
