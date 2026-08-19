import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Activity,
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  Upload,
  Bot,
} from "lucide-react";
import OfficerLayout from "../../layouts/OfficerLayout";
import { PriorityBadge, SLABadge } from "../../components/Badges";
import { useGrievances } from "../../hooks/useGrievances";
import { supabase } from "../../lib/supabase";

const statusConfig = {
  Completed: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
  },
  "In Progress": {
    icon: Activity,
    iconColor: "text-blue-500",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
  },
  Pending: {
    icon: Circle,
    iconColor: "text-slate-400",
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-300",
  },
};

const CYCLE = ["Pending", "In Progress", "Completed"];

export default function ActionWorkflow() {
  const navigate = useNavigate();
  const { grievances } = useGrievances();

  // Local state: { [grievanceDbId]: { [taskId]: "Pending" | "In Progress" | "Completed" } }
  const [taskStatuses, setTaskStatuses] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [saving, setSaving] = useState({}); // { [taskId]: true/false }

  // Hydrate from DB on first load (only for grievances not yet in local state)
  useEffect(() => {
    if (!grievances.length) return;
    setTaskStatuses(prev => {
      const next = { ...prev };
      grievances.forEach(g => {
        if (g.ai_workflow?.tasks && !next[g.dbId]) {
          next[g.dbId] = { ...( g.ai_workflow.task_statuses || {}) };
        }
      });
      return next;
    });
  }, [grievances]);

  const toggleExpand = (readableId) => {
    setExpandedCards(prev => ({ ...prev, [readableId]: !prev[readableId] }));
  };

  const handleStatusCycle = async (g, taskId) => {
    const current = taskStatuses[g.dbId]?.[taskId] || "Pending";
    const nextIdx = (CYCLE.indexOf(current) + 1) % CYCLE.length;
    const next = CYCLE[nextIdx];

    // 1. Optimistic local update
    setTaskStatuses(prev => ({
      ...prev,
      [g.dbId]: { ...(prev[g.dbId] || {}), [taskId]: next }
    }));

    // 2. Persist to Supabase
    setSaving(prev => ({ ...prev, [taskId]: true }));
    try {
      const updatedMap = { ...(taskStatuses[g.dbId] || {}), [taskId]: next };
      await supabase
        .from("grievances")
        .update({
          ai_workflow: { ...g.ai_workflow, task_statuses: updatedMap }
        })
        .eq("id", g.dbId);
    } catch (err) {
      console.error("Failed to save task status:", err);
      // Rollback on error
      setTaskStatuses(prev => ({
        ...prev,
        [g.dbId]: { ...(prev[g.dbId] || {}), [taskId]: current }
      }));
    } finally {
      setSaving(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const withPlan = grievances.filter(g => g.ai_workflow?.tasks?.length > 0);
  const withoutPlan = grievances.filter(g => !g.ai_workflow?.tasks?.length);

  // Summary stats from local state
  let totalTasks = 0, completedTasks = 0, inProgressTasks = 0;
  withPlan.forEach(g => {
    const tasks = g.ai_workflow.tasks || [];
    totalTasks += tasks.length;
    tasks.forEach(t => {
      const s = taskStatuses[g.dbId]?.[t.id] || "Pending";
      if (s === "Completed") completedTasks++;
      if (s === "In Progress") inProgressTasks++;
    });
  });

  return (
    <OfficerLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Action Workflow</h2>
        <p className="text-sm text-slate-500 mt-1">
          Work through all AI-generated action steps. Once every task is done, submit evidence for AI review.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active Grievances", val: withPlan.length, color: "text-slate-800", bg: "bg-white", border: "border-slate-200" },
          { label: "Tasks In Progress", val: inProgressTasks, color: "text-blue-800", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "Tasks Completed", val: `${completedTasks} / ${totalTasks}`, color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-100" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl px-5 py-4 shadow-sm`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className={`text-xs font-semibold ${s.color} opacity-60 mt-1`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* No-plan alert */}
      {withoutPlan.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-bold text-amber-800">
              {withoutPlan.length} grievance{withoutPlan.length > 1 ? "s" : ""} need an AI plan
            </p>
            <p className="text-xs text-amber-700 mt-0.5 mb-2">
              Run the AI pipeline from the{" "}
              <button onClick={() => navigate("/officer/test-agents")} className="underline font-semibold">
                Test AI Agents
              </button>{" "}
              page to generate action plans.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {withoutPlan.map(g => (
                <span key={g.id} className="text-xs font-mono font-bold bg-white border border-amber-300 text-amber-800 px-2 py-0.5 rounded">
                  {g.id}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grievance cards */}
      <div className="space-y-4">
        {withPlan.map(g => {
          const tasks = g.ai_workflow.tasks || [];
          const isExpanded = !!expandedCards[g.id];
          const statuses = taskStatuses[g.dbId] || {};
          const doneCount = tasks.filter(t => (statuses[t.id] || "Pending") === "Completed").length;
          const allDone = doneCount === tasks.length && tasks.length > 0;
          const pct = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

          return (
            <motion.div
              key={g.dbId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <button
                onClick={() => toggleExpand(g.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded flex-shrink-0">
                    {g.id}
                  </span>
                  <span className="text-sm font-bold text-slate-800 truncate">{g.title}</span>
                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={g.priority} />
                    <SLABadge slaRemaining={g.slaRemaining} slaStatus={g.slaStatus} />
                  </div>
                </div>
                <div className="flex items-center gap-5 flex-shrink-0 ml-4">
                  <div className="hidden sm:flex flex-col items-end gap-1.5 w-28">
                    <span className="text-xs font-semibold text-slate-400">
                      {doneCount}/{tasks.length} done
                    </span>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-blue-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {allDone && (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                      All Done ✓
                    </span>
                  )}
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {/* Expanded task list */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <ClipboardList size={13} /> Action Plan Tasks
                      </p>

                      <div className="space-y-2.5">
                        {tasks.map((task, idx) => {
                          const status = statuses[task.id] || "Pending";
                          const cfg = statusConfig[status];
                          const isSaving = saving[task.id];

                          return (
                            <div
                              key={task.id}
                              className={`flex items-center gap-4 bg-white border rounded-xl px-4 py-3.5 shadow-sm transition-all ${
                                status === "Completed"
                                  ? "border-emerald-200"
                                  : status === "In Progress"
                                  ? "border-blue-200"
                                  : "border-slate-200"
                              }`}
                            >
                              {/* Step number */}
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  status === "Completed"
                                    ? "bg-emerald-500 text-white"
                                    : status === "In Progress"
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-200 text-slate-500"
                                }`}
                              >
                                {status === "Completed" ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  idx + 1
                                )}
                              </div>

                              {/* Title + dept */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-semibold leading-snug ${
                                    status === "Completed"
                                      ? "line-through text-slate-400"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{task.department}</p>
                              </div>

                              {/* Status button — click to cycle */}
                              <button
                                onClick={() => handleStatusCycle(g, task.id)}
                                disabled={isSaving}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all select-none ${
                                  cfg.bg
                                } ${cfg.text} ${cfg.border} hover:opacity-80 active:scale-95 ${
                                  isSaving ? "opacity-50 cursor-wait" : "cursor-pointer"
                                }`}
                              >
                                <cfg.icon className={`h-3.5 w-3.5 ${cfg.iconColor} ${isSaving ? "animate-spin" : ""}`} />
                                {isSaving ? "Saving…" : status}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Submit Evidence CTA */}
                      {allDone && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-5 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-sm font-bold text-emerald-800">🎉 All tasks complete!</p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                              Upload before & after photos so the AI can verify the resolution.
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              navigate("/officer/upload-evidence", {
                                state: { grievanceId: g.id, grievanceDbId: g.dbId },
                              })
                            }
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow hover:bg-emerald-700 transition-colors flex-shrink-0"
                          >
                            <Upload size={15} /> Submit Evidence
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {withPlan.length === 0 && withoutPlan.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center py-20 text-slate-400">
            <Bot size={40} className="mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500">No grievances found</p>
          </div>
        )}
      </div>
    </OfficerLayout>
  );
}
