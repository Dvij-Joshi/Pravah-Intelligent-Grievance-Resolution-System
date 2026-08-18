import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  Bell,
  ChevronRight,
  AlertTriangle,
  Zap,
  LogOut,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function statusBadgeClass(status) {
  if (status === 'resolved') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'in_progress') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'pending_feedback') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function statusLabel(status) {
  const map = {
    submitted: 'Submitted',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    pending_feedback: 'Pending Feedback',
    closed: 'Closed',
  };
  return map[status] || status;
}

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);

      const [profileRes, grievancesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('grievances')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      setProfile(profileRes.data);
      setGrievances(grievancesRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Citizen';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const activeCount = grievances.filter(g => g.status === 'in_progress' || g.status === 'submitted').length;
  const resolvedCount = grievances.filter(g => g.status === 'resolved' || g.status === 'closed').length;
  const actionCount = grievances.filter(g => g.status === 'pending_feedback').length;

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <ShieldCheck className="h-6 w-6 text-blue-700" />
            <span className="font-bold text-slate-900 text-lg tracking-tight">Pravah</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-semibold text-slate-700 pr-1">{displayName}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
              Welcome back, {displayName.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500">Manage your civic requests and track their resolution progress.</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => navigate('/submit')}
            className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <PlusCircle className="h-5 w-5" />
            Lodge New Grievance
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { label: 'Active', value: loading ? '…' : activeCount, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { label: 'Resolved', value: loading ? '…' : resolvedCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                { label: 'Requires Action', value: loading ? '…' : actionCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${stat.border} ${stat.bg} shadow-sm flex flex-col justify-center items-center text-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color} mb-2`} />
                  <span className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</span>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mt-1">{stat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Grievances List */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  My Grievances
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm font-medium">Loading your grievances…</span>
                </div>
              ) : grievances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="h-7 w-7 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-700 mb-1">No grievances yet</h3>
                  <p className="text-slate-500 text-sm mb-4">Submit your first complaint to get started.</p>
                  <button
                    onClick={() => navigate('/submit')}
                    className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors"
                  >
                    Lodge Grievance
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {grievances.map((g) => (
                    <div
                      key={g.id}
                      className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/grievance/${g.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200">
                            {g.readable_id}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {new Date(g.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusBadgeClass(g.status)}`}>
                          {statusLabel(g.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">{g.title}</h3>
                          <p className="text-sm text-slate-500">{g.category}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">

            {/* AI Assistant Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Zap className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-4">
                  <Zap className="h-3 w-3" /> Pravah AI
                </div>
                <h3 className="text-xl font-bold mb-2">Need help framing your issue?</h3>
                <p className="text-blue-100 text-sm mb-6">
                  Our AI assistant can help you write a clear complaint and automatically route it to the right department.
                </p>
                <button
                  onClick={() => navigate('/submit')}
                  className="w-full bg-white text-blue-900 hover:bg-blue-50 font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Lodge New Grievance
                </button>
              </div>
            </motion.div>

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-500" />
                  Account Info
                </h2>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Email</p>
                  <p className="text-sm text-slate-700 font-medium break-all">{user?.email}</p>
                </div>
                {profile?.phone && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Phone</p>
                    <p className="text-sm text-slate-700 font-medium">{profile.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Total Grievances</p>
                  <p className="text-sm text-slate-700 font-medium">{loading ? '…' : grievances.length}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
