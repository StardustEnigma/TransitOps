import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Directory from './pages/Directory';
import Dashboard from './pages/Dashboard';
import Maintenancelog from './pages/Maintenancelog';
import Reports from './pages/Reports';
import TripLogs from './pages/TripLogs';
import Dispatch from './pages/Dispatch';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes wrapped in MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/dispatch" element={<Dispatch />} />
              <Route path="/maintenance" element={<Maintenancelog />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/triplogs" element={<TripLogs />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
