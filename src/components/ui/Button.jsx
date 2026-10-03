import { useDesign } from "../../context/DesignContext";

const VARIANTS = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "bg-transparent border border-border text-foreground",
  danger: "bg-destructive text-destructive-foreground",
  ghost: "bg-transparent text-foreground",
  // Variantes du design Relief : bouton en relief neutre, et sa version « danger ».
  soft: "bg-secondary text-secondary-foreground",
  "danger-soft": "bg-secondary text-destructive",
};

// `trailing` (flèche, info mono) et `size` ne s'appliquent qu'au design Tracé ;
// les classes st-* sont sans effet en Classique.
function Button({ children, variant = "primary", size, trailing, className = "", disabled, type = "button", ...props }) {
  const { design } = useDesign();
  const withTrailing = design === "trace" && trailing;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`press flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} st-button st-button--${variant}${size ? ` st-button--${size}` : ""} ${className}`}
      {...props}
    >
      {withTrailing ? (
        <>
          <span className="st-button-leading">{children}</span>
          <span className="st-button-trailing">{trailing}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
