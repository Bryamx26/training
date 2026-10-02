import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { circuits as circuitsApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import SeanceCard from "../components/seances/SeanceCard";
import { Loading, EmptyState, ErrorState } from "../components/ui/States";

function Seances() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    circuitsApi
      .list(isAdmin ? {} : { profilId: user.id })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [user.id, isAdmin]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.exercices?.some((ex) => ex.exercice.toLowerCase().includes(q))
    );
  }, [data, query]);

  return (
    <div>
      <TopAppBar
        title="Séances"
        action={
          isAdmin && (
            <button
              onClick={() => navigate("/seances/nouvelle")}
              className="press flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground"
              aria-label="Créer une séance"
            >
              <Plus className="w-5 h-5" />
            </button>
          )
        }
      />

      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une séance ou un exercice"
            className="w-full rounded-2xl border border-input bg-popover pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {error && <ErrorState message={error} />}
        {!error && !data && <Loading />}
        {data && filtered.length === 0 && (
          <EmptyState
            title="Aucune séance"
            subtitle={isAdmin ? "Crée ta première séance pour l'attribuer à tes sportifs." : "Aucune séance ne t'a encore été attribuée."}
          />
        )}
        {filtered.map((circuit) => (
          <SeanceCard key={circuit.id} circuit={circuit} showParticipants={isAdmin} profilId={isAdmin ? null : user.id} />
        ))}
      </div>
    </div>
  );
}

export default Seances;
