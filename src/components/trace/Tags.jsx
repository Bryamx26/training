export function TypeTag({ children }) {
  return <span className="st-tag">{children}</span>;
}

// tone : "cobalt" (À venir), "done" (terminée et notée) ou neutre par défaut.
export function StatusPill({ tone, children }) {
  return <span className={`st-pill ${tone ? `st-pill--${tone}` : ""}`}>{children}</span>;
}
