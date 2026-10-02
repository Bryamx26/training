function Avatar({ nom = "", prenom = "", size = 48 }) {
  const initiales = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className="flex items-center justify-center rounded-full font-bold shrink-0"
    >
      <div
        style={{ width: size, height: size, background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
        className="flex items-center justify-center rounded-full w-full h-full"
      >
        {initiales}
      </div>
    </div>
  );
}

export default Avatar;
