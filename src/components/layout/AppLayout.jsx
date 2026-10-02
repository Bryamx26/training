import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

function AppLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 pb-24 max-w-xl w-full mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default AppLayout;
