import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { Loading } from "./components/ui/States";
import "./App.css";

// Une page = un fichier JS chargé à la première visite : le premier écran
// n'attend pas le code des autres (graphiques recharts, glisser-déposer…).
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Legal = lazy(() => import("./pages/Legal"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Seances = lazy(() => import("./pages/Seances"));
const SeanceDetail = lazy(() => import("./pages/SeanceDetail"));
const SeanceForm = lazy(() => import("./pages/SeanceForm"));
const SeancePlayer = lazy(() => import("./pages/SeancePlayer"));
const Stats = lazy(() => import("./pages/Stats"));
const Profil = lazy(() => import("./pages/Profil"));
const Notifications = lazy(() => import("./pages/Notifications"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const SportifDetail = lazy(() => import("./pages/SportifDetail"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplateDetail = lazy(() => import("./pages/TemplateDetail"));
const TemplateForm = lazy(() => import("./pages/TemplateForm"));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          {/* Documents légaux : publics, consultables avant de créer un compte. */}
          <Route path="/legal/:doc" element={<Legal />} />

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
            <Route path="/notifications" element={<Notifications />} />
            <Route
              path="/admin/utilisateurs"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <AdminRoute>
                  <Templates />
                </AdminRoute>
              }
            />
            <Route
              path="/templates/nouveau"
              element={
                <AdminRoute>
                  <TemplateForm />
                </AdminRoute>
              }
            />
            <Route
              path="/templates/:id"
              element={
                <AdminRoute>
                  <TemplateDetail />
                </AdminRoute>
              }
            />
            <Route
              path="/templates/:id/modifier"
              element={
                <AdminRoute>
                  <TemplateForm />
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
      </Suspense>
    </AuthProvider>
  );
}

export default App;
