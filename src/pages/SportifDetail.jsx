import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { profils as profilsApi } from "../lib/api";
import TopAppBar from "../components/layout/TopAppBar";
import Avatar from "../components/ui/Avatar";
import IndividualStats from "../components/progressions/IndividualStats";
import { Loading, ErrorState } from "../components/ui/States";

function SportifDetail() {
  const { id } = useParams();
  const [sportif, setSportif] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    profilsApi.get(id).then(setSportif).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!sportif) return <Loading />;

  return (
    <div>
      <TopAppBar title={`${sportif.prenom} ${sportif.nom}`} onBack={true} />

      <div className="px-5 flex flex-col gap-6 pb-8">
        <div className="flex items-center gap-4">
          <Avatar nom={sportif.nom} prenom={sportif.prenom} size={64} />
          <div className="min-w-0">
            <h2 className="text-h1 truncate">
              {sportif.prenom} {sportif.nom}
            </h2>
            <p className="text-caption text-muted-foreground truncate">{sportif.mail}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card-surface p-4 text-center">
            <p className="text-label text-muted-foreground">Âge</p>
            <p className="text-h2 mt-1">{sportif.age ?? "—"}</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-label text-muted-foreground">Poids</p>
            <p className="text-h2 mt-1">{sportif.poids ? `${sportif.poids} kg` : "—"}</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-label text-muted-foreground">Taille</p>
            <p className="text-h2 mt-1">{sportif.taille ? `${sportif.taille} cm` : "—"}</p>
          </div>
        </div>

        <div>
          <p className="text-label text-muted-foreground mb-2">Blessures / objectifs</p>
          <div className="card-surface p-4">
            <p className="text-sm">{sportif.blessures || "Rien de renseigné."}</p>
          </div>
        </div>

        <div>
          <p className="text-label text-muted-foreground mb-2">Progression</p>
          <IndividualStats profilId={sportif.id} />
        </div>
      </div>
    </div>
  );
}

export default SportifDetail;
