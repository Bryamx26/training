import Navbar from './navbar/NavbarContainer.jsx'
import { useState } from 'react'
import MoyenneDiv from './container/MoyenneDiv'
import CourbeDeProgression from './progressions/CourbeDeProgression.jsx'
import Badge from './seances/Badge.jsx'
import DarkModeToggle from './bouton/DarkModeToggle.jsx'
import SportifCard from './seances/SportifCard'
function Home() {

  const [timer, setTimer] = useState(0)
  const seances = [
    { date: "2026-02-02", note: 10 },

    { date: "2026-02-02", note: 1 },

    { date: "2026-02-04", note: 5.9 },
    { date: "2026-02-06", note: 6.1 },
    { date: "2026-02-09", note: 6.1 },
    { date: "2026-02-11", note: 6.5 },
    { date: "2026-02-13", note: 6.5 },
    { date: "2026-02-16", note: 6.7 },
    { date: "2026-02-18", note: 6.1 },
    { date: "2026-02-20", note: 6.4 },
    { date: "2026-02-23", note: 6.1 },
    { date: "2026-02-25", note: 6.3 },
    { date: "2026-02-27", note: 6.5 },
    { date: "2026-03-02", note: 6.2 },
    { date: "2026-03-04", note: 6.3 },
    { date: "2026-03-06", note: 6.7 },
    { date: "2026-03-09", note: 6.6 },
    { date: "2026-03-11", note: 6.4 },
    { date: "2026-03-13", note: 6.7 },
    { date: "2026-03-16", note: 6.9 },
    { date: "2026-03-18", note: 6.3 },
    { date: "2026-03-20", note: 6.9 },
    { date: "2026-03-23", note: 6.9 },
    { date: "2026-03-25", note: 6.6 },
    { date: "2026-03-27", note: 6.4 },
    { date: "2026-03-30", note: 7.1 },
    { date: "2026-04-01", note: 6.6 },
    { date: "2026-04-03", note: 6.5 },
    { date: "2026-04-06", note: 6.5 },
    { date: "2026-04-08", note: 7.1 },
    { date: "2026-04-10", note: 6.9 },
    { date: "2026-04-13", note: 7.1 },
    { date: "2026-04-15", note: 7.1 },
    { date: "2026-04-17", note: 6.9 },
    { date: "2026-04-20", note: 7.3 },
    { date: "2026-04-22", note: 6.9 },
    { date: "2026-04-24", note: 7.0 },
    { date: "2026-04-27", note: 7.3 },
    { date: "2026-04-29", note: 7.1 },
    { date: "2026-05-01", note: 7.3 },
    { date: "2026-05-04", note: 7.1 },
    { date: "2026-05-06", note: 7.2 },
    { date: "2026-05-08", note: 6.7 },
    { date: "2026-05-11", note: 6.9 },
    { date: "2026-05-13", note: 7.0 },
    { date: "2026-05-15", note: 6.8 },
    { date: "2026-05-18", note: 7.0 },
    { date: "2026-05-20", note: 6.9 },
    { date: "2026-05-22", note: 7.0 },
    { date: "2026-05-25", note: 7.4 },
    { date: "2026-05-27", note: 7.2 },
    { date: "2026-05-29", note: 7.2 },
    { date: "2026-06-01", note: 7.1 },
    { date: "2026-06-03", note: 7.1 },
    { date: "2026-06-05", note: 7.7 },
    { date: "2026-06-08", note: 7.5 },
    { date: "2026-06-10", note: 7.5 },
    { date: "2026-06-12", note: 7.1 },
    { date: "2026-06-15", note: 7.6 },
    { date: "2026-06-17", note: 7.2 },
    { date: "2026-06-19", note: 7.3 },
    { date: "2026-06-22", note: 7.9 },
    { date: "2026-06-24", note: 7.6 },
    { date: "2026-06-26", note: 7.5 },
    { date: "2026-06-29", note: 7.7 },
    { date: "2026-07-01", note: 7.8 },
    { date: "2026-07-03", note: 7.8 },
    { date: "2026-07-06", note: 7.4 },
    { date: "2026-07-08", note: 7.2 },
    { date: "2026-07-10", note: 7.5 },
    { date: "2026-07-13", note: 7.5 },
    { date: "2026-07-15", note: 7.4 },
    { date: "2026-07-17", note: 8.0 },
    { date: "2026-07-20", note: 8.0 },
    { date: "2026-07-22", note: 7.6 },
    { date: "2026-07-24", note: 7.9 },
    { date: "2026-07-27", note: 7.7 },
    { date: "2026-07-29", note: 8.1 },
    { date: "2026-08-01", note: 1 },
  ];
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Bryam",
      progress: 100,
    },
    {
      id: 2,
      name: "Alice",
      progress: 100,
    },
    {
      id: 3,
      name: "Bob",
      progress: 50,
    },
  ]);
  function handleclick() {
    setTimer(timer + 1)
    setUsers((prev) => ({
      ...prev,
      progress: prev.progress + 1
    }))
  }
  return (


    <div className="min-h-[200dvh] flex flex-col items-center justify-around">

      <p onClick={handleclick} >  {timer} </p>
      <MoyenneDiv users={users} text={"moyenne"} />


      <SportifCard
        initiales="LM"
        nom="Léa Marchand"
        sousTitre="Préparation semi-marathon"
        notes={[7.6, 7.9, 8.0, 7.8, 8.2]}
        moyenne={8.2}
        onClick={() => console.log("clic")}
      />

      <SportifCard
        initiales="LM"
        nom="Léa Marchand"
        sousTitre="Préparation semi-marathon"
        notes={[7.6, 7.9, 8.0, 7.8, 8.2]}
        moyenne={8.2}
        onClick={() => console.log("clic")}
      />

      <CourbeDeProgression seances={seances} vueInitiale="semaine" />
      <div className="grid grid-cols-2 gap-4">
        <Badge title="MOYENNE GÉNÉRALE" text="8,2" subtext="sur 24 séances" />
        <Badge
          title="OBJECTIFS ATTEINTS"
          text="17"
          subtext="sur 24"
          accent="var(--color-success)"
        />
      </div>
      <DarkModeToggle />

    </div >

  );
}


export default Home
