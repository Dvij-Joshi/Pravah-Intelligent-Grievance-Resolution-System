import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Props:
 *   children     — page to render when authorised
 *   requireRole  — 'officer' | 'citizen' | undefined (any authenticated user)
 *
 * Behaviour:
 *   • While auth is loading → spinner (never redirect on transient null role)
 *   • Not logged in        → /login
 *   • Wrong role (and role is resolved) → correct home for that role
 *   • Otherwise            → render children
 */
export default function ProtectedRoute({ children, requireRole }) {
  const { user, role, loading } = useAuth();

  // Always wait until both user AND role are fully resolved
  if (loading || (user && role === null)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-700" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role resolved and doesn't match — send to correct home
  if (requireRole && role !== requireRole) {
    return <Navigate to={role === 'officer' ? '/officer/dashboard' : '/dashboard'} replace />;
  }

  return children;
}
