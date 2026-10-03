import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDesign } from "../context/DesignContext";
import { circuits as circuitsApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import Button from "../components/ui/Button";
import SeanceCard from "../components/seances/SeanceCard";
import { Loading, EmptyState, ErrorState } from "../components/ui/States";
import SearchField from "../components/ui/SearchField";
import FilterChips from "../components/trace/FilterChips";
import SegmentedControl from "../components/relief/SegmentedControl";

const FILTRES = [
  { value: "toutes", label: "Toutes" },
  { value: "avenir", label: "À venir" },
  { value: "terminees", label: "Terminées" },
];

// Nombre de séances affichées avant « Voir tout », pour garder l'écran lisible.
const APERCU = 3;

function isUpcoming(circuit) {
  return new Date(circuit.date) >= new Date(new Date().toDateString());
}

function Seances() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const { design } = useDesign();
  const [statut, setStatut] = useState("toutes");
  const [toutAfficher, setToutAfficher] = useState(false);

  // Une nouvelle recherche ou un nouveau filtre repart sur l'aperçu.
  useEffect(() => setToutAfficher(false), [query, statut]);

  useEffect(() => {
    circuitsApi
      .list(isAdmin ? {} : { profilId: user.id })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [user.id, isAdmin]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const parStatut = statut === "toutes" ? data : data.filter((c) => isUpcoming(c) === (statut === "avenir"));
    if (!q) return parStatut;
    return parStatut.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.exercices?.some((ex) => ex.exercice.toLowerCase().includes(q))
    );
  }, [data, query, statut]);

  return (
    <div>
      <TopAppBar
        title="Séances"
        action={
          isAdmin && (
            <button
              onClick={() => navigate("/seances/nouvelle")}
              className="press flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground st-iconbutton st-iconbutton--primary"
              aria-label="Créer une séance"
            >
              <Plus className="w-5 h-5" />
            </button>
          )
        }
      />

      <div className="px-5 pb-4">
        <SearchField value={query} onChange={setQuery} placeholder="Rechercher une séance ou un exercice" />
        <div className="mt-3">
          {design === "trace" ? (
            <FilterChips options={FILTRES} value={statut} onChange={setStatut} label="Filtrer les séances" />
          ) : (
            <SegmentedControl options={FILTRES} value={statut} onChange={setStatut} label="Filtrer les séances" />
          )}
        </div>
      </div>

      <div className={`px-5 flex flex-col ${design === "trace" ? "gap-3" : "gap-4"}`}>
        {error && <ErrorState message={error} />}
        {!error && !data && <Loading />}
        {data && filtered.length === 0 && (
          <EmptyState
            title="Aucune séance"
            subtitle={isAdmin ? "Crée ta première séance pour l'attribuer à tes sportifs." : "Aucune séance ne t'a encore été attribuée."}
          />
        )}
        {(toutAfficher ? filtered : filtered.slice(0, APERCU)).map((circuit) => (
          <SeanceCard key={circuit.id} circuit={circuit} showParticipants={isAdmin} profilId={isAdmin ? null : user.id} />
        ))}
        {filtered.length > APERCU && (
          <Button variant="outline" onClick={() => setToutAfficher((v) => !v)} aria-expanded={toutAfficher}>
            {toutAfficher ? (
              <>
                Voir moins <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Voir tout ({filtered.length})
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default Seances;
