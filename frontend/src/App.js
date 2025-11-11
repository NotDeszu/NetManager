import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import DeviceDetail from './components/DeviceDetail';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing routes for the application */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/device/:id" element={<DeviceDetail />} />

        {/* --- THIS IS THE MODIFIED ROUTE --- */}
        {/* The root path now shows your new public landing page. */}
        <Route path="/" element={<LandingPage />} />

        {/* Optional but recommended: A catch-all route to redirect any unknown paths back to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;