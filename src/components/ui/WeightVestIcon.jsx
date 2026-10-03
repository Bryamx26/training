// Icône « gilet lesté » (chemise sans manches avec des poches de poids), dessinée
// dans le style des icônes Lucide : 24×24, trait `currentColor`, classe `lucide`
// pour hériter des réglages de trait de chaque design.
function WeightVestIcon({ className = "", strokeWidth = 2, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide ${className}`}
      aria-hidden="true"
      {...props}
    >
      {/* Gilet : bretelles, encolure en V, corps */}
      <path d="M8 3 5 5 4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9l-1-4-3-2-4 5Z" />
      <path d="M12 8v13" />
      {/* Poches de poids */}
      <rect x="6.5" y="11" width="3.5" height="3" rx="0.5" />
      <rect x="14" y="11" width="3.5" height="3" rx="0.5" />
      <rect x="6.5" y="16" width="3.5" height="3" rx="0.5" />
      <rect x="14" y="16" width="3.5" height="3" rx="0.5" />
    </svg>
  );
}

export default WeightVestIcon;
