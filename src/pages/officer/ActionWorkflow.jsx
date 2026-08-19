import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Activity,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  ClipboardList,
  Check
} from "lucide-react";
import OfficerLayout from "../../layouts/OfficerLayout";
import { PriorityBadge, SLABadge } from "../../components/Badges";
import { useGrievances } from "../../hooks/useGrievances";
import { supabase } from "../../lib/supabase";

const statusConfig = {
  Completed: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  "In Progress": {
    icon: Activity,
    iconColor: "text-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  Pending: {
    icon: Circle,
    iconColor: "text-slate-300",
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200",
  },
};

const getNextStatus = (current) => {
  if (current === 'Pending') return 'In Progress';
  if (current === 'In Progress') return 'Completed';
  return 'Pending';
};

export default function ActionWorkflow() {
  const navigate = useNavigate();
  const { grievances } = useGrievances();
  const [expandedCards, setExpandedCards] = useState({});
  const [updating, setUpdating] = useState(null);

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusCycle = async (g, taskId, currentStatus) => {
    if (updating) return;
    setUpdating(taskId);
    try {
      const nextStatus = getNextStatus(currentStatus);
      const currentStatuses = g.ai_workflow?.task_statuses || {};
      const updatedMap = { ...currentStatuses, [taskId]: nextStatus };
      
      const { error } = await supabase
        .from('grievances')
        .update({
          ai_workflow: {
            ...g.ai_workflow,
            task_statuses: updatedMap
          }
        })
        .eq('id', g.dbId);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(null);
    }
  };

  const withPlan = grievances.filter(g => g.ai_workflow?.tasks?.length > 0);
  const withoutPlan = grievances.filter(g => !g.ai_workflow?.tasks || g.ai_workflow.tasks.length === 0);

  let activeGrievancesCount = withPlan.length;
  let tasksInProgress = 0;
  let tasksCompleted = 0;
  let totalTasks = 0;

  withPlan.forEach(g => {
    const tasks = g.ai_workflow.tasks || [];
    const statuses = g.ai_workflow.task_statuses || {};
    totalTasks += tasks.length;
    tasks.forEach(t => {
      const s = statuses[t.id] || 'Pending';
      if (s === 'In Progress') tasksInProgress++;
      if (s === 'Completed') tasksCompleted++;
    });
  });

  return (
    <OfficerLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Action Workflow</h2>
        <p className="text-sm text-slate-500 mt-1">Manage AI-generated action plans and track task progress.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-1">Active Grievances (w/ Plans)</p>
          <p className="text-3xl font-bold text-slate-900">{activeGrievancesCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-blue-600 mb-1">Tasks In Progress</p>
          <p className="text-3xl font-bold text-blue-800">{tasksInProgress}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-emerald-600 mb-1">Tasks Completed</p>
          <p className="text-3xl font-bold text-emerald-800">{tasksCompleted} / {totalTasks}</p>
        </div>
      </div>

      {withoutPlan.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-amber-800">No Action Plan Generated</h4>
            <p className="text-xs text-amber-700 mt-1 mb-2">
              The following grievances require an AI plan. Run the pipeline from the Test AI Agents page.
            </p>
            <div className="flex flex-wrap gap-2">
              {withoutPlan.map(g => (
                <span key={g.id} className="text-xs font-semibold bg-white border border-amber-200 text-amber-800 px-2.5 py-1 rounded-md shadow-sm">
                  {g.id}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {withPlan.map(g => {
          const tasks = g.ai_workflow.tasks || [];
          const statuses = g.ai_workflow.task_statuses || {};
          const isExpanded = !!expandedCards[g.id];
          const completedCount = tasks.filter(t => (statuses[t.id] || 'Pending') === 'Completed').length;
          const allCompleted = completedCount === tasks.length && tasks.length > 0;
          const progressPct = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

          return (
            <motion.div
              key={g.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
            >
              <div 
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(g.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded flex-shrink-0">
                    {g.id}
                  </span>
                  <span className="text-sm font-bold text-slate-800 truncate">{g.title}</span>
                  <PriorityBadge priority={g.priority} />
                  <SLABadge slaRemaining={g.slaRemaining} slaStatus={g.slaStatus} />
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end gap-1.5 w-32">
                    <div className="flex justify-between w-full text-xs font-semibold text-slate-500">
                      <span>Progress</span>
                      <span>{completedCount}/{tasks.length}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${allCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <ChevronDown 
                    size={20} 
                    className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                  >
                    <div className="p-5 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ClipboardList size={14} /> Action Plan Tasks
                      </h4>
                      <div className="grid gap-2.5">
                        {tasks.map((task, idx) => {
                          const currentStatus = statuses[task.id] || 'Pending';
                          const cfg = statusConfig[currentStatus];
                          const isUpdating = updating === task.id;

                          return (
                            <div key={task.id} className="flex items-center justify-between bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-xs font-bold text-slate-400 w-5 h-5 flex items-center justify-center bg-slate-100 rounded-full">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold ${currentStatus === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                    {task.title}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{task.department}</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusCycle(g, task.id, currentStatus); }}
                                disabled={isUpdating}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${cfg.bg} ${cfg.text} ${cfg.border} hover:shadow-md ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <cfg.icon className={`h-3.5 w-3.5 ${cfg.iconColor}`} />
                                {currentStatus}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {allCompleted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 pt-4 border-t border-slate-200 flex justify-end"
                        >
                          <button
                            onClick={() => navigate('/officer/upload-evidence', { state: { grievanceId: g.id, grievanceDbId: g.dbId } })}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-700 transition-colors"
                          >
                            <Check size={16} />
                            Submit Evidence
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
      </div>
    </OfficerLayout>
  );
}
