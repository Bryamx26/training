function Input({ label, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1.5 st-field">
      {label && <span className="text-label text-muted-foreground st-field-label">{label}</span>}
      <input
        className={`w-full rounded-2xl border border-input bg-popover px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow st-input ${className}`}
        {...props}
      />
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1.5 st-field">
      {label && <span className="text-label text-muted-foreground st-field-label">{label}</span>}
      <textarea
        className={`w-full rounded-2xl border border-input bg-popover px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none st-input ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1.5 st-field">
      {label && <span className="text-label text-muted-foreground st-field-label">{label}</span>}
      <select
        className={`w-full rounded-2xl border border-input bg-popover px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-shadow st-input ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export default Input;
