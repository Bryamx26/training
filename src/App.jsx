import Navbar from './components/navbar/NavbarContainer.jsx'
import Profil from './components/Profil.jsx'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './components/Home.jsx'

function App() {

  return (
    <div>


      <Routes>
        <Route path="/profil" element={<Profil />} />
        <Route path="/" element={<Home />} />
      </Routes>




    </div>
  )
}
export default App
