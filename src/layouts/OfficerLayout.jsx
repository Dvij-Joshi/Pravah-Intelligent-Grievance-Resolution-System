import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Workflow,
  AlertTriangle,
  Upload,
  ClipboardList,
  ShieldCheck,
  LogOut,
  Bell,
  ChevronRight,
  GitPullRequest,
  FileCheck,
  Bot,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard",        icon: LayoutDashboard, path: "/officer/dashboard" },
  { label: "All Complaints",   icon: ClipboardList,   path: "/officer/complaints" },
  { label: "Action Workflow",  icon: GitPullRequest,  path: "/officer/workflow" },
  { label: "Evidence Upload",  icon: Upload,          path: "/officer/evidence" },
  { label: "AI Evidence Report", icon: FileCheck,     path: "/officer/evidence-report" },
  { label: "Escalations",      icon: AlertTriangle,   path: "/officer/escalations" },
  { label: "Test AI Agents",   icon: Bot,             path: "/officer/test-agents" }
];

export default function OfficerLayout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const fullName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Officer";
  const initials = fullName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-200">
          <ShieldCheck className="h-7 w-7 text-blue-700 flex-shrink-0" />
          <div>
            <div className="font-bold text-slate-900 text-base leading-tight">Pravah</div>
            <div className="text-xs text-slate-500">Officer Portal</div>
          </div>
        </div>

        {/* Officer Profile */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{fullName}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email ?? ""}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {navItems.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} size={18} />
                    <span className="flex-1">{label}</span>
                    {isActive && <ChevronRight size={14} className="text-blue-200" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Sign Out */}
        <div className="px-3 py-3 border-t border-slate-200">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Welcome back, {fullName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email ?? "Officer Portal"}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
