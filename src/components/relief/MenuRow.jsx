import { ChevronRight } from "lucide-react";

// Ligne de menu du Profil : icône dans un rond creusé, libellé, chevron.
function MenuRow({ icon: Icon, iconClassName = "", label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="rl-row rl-row--menu">
      <span className="rl-inset-disc w-10 h-10 shrink-0">
        <Icon className={`w-[18px] h-[18px] ${iconClassName}`} />
      </span>
      <span className="rl-row-main text-[15px] font-bold">{label}</span>
      <ChevronRight className="rl-row-chevron" />
    </button>
  );
}

export default MenuRow;
