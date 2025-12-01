import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";

import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* redirect "/" → "/dashboard" */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* catch-all optional */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
