import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth + Landing
const LandingPage        = lazy(() => import('./pages/LandingPage'));
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage'));

// Citizen
const CitizenDashboard   = lazy(() => import('./pages/citizen/CitizenDashboard'));
const SubmitGrievance    = lazy(() => import('./pages/citizen/SubmitGrievance'));
const GrievanceSubmitted = lazy(() => import('./pages/citizen/GrievanceSubmitted'));
const TrackGrievance     = lazy(() => import('./pages/citizen/TrackGrievance'));
const GrievanceDetails   = lazy(() => import('./pages/citizen/GrievanceDetails'));
const ResolutionFeedback = lazy(() => import('./pages/citizen/ResolutionFeedback'));

// Officer
const OfficerDashboard   = lazy(() => import('./pages/officer/OfficerDashboard'));
const AllComplaints      = lazy(() => import('./pages/officer/AllComplaints'));
const ComplaintDetails   = lazy(() => import('./pages/officer/ComplaintDetails'));
const ActionWorkflow     = lazy(() => import('./pages/officer/ActionWorkflow'));
const EvidenceUpload     = lazy(() => import('./pages/officer/EvidenceUpload'));
const AIEvidenceReport   = lazy(() => import('./pages/officer/AIEvidenceReport'));
const Escalations        = lazy(() => import('./pages/officer/Escalations'));
const TestAIAgents       = lazy(() => import('./pages/TestAIAgents'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/officer/test-agents"     element={<ProtectedRoute><TestAIAgents /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
