// Courbe de progression
// Accepte une liste de séances { date, note } et permet de visualiser
// l'évolution par semaine, par mois ou par année.

import { useMemo, useState } from "react";
import { useDesign } from "../../context/DesignContext";
import TraceLineChart from "../trace/LineChart";
import ReliefLineChart from "../relief/LineChart";

const MOIS_COURT = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const MOIS_LONG = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// --- Helpers dates ---

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche
  const diff = (day === 0 ? -6 : 1) - day; // recale sur lundi
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function average(arr) {
  if (!arr.length) return null;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function formatJourMois(d) {
  return `${d.getDate()} ${MOIS_COURT[d.getMonth()]}`;
}

/**
 * CourbeDeProgression
 *
 * Props:
 * - seances: [{ date: "2026-08-03", note: 7.5 }, ...]
 * - vueInitiale: "semaine" | "mois" | "annee" (défaut: "mois")
 */
export default function CourbeDeProgression({ seances = [], vueInitiale = "mois" }) {
  const { design } = useDesign();
  const [vue, setVue] = useState(vueInitiale);
  const [reference, setReference] = useState(new Date());

  const parsed = useMemo(
    () => seances.map((s) => ({ date: parseDate(s.date), note: s.note })),
    [seances]
  );

  const { data, label } = useMemo(() => {
    if (vue === "semaine") {
      const start = startOfWeek(reference);
      const jours = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
      const points = jours.map((d, i) => {
        const notes = parsed.filter((p) => sameDay(p.date, d)).map((p) => p.note);
        return { periode: JOURS_COURT[i], note: average(notes) };
      });
      const end = jours[6];
      return {
        data: points,
        label: `${formatJourMois(start)} – ${formatJourMois(end)} ${end.getFullYear()}`,
      };
    }

    if (vue === "mois") {
      const year = reference.getFullYear();
      const month = reference.getMonth();
      const inMonth = parsed.filter(
        (p) => p.date.getFullYear() === year && p.date.getMonth() === month
      );
      const nbJours = new Date(year, month + 1, 0).getDate();
      const nbSemaines = Math.ceil(nbJours / 7);
      const points = Array.from({ length: nbSemaines }, (_, i) => {
        const notes = inMonth
          .filter((p) => Math.floor((p.date.getDate() - 1) / 7) === i)
          .map((p) => p.note);
        return { periode: `Sem ${i + 1}`, note: average(notes) };
      });
      return { data: points, label: `${MOIS_LONG[month]} ${year}` };
    }

    // vue === "annee"
    const year = reference.getFullYear();
    const inYear = parsed.filter((p) => p.date.getFullYear() === year);
    const points = MOIS_COURT.map((m, i) => {
      const notes = inYear.filter((p) => p.date.getMonth() === i).map((p) => p.note);
      return { periode: m, note: average(notes) };
    });
    return { data: points, label: `${year}` };
  }, [vue, reference, parsed]);

  function changerVue(nouvelleVue) {
    setVue(nouvelleVue);
  }

  function goPrev() {
    setReference((ref) => {
      const d = new Date(ref);
      if (vue === "semaine") d.setDate(d.getDate() - 7);
      else if (vue === "mois") d.setMonth(d.getMonth() - 1);
      else d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  }

  function goNext() {
    setReference((ref) => {
      const d = new Date(ref);
      if (vue === "semaine") d.setDate(d.getDate() + 7);
      else if (vue === "mois") d.setMonth(d.getMonth() + 1);
      else d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  }

  const Chart = design === "trace" ? TraceLineChart : ReliefLineChart;
  return <Chart data={data} vue={vue} onVue={changerVue} label={label} onPrev={goPrev} onNext={goNext} />;
}
