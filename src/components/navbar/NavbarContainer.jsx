import { LayoutGroup } from "framer-motion";
import Button from "./Button.jsx";

function Navbar() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full flex items-center justify-around px-6 py-4 ">
      {/* On englobe les boutons dans le LayoutGroup */}
      <LayoutGroup>
        <Button
          text="Home"
          destination="/"
        />
        <Button
          text="Profil"
          destination="/profil"
        />
      </LayoutGroup>
    </nav>
  );
}

export default Navbar;
