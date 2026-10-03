import { useAuth } from "../../context/AuthContext";
import BottomSheet from "../ui/BottomSheet";
import CoachFinder from "./CoachFinder";
import MySubscribers from "./MySubscribers";

// Tiroir « Social » ouvert depuis la barre de navigation : recherche de
// coachs pour un sportif, liste des abonnés pour un coach.
function SocialDrawer({ onClose }) {
  const { isAdmin } = useAuth();

  return (
    <BottomSheet title="Social" onClose={onClose} autoFocusClose={isAdmin}>
      {isAdmin ? <MySubscribers onNavigate={onClose} /> : <CoachFinder />}
    </BottomSheet>
  );
}

export default SocialDrawer;
