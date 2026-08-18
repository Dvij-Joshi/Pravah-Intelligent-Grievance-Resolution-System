import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitGrievance from './pages/citizen/SubmitGrievance';
import GrievanceSubmitted from './pages/citizen/GrievanceSubmitted';
import TrackGrievance from './pages/citizen/TrackGrievance';
import GrievanceDetails from './pages/citizen/GrievanceDetails';
import ResolutionFeedback from './pages/citizen/ResolutionFeedback';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected citizen routes */}
          <Route path="/dashboard" element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/submit" element={<ProtectedRoute><SubmitGrievance /></ProtectedRoute>} />
          <Route path="/submitted/:id" element={<ProtectedRoute><GrievanceSubmitted /></ProtectedRoute>} />
          <Route path="/track/:id" element={<ProtectedRoute><TrackGrievance /></ProtectedRoute>} />
          <Route path="/grievance/:id" element={<ProtectedRoute><GrievanceDetails /></ProtectedRoute>} />
          <Route path="/feedback/:id" element={<ProtectedRoute><ResolutionFeedback /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
