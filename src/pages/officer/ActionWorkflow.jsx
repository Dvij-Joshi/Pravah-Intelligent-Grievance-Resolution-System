import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Activity,
  AlertTriangle,
  Clock,
  User,
  ChevronRight,
  Filter,
  Link2,
  Zap,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import OfficerLayout from "../../layouts/OfficerLayout";
import { PriorityBadge, SLABadge } from "../../components/Badges";

import { useGrievances } from "../../hooks/useGrievances";

const generateTasksFromGrievances = (grievances) => {
  return grievances.map((g, index) => ({
    id: `T-${g.dbId.substring(0, 6)}`,
    grievanceId: g.id,
    grievanceTitle: g.title,
    category: g.category,
    priority: g.priority,
    slaRemaining: g.slaRemaining,
    slaStatus: g.slaStatus,
    step: 1,
    title: `Resolve grievance: ${g.title}`,
    responsible: "Field Team",
    deadline: g.slaRemaining,
    dependency: null,
    status: g.status === 'Resolved' ? 'Completed' : (g.status === 'In Progress' ? 'In Progress' : (g.slaStatus === 'overdue' ? 'Overdue' : 'Pending')),
  }));
};

const STATUS_OPTIONS = ["Pending", "In Progress", "Completed", "Overdue"];

const statusConfig = {
  Completed: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    rowBorder: "border-l-emerald-400",
  },
  "In Progress": {
    icon: Activity,
    iconColor: "text-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    rowBorder: "border-l-blue-400",
  },
  Pending: {
    icon: Circle,
    iconColor: "text-slate-300",
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200",
    rowBorder: "border-l-slate-300",
  },
  Overdue: {
    icon: AlertTriangle,
    iconColor: "text-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    rowBorder: "border-l-red-500",
  },
};

const FILTER_TABS = [
  { key: "All", label: "All Tasks" },
  { key: "Overdue", label: "Overdue" },
  { key: "In Progress", label: "In Progress" },
  { key: "Pending", label: "Pending" },
  { key: "Completed", label: "Completed" },
];

function StatusDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[current];
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${cfg.bg} ${cfg.text} ${cfg.border} hover:shadow-sm`}
      >
        <cfg.icon className={`h-3.5 w-3.5 ${cfg.iconColor}`} />
        {current}
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map((s) => {
              const c = statusConfig[s];
              return (
                <button
                  key={s}
                  onClick={() => { onChange(s); setOpen(false); }}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 ${
                    s === current ? `${c.bg} ${c.text}` : "text-slate-700"
                  }`}
                >
                  <c.icon className={`h-3.5 w-3.5 ${c.iconColor}`} />
                  {s}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ActionWorkflow() {
  const navigate = useNavigate();
  const { grievances, loading } = useGrievances();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [expandedTask, setExpandedTask] = useState(null);

  React.useEffect(() => {
    if (grievances && grievances.length > 0) {
      setTasks(generateTasksFromGrievances(grievances));
    }
  }, [grievances]);

  const updateStatus = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const filtered = activeTab === "All"
    ? tasks
    : tasks.filter((t) => t.status === activeTab);

  const tabCounts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "All" ? tasks.length : tasks.filter((t) => t.status === tab.key).length;
    return acc;
  }, {});

  // Group by grievance
  const grouped = filtered.reduce((acc, task) => {
    if (!acc[task.grievanceId]) acc[task.grievanceId] = [];
    acc[task.grievanceId].push(task);
    return acc;
  }, {});

  const summaryStats = {
    overdue: tasks.filter((t) => t.status === "Overdue").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    pending: tasks.filter((t) => t.status === "Pending").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
  };

  return (
    <OfficerLayout>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Action Workflow</h2>
        <p className="text-sm text-slate-500 mt-1">Manage and update task statuses across all your active cases</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Overdue", count: summaryStats.overdue, color: "text-red-700", bg: "bg-red-50", border: "border-red-100" },
          { label: "In Progress", count: summaryStats.inProgress, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Pending", count: summaryStats.pending, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
          { label: "Completed", count: summaryStats.completed, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
        ].map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className={`${s.bg} border ${s.border} rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow`}
            onClick={() => setActiveTab(s.label === "In Progress" ? "In Progress" : s.label)}
          >
            <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
            <span className={`text-sm font-medium ${s.color}`}>{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
            }`}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Task Groups */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center py-20 text-slate-400">
          <Filter className="h-10 w-10 mb-3 text-slate-200" />
          <div className="font-medium text-slate-500">No tasks match this filter</div>
          <button onClick={() => setActiveTab("All")} className="mt-2 text-sm text-blue-600 hover:underline">
            Show all tasks
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([grievanceId, groupTasks], groupIdx) => {
            const first = groupTasks[0];
            return (
              <motion.div
                key={grievanceId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.08 }}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Group Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex-shrink-0">
                      {grievanceId}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 truncate">{first.grievanceTitle}</span>
                    <PriorityBadge priority={first.priority} />
                    <SLABadge slaRemaining={first.slaRemaining} slaStatus={first.slaStatus} />
                  </div>
                  <button
                    onClick={() => navigate(`/officer/complaints/${grievanceId}`)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline flex-shrink-0 ml-3"
                  >
                    View Case <ArrowRight size={11} />
                  </button>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-slate-50">
                  {groupTasks.map((task, tIdx) => {
                    const cfg = statusConfig[task.status];
                    const isExpanded = expandedTask === task.id;
                    const isBlocked = !!task.dependency &&
                      tasks.find((t) => t.id === task.dependency)?.status !== "Completed";

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        className={`border-l-4 ${cfg.rowBorder} transition-all`}
                      >
                        {/* Task Row */}
                        <div
                          className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                        >
                          {/* Step number */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                            {task.step}
                          </div>

                          {/* Title + meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-semibold ${task.status === "Completed" ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                {task.title}
                              </span>
                              {isBlocked && (
                                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  <Link2 size={10} /> Blocked
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><User size={10} /> {task.responsible}</span>
                              <span className="flex items-center gap-1"><Clock size={10} /> {task.deadline}</span>
                              {task.dependencyLabel && (
                                <span className="flex items-center gap-1 text-amber-500">
                                  <Link2 size={10} /> Depends on: {task.dependencyLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Dropdown */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <StatusDropdown
                              current={task.status}
                              onChange={(s) => updateStatus(task.id, s)}
                            />
                          </div>

                          <ChevronRight
                            size={16}
                            className={`text-slate-300 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </div>

                        {/* Expanded Detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 pt-2 bg-slate-50/60 border-t border-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Responsible</div>
                                    <div className="text-sm text-slate-700 font-medium">{task.responsible}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Deadline</div>
                                    <div className="text-sm text-slate-700 font-medium">{task.deadline}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Dependency</div>
                                    <div className="text-sm text-slate-700 font-medium">
                                      {task.dependencyLabel || <span className="text-slate-400">None</span>}
                                    </div>
                                  </div>
                                </div>

                                {/* Quick status actions */}
                                <div className="flex gap-2 mt-4 flex-wrap">
                                  {task.status !== "In Progress" && task.status !== "Completed" && (
                                    <button
                                      onClick={() => updateStatus(task.id, "In Progress")}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
                                    >
                                      <Zap size={12} /> Start Task
                                    </button>
                                  )}
                                  {task.status !== "Completed" && (
                                    <button
                                      onClick={() => updateStatus(task.id, "Completed")}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                    >
                                      <CheckCircle2 size={12} /> Mark Complete
                                    </button>
                                  )}
                                  {task.status === "Completed" && (
                                    <button
                                      onClick={() => updateStatus(task.id, "In Progress")}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                    >
                                      <RotateCcw size={12} /> Reopen
                                    </button>
                                  )}
                                  <button
                                    onClick={() => navigate(`/officer/complaints/${task.grievanceId}`)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                                  >
                                    <ChevronRight size={12} /> Open Full Case
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </OfficerLayout>
  );
}
