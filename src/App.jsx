import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OfficerDashboard from "./pages/officer/OfficerDashboard";

// Placeholder for screens not yet built
const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="text-2xl font-bold text-slate-300 mb-2">{title}</div>
      <div className="text-slate-400 text-sm">Coming soon…</div>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to officer dashboard for now */}
        <Route path="/" element={<Navigate to="/officer/dashboard" replace />} />

        {/* Officer Portal */}
        <Route path="/officer/dashboard" element={<OfficerDashboard />} />
        <Route path="/officer/complaints" element={<ComingSoon title="All Complaints" />} />
        <Route path="/officer/complaints/:id" element={<ComingSoon title="Complaint Details" />} />
        <Route path="/officer/workflow" element={<ComingSoon title="Action Workflow" />} />
        <Route path="/officer/evidence" element={<ComingSoon title="Evidence Upload" />} />
        <Route path="/officer/evidence-report" element={<ComingSoon title="AI Evidence Report" />} />
        <Route path="/officer/escalations" element={<ComingSoon title="Escalations" />} />
      </Routes>
    </BrowserRouter>
  );
}
