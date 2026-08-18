import React, { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  MapPin,
  Activity,
  Zap,
  RefreshCw,
  Eye,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import OfficerLayout from "../../layouts/OfficerLayout";
import { PriorityBadge, SLABadge, StatusBadge } from "../../components/Badges";
import { useGrievances } from "../../hooks/useGrievances";
import { useAuth } from "../../context/AuthContext";


const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const activityIcons = {
  escalation: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  evidence: { icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
  resolved: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  assigned: { icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
};

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { grievances, loading, error, refetch } = useGrievances();

  // Role guard — citizens don't belong here
  useEffect(() => {
    if (role === 'citizen') navigate('/dashboard', { replace: true });
  }, [role, navigate]);

  const stats = useMemo(() => ({
    assigned: grievances.filter(g => g.status !== 'Resolved').length,
    slaAtRisk: grievances.filter(g => g.slaStatus === 'warning' || g.slaStatus === 'critical').length,
    overdue: grievances.filter(g => g.slaStatus === 'overdue').length,
    resolved: grievances.filter(g => g.status === 'Resolved').length,
    total: grievances.length,
  }), [grievances]);

  const statCards = [
    { label: "Assigned", value: stats.assigned, icon: ClipboardList, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100", description: "Total active cases" },
    { label: "SLA At Risk", value: stats.slaAtRisk, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", description: "Approaching deadline" },
    { label: "Overdue", value: stats.overdue, icon: Clock, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", description: "SLA already breached" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", description: "All time" },
  ];

  // Priority cases: overdue first, then critical, then warning, top 5
  const priorityCases = useMemo(() =>
    [...grievances]
      .filter(g => g.status !== 'Resolved')
      .sort((a, b) => {
        const order = { overdue: 0, critical: 1, warning: 2, ok: 3 };
        return (order[a.slaStatus] ?? 3) - (order[b.slaStatus] ?? 3);
      })
      .slice(0, 5),
  [grievances]);

  const slaOnTrack = grievances.filter(g => g.slaStatus === 'ok' && g.status !== 'Resolved').length;
  const slaAtRisk = stats.slaAtRisk;
  const slaOverdue = stats.overdue;
  const slaTotal = Math.max(grievances.filter(g => g.status !== 'Resolved').length, 1);

  // Recent activity derived from live grievances (5 most recent)
  const activityIcons = {
    escalated:  { icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50' },
    reviewed:   { icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    resolved:   { icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    new:        { icon: ClipboardList, color: 'text-blue-600',    bg: 'bg-blue-50' },
    updated:    { icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50' },
  };
  const recentActivity = [...grievances]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((g, i) => ({
      id: g.id ?? i,
      type: g.status === 'Resolved' ? 'resolved' : 'new',
      action: g.status === 'Resolved' ? 'Case resolved' : 'New case assigned',
      grievance: g.readableId ?? g.id,
      time: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '—',
    }));

  if (loading) {
    return (
      <OfficerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </OfficerLayout>
    );
  }

  if (error) {
    return (
      <OfficerLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
          <p className="text-slate-600 font-medium">{error}</p>
          <button onClick={refetch} className="mt-3 text-sm text-blue-600 hover:underline">Retry</button>
        </div>
      </OfficerLayout>
    );
  }

  return (
    <OfficerLayout>
      {/* Page Header */}
      <FadeIn className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Summary</h2>
            <p className="text-sm text-slate-500 mt-1">Monday, 10 May 2025 · Ward 5, City</p>
          </div>
          <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-700 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </FadeIn>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, idx) => (
          <FadeIn key={card.label} delay={idx * 0.07}>
            <div className={`bg-white rounded-xl border ${card.border} p-5 hover:shadow-md transition-shadow cursor-pointer`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div className={`text-3xl font-bold mb-0.5 ${card.color}`}>{card.value}</div>
              <div className="text-sm font-semibold text-slate-700">{card.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{card.description}</div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Alert Banner for overdue */}
      {stats.overdue > 0 && (
        <FadeIn delay={0.3} className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <span className="text-sm font-semibold text-red-800">
                  {stats.overdue} cases are overdue.
                </span>
                <span className="text-sm text-red-600 ml-1">
                  Supervisors have been notified. Immediate action required.
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/officer/complaints")}
              className="text-xs font-semibold text-red-700 hover:underline flex-shrink-0 ml-4"
            >
              View Now →
            </button>
          </div>
        </FadeIn>
      )}

      {/* Main Grid: Priority Cases + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Cases Table */}
        <FadeIn delay={0.35} className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">Priority Cases</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sorted by SLA urgency</p>
              </div>
              <button
                onClick={() => navigate("/officer/complaints")}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="divide-y divide-slate-50 flex-1">
              {priorityCases.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.07 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/officer/complaints/${c.id}`)}
                >
                  {/* Grievance ID */}
                  <div className="w-24 flex-shrink-0">
                    <div className="text-xs font-bold text-blue-700 group-hover:underline">{c.id}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <MapPin size={10} />
                      {c.location}
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{c.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.category}</div>
                  </div>

                  {/* Priority */}
                  <div className="flex-shrink-0">
                    <PriorityBadge priority={c.priority} />
                  </div>

                  {/* SLA */}
                  <div className="flex-shrink-0 w-24 text-right">
                    <SLABadge slaRemaining={c.slaRemaining} slaStatus={c.slaStatus} />
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    <button className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                      Take Action
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Recent Activity */}
          <FadeIn delay={0.4} className="flex-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-slate-400" />
                  <h3 className="font-bold text-slate-900">Recent Activity</h3>
                </div>
              </div>
              <div className="flex-1 px-5 py-3 space-y-3">
                {recentActivity.map((item, idx) => {
                  const cfg = activityIcons[item.type];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + idx * 0.07 }}
                      className="flex items-start gap-3"
                    >
                      <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                        <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-slate-700 font-medium">{item.action}</div>
                        <div className="text-xs text-blue-600 font-medium">{item.grievance}</div>
                      </div>
                      <div className="text-xs text-slate-400 flex-shrink-0">{item.time}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </FadeIn>

          {/* Quick Stats: SLA Compliance */}
          <FadeIn delay={0.5}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <h3 className="font-bold text-slate-900">SLA Compliance</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "On Track", count: slaOnTrack, total: slaTotal, color: "bg-emerald-500" },
                  { label: "At Risk", count: slaAtRisk, total: slaTotal, color: "bg-amber-400" },
                  { label: "Overdue", count: slaOverdue, total: slaTotal, color: "bg-red-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">{item.label}</span>
                      <span className="text-xs text-slate-400">{item.count}/{item.total}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / item.total) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </OfficerLayout>
  );
}
