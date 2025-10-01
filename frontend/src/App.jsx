import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Signup from "./pages/signup";
import Login from "./pages/login";
import AdminHome from "./pages/admin/adminHome";
import Dashboard from "./components/systemAdmin/dashboard";
import UserManagement from "./components/systemAdmin/userManagement";

import "./App.css";
import { AuthProvider, AuthContext } from "./context/AuthContext";

function ProtectedRoute({ children, role }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}/home`} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* Patient routes */}
          <Route path="/patient/*" element={
            <ProtectedRoute role="patient">
            </ProtectedRoute>
          }/>

          {/* Staff routes */}
          <Route path="/staff/*" element={
            <ProtectedRoute role="staff">
            </ProtectedRoute>
          }/>

          {/* Admin routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute role="admin">
              <AdminHome />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="user-management" element={<UserManagement />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}
