import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { authService } from "./services/authService";

function SimplePolicyPage({ title, children }) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <Link to="/" className="text-sm font-semibold text-blue-600">
        Back to ContactX
      </Link>
      <h1 className="mt-8 text-4xl font-black text-slate-900">{title}</h1>
      <div className="mt-6 space-y-4 text-slate-600">{children}</div>
    </main>
  );
}

function ProtectedRoute({ children }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter
      basename={import.meta.env.DEV ? "/" : import.meta.env.BASE_URL}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/terms"
          element={
            <SimplePolicyPage title="Terms">
              <p>By using ContactX, you agree to provide accurate account information and use the service responsibly.</p>
              <p>Do not misuse the service, attempt unauthorized access, or store unlawful content.</p>
            </SimplePolicyPage>
          }
        />
        <Route
          path="/privacy"
          element={
            <SimplePolicyPage title="Privacy Policy">
              <p>ContactX uses account and contact information only to provide the contact-management features in this application.</p>
              <p>Protect your password and sign out when using a shared device.</p>
            </SimplePolicyPage>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
