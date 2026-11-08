import { TYPE_LABEL } from "./exerciceForm";

// Une séance est « à venir » à partir d'aujourd'hui (journée entière comprise).
export function isUpcoming(circuit) {
  return new Date(circuit.date) >= new Date(new Date().toDateString());
}

export function typeLabel(type) {
  return TYPE_LABEL[type] ?? type;
}

// « 2026-10-06 » en heure locale (les séances sont datées au jour).
export function toDayString(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Lundi 00:00 de la semaine de `date`.
export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche
  d.setDate(d.getDate() + ((day === 0 ? -6 : 1) - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
