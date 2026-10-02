import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Seances from "./pages/Seances";
import SeanceDetail from "./pages/SeanceDetail";
import SeanceForm from "./pages/SeanceForm";
import SeancePlayer from "./pages/SeancePlayer";
import Stats from "./pages/Stats";
import Profil from "./pages/Profil";
import AdminUsers from "./pages/AdminUsers";
import SportifDetail from "./pages/SportifDetail";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/inscription" element={<Register />} />

        <Route
          path="/seances/:id/lancer"
          element={
            <ProtectedRoute>
              <SeancePlayer />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/seances" element={<Seances />} />
          <Route path="/seances/:id" element={<SeanceDetail />} />
          <Route
            path="/seances/nouvelle"
            element={
              <AdminRoute>
                <SeanceForm />
              </AdminRoute>
            }
          />
          <Route
            path="/seances/:id/modifier"
            element={
              <AdminRoute>
                <SeanceForm />
              </AdminRoute>
            }
          />
          <Route path="/stats" element={<Stats />} />
          <Route path="/profil" element={<Profil />} />
          <Route
            path="/admin/utilisateurs"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/sportifs/:id"
            element={
              <AdminRoute>
                <SportifDetail />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
