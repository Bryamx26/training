const VARIANTS = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "bg-transparent border border-border text-foreground",
  danger: "bg-destructive text-destructive-foreground",
  ghost: "bg-transparent text-foreground",
};

function Button({ children, variant = "primary", className = "", disabled, type = "button", ...props }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`press flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
