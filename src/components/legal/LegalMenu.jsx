import { ChevronRight, Download, FileText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDesign } from "../../context/DesignContext";
import { LEGAL_DOCS } from "../../config/legal";
import { apiUrl } from "../../lib/api";
import MenuRow from "../relief/MenuRow";

// Section « Légal et données » du Profil : documents légaux, export des
// données (RGPD art. 15 et 20) et suppression du compte (art. 17).
function LegalMenu({ onDeleteAccount }) {
  const { design } = useDesign();
  const navigate = useNavigate();

  const items = [
    ...LEGAL_DOCS.map((d) => ({ key: d.slug, icon: FileText, label: d.title, onClick: () => navigate(`/legal/${d.slug}`) })),
    // Réponse en pièce jointe : le navigateur télécharge le fichier sans quitter la page.
    { key: "export", icon: Download, label: "Télécharger mes données", onClick: () => window.location.assign(apiUrl("/me/export")) },
    { key: "delete", icon: Trash2, label: "Supprimer mon compte", danger: true, onClick: onDeleteAccount },
  ];

  if (design === "trace") {
    return (
      <div className="flex flex-col gap-2">
        <span className="t-label">Légal et données</span>
        <div className="st-list">
          {items.map(({ key, icon: Icon, label, danger, onClick }) => (
            <button key={key} type="button" onClick={onClick} className="st-row">
              <Icon className={`w-5 h-5${danger ? " text-destructive" : ""}`} />
              <span className={`st-row-main text-[15px] font-semibold${danger ? " text-destructive" : ""}`}>{label}</span>
              <ChevronRight className="st-row-chevron" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="rl-label">Légal et données</span>
      {items.map(({ key, icon, label, danger, onClick }) => (
        <MenuRow key={key} icon={icon} iconClassName={danger ? "text-destructive" : ""} label={label} onClick={onClick} />
      ))}
    </div>
  );
}

export default LegalMenu;
