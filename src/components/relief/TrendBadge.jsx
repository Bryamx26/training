import { TrendingUp } from "lucide-react";

function TrendBadge({ children }) {
  return (
    <span className="rl-trend">
      <TrendingUp /> {children}
    </span>
  );
}

export default TrendBadge;
