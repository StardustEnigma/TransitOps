import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Directory from './pages/Directory';
import Dashboard from './pages/Dashboard';
import Maintenancelog from './pages/Maintenancelog';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Main layout wrapper for authenticated routes */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/maintenance" element={<Maintenancelog />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/maintenance" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

