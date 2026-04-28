import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import MyRegistrations from "./pages/MyRegistrations";
import Notifications from "./pages/Notifications";
import Resources from "./pages/Resources";
import Reports from "./pages/Reports";
import FeedbackAdmin from "./pages/FeedbackAdmin";
import AuditLogs from "./pages/AuditLogs";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: "12px",
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — all roles */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Layout><Events /></Layout></ProtectedRoute>} />
          <Route path="/my-registrations" element={<ProtectedRoute><Layout><MyRegistrations /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />

          {/* Faculty + Admin */}
          <Route path="/resources" element={<ProtectedRoute roles={["faculty","admin"]}><Layout><Resources /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={["faculty","admin"]}><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/feedback-admin" element={<ProtectedRoute roles={["faculty","admin"]}><Layout><FeedbackAdmin /></Layout></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/audit-logs" element={<ProtectedRoute roles={["admin"]}><Layout><AuditLogs /></Layout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
