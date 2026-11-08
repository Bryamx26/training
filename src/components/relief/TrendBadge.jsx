import { Minus, TrendingDown, TrendingUp } from "lucide-react";

// Pastille de tendance. `direction` : "up" (vert), "down" (rouge) ou "flat".
function TrendBadge({ direction = "up", children, ...props }) {
  const Icon = direction === "down" ? TrendingDown : direction === "flat" ? Minus : TrendingUp;
  return (
    <span className={`rl-trend${direction === "up" ? "" : ` rl-trend--${direction}`}`} {...props}>
      <Icon /> {children}
    </span>
  );
}

export default TrendBadge;
