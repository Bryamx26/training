import { useLocation, useNavigate } from "react-router-dom";

function Button({ text, destination }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === destination;

  return (
    <button
      type="button"
      onClick={() => navigate(destination)}
      className={`
        relative flex items-center justify-center
        w-[100px] h-[40px] rounded-full
        cursor-pointer
        transition-all duration-200
        ${isActive
          ? "bg-card shadow-card "
          : "bg-transparent hover:bg-card/50 border border-foreground "
        }
      `}
    >
      {text}
    </button>
  );
}

export default Button;
