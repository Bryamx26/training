import { Loader2, Inbox } from "lucide-react";

export function Loading({ label = "Chargement..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-caption">{label}</span>
    </div>
  );
}

export function EmptyState({ title = "Rien à afficher", subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted">
        <Inbox className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-h3">{title}</h3>
      {subtitle && <p className="text-caption text-muted-foreground max-w-xs">{subtitle}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = "Une erreur est survenue." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-6">
      <p className="text-h3 text-destructive">Oups</p>
      <p className="text-caption text-muted-foreground">{message}</p>
    </div>
  );
}
