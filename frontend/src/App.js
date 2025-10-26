import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import DeviceDetail from './components/DeviceDetail'; // 1. Import the new component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* 2. Add the new route for the detail page. The ":id" is a URL parameter. */}
        <Route path="/device/:id" element={<DeviceDetail />} />
        {/* Your default route correctly redirects to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;