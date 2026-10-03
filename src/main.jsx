import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/relief/index.css'
import './styles/trace/index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { DesignProvider } from './context/DesignContext.jsx';

// Applique le mode sombre choisi avant le premier rendu, pour qu'il soit actif
// sur n'importe quelle page au chargement (pas seulement quand le composant qui
// propose le réglage est monté).
const root = document.documentElement;
const storedMode = localStorage.getItem("theme");
const isDark = storedMode ? storedMode === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
root.classList.toggle("dark", isDark);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DesignProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DesignProvider>
  </StrictMode>
)
