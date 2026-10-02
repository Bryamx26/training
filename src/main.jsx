import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';

// Applique le mode sombre et le thème de couleur choisis avant le premier rendu,
// pour qu'ils soient actifs sur n'importe quelle page au chargement (pas seulement
// quand le composant qui propose le réglage est monté).
const root = document.documentElement;
const storedMode = localStorage.getItem("theme");
const isDark = storedMode ? storedMode === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
root.classList.toggle("dark", isDark);

const colorTheme = localStorage.getItem("colorTheme");
if (colorTheme && colorTheme !== "default") {
  root.dataset.theme = colorTheme;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
