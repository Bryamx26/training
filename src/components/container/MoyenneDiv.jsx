//MoyenneDiv 
//Composant qui montre un ensemble de données utilisateurs et la moyenne de leurs progressions 
//
//
import CircularProgress from "../progressions/CircularProgress";
import ProgressBar from "../progressions/ProgressionBar";
function MoyenneDiv({ users, text }) {
  const total = users.reduce((acc, user) => acc + user.progress, 0);
  const moyenne = users.length > 0 ? total / users.length : 0;
  return (
    <>
      <style>{`
        .moyenne-container {
          background: var(--color-card);
          border-radius: 25px;
          padding: 24px;
          box-shadow: var(--shadow-card);
          width: 100%;
          max-width: 420px;
        }
        .moyenne-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          font-weight: normal;
        }
        .moyenne-title {
          margin: 0;

        
          color: var(--color-muted-foreground);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .moyenne-subtitle {
          margin: 5px 0 0;
          font-size: 22px;
          font-weight: 700;
          color: var(--color-card-foreground);
        }
        .moyenne-content {
          display: flex;
          align-items: center;
          justify-content: space-evenly; 
          gap: 25px;
        }
        .users-progress {
          width: clamp(190px, 30vw, 210px);
          display: flex;
          flex-direction: column;
        }
        .moyenne-trend {
          color: var(--color-success);
        }
      `}</style>
      <div className="moyenne-container">
        <div className="moyenne-header">
          <div>
            <p className="moyenne-title text-label text-muted-foreground">
              Progression moyenne
            </p>
            <h2 className="moyenne-subtitle text-display text-card-foreground">
              Groupe entier
            </h2>
          </div>
          <span className="moyenne-trend">
            ↗ +6,4%
          </span>
        </div>
        <div className="moyenne-content">
          <CircularProgress
            value={Math.round(moyenne)}
            text={text}
            r={65}
          />
          <div className="users-progress">
            {users.slice(0, 3).map((user) => (
              <ProgressBar
                user={user}
                key={user.id}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
export default MoyenneDiv;
