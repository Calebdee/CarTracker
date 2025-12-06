import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import CarView from "./pages/CarView";
import AddVehiclePart from "./pages/AddVehiclePart";
import EditVehiclePart from "./pages/EditVehiclePart";

import "./axiosSetup";
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

        <Route
          path="/vehicle/:id"
          element={
            <ProtectedRoute>
              <CarView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicles/:id/add-part"
          element={
            <ProtectedRoute>
              <AddVehiclePart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicles/:vehicleId/vehicle-parts/:partId/edit"
          element={<EditVehiclePart />}
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
