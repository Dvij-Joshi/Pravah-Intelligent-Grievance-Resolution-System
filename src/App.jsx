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

          {/* Citizen (role: citizen) */}
          <Route path="/dashboard"    element={<ProtectedRoute requireRole="citizen"><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/submit"       element={<ProtectedRoute requireRole="citizen"><SubmitGrievance /></ProtectedRoute>} />
          <Route path="/submitted/:id" element={<ProtectedRoute requireRole="citizen"><GrievanceSubmitted /></ProtectedRoute>} />
          <Route path="/track/:id"    element={<ProtectedRoute requireRole="citizen"><TrackGrievance /></ProtectedRoute>} />
          <Route path="/grievance/:id" element={<ProtectedRoute requireRole="citizen"><GrievanceDetails /></ProtectedRoute>} />
          <Route path="/feedback/:id" element={<ProtectedRoute requireRole="citizen"><ResolutionFeedback /></ProtectedRoute>} />

          {/* Officer (role: officer) */}
          <Route path="/officer" element={<Navigate to="/officer/dashboard" replace />} />
          <Route path="/officer/dashboard"     element={<ProtectedRoute requireRole="officer"><OfficerDashboard /></ProtectedRoute>} />
          <Route path="/officer/complaints"    element={<ProtectedRoute requireRole="officer"><AllComplaints /></ProtectedRoute>} />
          <Route path="/officer/complaints/:id" element={<ProtectedRoute requireRole="officer"><ComplaintDetails /></ProtectedRoute>} />
          <Route path="/officer/workflow"      element={<ProtectedRoute requireRole="officer"><ActionWorkflow /></ProtectedRoute>} />
          <Route path="/officer/evidence"      element={<ProtectedRoute requireRole="officer"><EvidenceUpload /></ProtectedRoute>} />
          <Route path="/officer/evidence-report" element={<ProtectedRoute requireRole="officer"><AIEvidenceReport /></ProtectedRoute>} />
          <Route path="/officer/escalations"   element={<ProtectedRoute requireRole="officer"><Escalations /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
