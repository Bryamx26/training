export function Tag({ children }) {
  return <span className="rl-tag">{children}</span>;
}

// tone : "info" (À venir), "done" (terminée et notée) ou neutre par défaut.
export function StatusPill({ tone, children }) {
  return <span className={`rl-status${tone ? ` rl-status--${tone}` : ""}`}>{children}</span>;
}
