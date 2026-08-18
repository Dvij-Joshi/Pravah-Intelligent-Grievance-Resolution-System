import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth + Landing
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Citizen
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitGrievance from './pages/citizen/SubmitGrievance';
import GrievanceSubmitted from './pages/citizen/GrievanceSubmitted';
import TrackGrievance from './pages/citizen/TrackGrievance';
import GrievanceDetails from './pages/citizen/GrievanceDetails';
import ResolutionFeedback from './pages/citizen/ResolutionFeedback';

// Officer
import OfficerDashboard from './pages/officer/OfficerDashboard';
import AllComplaints from './pages/officer/AllComplaints';
import ComplaintDetails from './pages/officer/ComplaintDetails';
import ActionWorkflow from './pages/officer/ActionWorkflow';
import EvidenceUpload from './pages/officer/EvidenceUpload';
import AIEvidenceReport from './pages/officer/AIEvidenceReport';
import Escalations from './pages/officer/Escalations';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Citizen */}
          <Route path="/dashboard"     element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/submit"        element={<ProtectedRoute><SubmitGrievance /></ProtectedRoute>} />
          <Route path="/submitted/:id" element={<ProtectedRoute><GrievanceSubmitted /></ProtectedRoute>} />
          <Route path="/track/:id"     element={<ProtectedRoute><TrackGrievance /></ProtectedRoute>} />
          <Route path="/grievance/:id" element={<ProtectedRoute><GrievanceDetails /></ProtectedRoute>} />
          <Route path="/feedback/:id"  element={<ProtectedRoute><ResolutionFeedback /></ProtectedRoute>} />

          {/* Officer */}
          <Route path="/officer" element={<Navigate to="/officer/dashboard" replace />} />
          <Route path="/officer/dashboard"       element={<ProtectedRoute><OfficerDashboard /></ProtectedRoute>} />
          <Route path="/officer/complaints"      element={<ProtectedRoute><AllComplaints /></ProtectedRoute>} />
          <Route path="/officer/complaints/:id"  element={<ProtectedRoute><ComplaintDetails /></ProtectedRoute>} />
          <Route path="/officer/workflow"        element={<ProtectedRoute><ActionWorkflow /></ProtectedRoute>} />
          <Route path="/officer/evidence"        element={<ProtectedRoute><EvidenceUpload /></ProtectedRoute>} />
          <Route path="/officer/evidence-report" element={<ProtectedRoute><AIEvidenceReport /></ProtectedRoute>} />
          <Route path="/officer/escalations"     element={<ProtectedRoute><Escalations /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
