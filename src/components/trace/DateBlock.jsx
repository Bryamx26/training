function DateBlock({ date }) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  return (
    <div className="st-dateblock">
      <span className="st-dateblock-day">{day}</span>
      <span className="t-label">{month}</span>
    </div>
  );
}

export default DateBlock;
