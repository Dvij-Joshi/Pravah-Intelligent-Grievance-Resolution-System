import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ArrowLeft, Clock, MapPin, User, Zap,
  CheckCircle2, Circle, AlertTriangle, ChevronRight,
  Bell, TrendingUp, FileSearch, GitBranch, BarChart2,
  AlertOctagon, RefreshCw, Activity, Loader2, ListChecks
} from "lucide-react";
import { supabase } from "../../lib/supabase";

function buildGrievanceState(data, gid) {
  const category = data?.ai_triage_data?.category || data?.category || "Processing...";
  const location = data?.location || "Unknown Location";
  const slaHours = data?.ai_triage_data?.estimated_sla_hours || 48;
  const priority = data?.ai_triage_data?.priority?.toUpperCase() || data?.priority?.toUpperCase() || "MEDIUM";
  
  let stage = 0;
  if (data?.ai_triage_data) stage = 1;
  if (data?.ai_workflow) stage = 2;
  
  const progress = data?.task_progress || [];
  const hasOldProgress = data?.ai_workflow?.task_statuses ? Object.values(data.ai_workflow.task_statuses).some(s => s === "Completed" || s === "In Progress") : false;
  const hasProgress = progress.some(p => p.status === "done" || p.status === "active") || hasOldProgress;
  const hasEvidence = data?.resolution_evidence_urls?.length > 0 || data?.ai_evidence_report;
  
  if (hasProgress) stage = 3;
  if (hasEvidence) stage = 4;
  if (data?.ai_evidence_report?.recommendation === "APPROVE" || data?.status === "Resolved") stage = 5;
  if (data?.status === "Closed") stage = 6;
  if (data?.status === "In Progress" && stage >= 4) stage = 3;

  const aiTasks = data?.ai_workflow?.tasks || [];

  let actionPlan = aiTasks.map((t, i) => {
    let savedStatus = progress.find(p => p.id === (t.id ?? i))?.status;
    if (!savedStatus && data?.ai_workflow?.task_statuses) {
      const old = data.ai_workflow.task_statuses[t.id];
      if (old === "Completed") savedStatus = "done";
      else if (old === "In Progress") savedStatus = "active";
    }
    let status = savedStatus ?? (i === 0 ? "active" : "pending");
    if (stage >= 4) status = "done"; // Auto-complete if evidence submitted
    return {
      id: t.id ?? i,
      title: t.title,
      responsible: t.department || "Field Team",
      deadline: `${Math.round(slaHours * ((i + 1) / Math.max(1, aiTasks.length)))} hrs`,
      status,
    };
  });

  if (actionPlan.length === 0) {
    actionPlan = [
      { id: 1, title: "Waiting for Resolution Planner...", responsible: "AI Agent", deadline: "--", status: "pending" }
    ];
  }

  const timeline = [
    { time: data?.created_at ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now", event: "Grievance submitted by citizen", type: "submit" }
  ];

  if (data?.ai_triage_data) {
    timeline.push({ time: "Triage Done", event: `Triage Agent structured complaint (${category})`, type: "ai" });
  }
  if (data?.ai_workflow) {
    timeline.push({ time: "Plan Ready", event: "Resolution Planner generated action plan", type: "ai" });
  }
  if (data?.status === "Resolved") {
    timeline.push({ time: data?.resolved_at ? new Date(data.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Done", event: "Officer marked grievance as Resolved", type: "action" });
  }

  return {
    gid,
    category,
    location,
    description: data?.description || "",
    department: data?.ai_workflow?.primary_department || "Pending Assignment",
    officer: data?.assigned_officer_name || "Pending Assignment",
    submittedAt: data?.created_at ? new Date(data.created_at) : new Date(),
    slaHours,
    priority,
    status: data?.status || "Processing",
    actionPlan,
    timeline,
    stage
  };
}

const STATUS_COLORS = {
  done:    { bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200",  icon: "green"  },
  active:  { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200",   icon: "blue"   },
  pending: { bg: "bg-slate-100",  text: "text-slate-500",  border: "border-slate-200",  icon: "slate"  },
  overdue: { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200",    icon: "red"    },
};

const PRIORITY_BADGE = {
  HIGH:   "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW:    "bg-green-100 text-green-700 border-green-200",
};

function SlaBar({ hoursElapsed, slaHours }) {
  const pct = Math.min(100, (hoursElapsed / slaHours) * 100);
  const color = pct >= 85 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-green-500";
  const remaining = Math.max(0, slaHours - hoursElapsed);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500">{hoursElapsed}h elapsed</span>
        <span className={pct >= 85 ? "text-red-600 font-bold" : "text-slate-500"}>
          {remaining}h remaining
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1 text-slate-400">
        <span>Submitted</span>
        <span>SLA: {slaHours}h deadline</span>
      </div>
    </div>
  );
}

function AgentPipeline({ stage }) {
  const agents = [
    { label: "Triage Agent",       model: "GPT-OSS 120B", done: stage >= 1, active: stage === 0 },
    { label: "Resolution Planner", model: "GPT-OSS 120B", done: stage >= 2, active: stage === 1 },
    { label: "SLA Engine",         model: "Rules Engine",  done: stage >= 2, active: stage === 1 },
    { label: "Evidence Agent",     model: "Qwen 3.6 27B",  done: stage >= 6, active: stage >= 2 && stage < 6 }, // simplified for demo
    { label: "Resolution Agent",   model: "GPT-OSS 120B",  done: stage >= 6, active: stage >= 2 && stage < 6 },
  ];
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {agents.map((a, i) => (
        <React.Fragment key={i}>
          <div className={`flex flex-col items-center min-w-[90px] px-1`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 mb-1.5 transition-all duration-500 ${
              a.done    ? "bg-green-100 border-green-400"  :
              a.active  ? "bg-blue-100 border-blue-400 animate-pulse" :
                          "bg-slate-100 border-slate-200"
            }`}>
              {a.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : a.active ? (
                <Activity className="h-4 w-4 text-blue-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
            </div>
            <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight">{a.label}</span>
            <span className="text-[9px] text-slate-400 text-center">{a.model}</span>
          </div>
          {i < agents.length - 1 && (
            <div className={`flex-shrink-0 h-0.5 w-6 mt-[-18px] transition-all duration-500 ${
              agents[i + 1].done || a.done ? "bg-green-300" : "bg-slate-200"
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function TrackGrievance() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rawGrievance, setRawGrievance] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("plan");

  useEffect(() => {
    async function fetchGrievance() {
      const { data } = await supabase.from("grievances").select("*").eq("id", id).single();
      setRawGrievance(data);
      setDbLoading(false);
    }
    fetchGrievance();

    const channel = supabase
      .channel(`track-grievance-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "grievances", filter: `id=eq.${id}` },
        (payload) => { setRawGrievance(payload.new); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    );
  }

  const gid = rawGrievance?.readable_id || id.slice(0, 8).toUpperCase();
  const state = buildGrievanceState(rawGrievance, gid);

  const hoursElapsed = Math.max(0, Math.round((Date.now() - state.submittedAt.getTime()) / (1000 * 60 * 60)));

  const TABS = [
    { id: "plan",     label: "Action Plan", Icon: GitBranch },
    { id: "timeline", label: "Timeline",    Icon: Clock },
    { id: "pipeline", label: "AI Pipeline", Icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-10">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none">Live Tracking</span>
              <span className="font-bold text-slate-800 leading-tight">Pravah Intelligence</span>
            </div>
          </div>
          <button onClick={() => navigate(`/grievance/${id}`)} className="text-sm font-semibold text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
            View Details
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 mt-6 space-y-4">

        {state.status === "Closed" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm mb-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-500 rounded-xl text-white flex-shrink-0 mt-0.5"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Case Completed & Closed</h3>
                <p className="text-xs text-slate-600 mt-0.5">The issue has been resolved and verified.</p>
              </div>
            </div>
            <button onClick={() => navigate(`/feedback/${id}`)}
              className="flex-shrink-0 flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm whitespace-nowrap">
              View Evidence / Refile <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {state.status === "Resolved" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm mb-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500 rounded-xl text-white flex-shrink-0 mt-0.5"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <h3 className="text-sm font-bold text-green-950">Resolution Ready</h3>
                <p className="text-xs text-green-700 mt-0.5">Please verify the resolution to officially close this case.</p>
              </div>
            </div>
            <button onClick={() => navigate(`/feedback/${id}`)}
              className="flex-shrink-0 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm whitespace-nowrap">
              Verify Resolution <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Hero Info Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Grievance ID</p>
              <h1 className="text-xl font-extrabold text-blue-700 font-mono tracking-tight">{state.gid}</h1>
            </div>
            <div className="flex gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${PRIORITY_BADGE[state.priority]}`}>{state.priority} PRIORITY</span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                state.status === "Resolved" ? "bg-green-100 text-green-700 border-green-200" :
                "bg-blue-100 text-blue-700 border-blue-200"
              }`}>{state.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{state.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{state.officer}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <BarChart2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{state.category}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Bell className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{state.department}</span>
            </div>
          </div>
          <SlaBar hoursElapsed={hoursElapsed} slaHours={state.slaHours} />
        </div>

        {/* Live Sync Banner */}
        <div className="bg-blue-50/50 border border-blue-200 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Live Synchronization Active
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Watching database for officer updates & AI events</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                activeTab === t.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              <t.Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Action Plan */}
          {activeTab === "plan" && (
            <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><GitBranch className="h-4 w-4 text-blue-600" /> AI-Generated Resolution Plan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Generated by Resolution Planner Agent (GPT-OSS 120B) ï¿½ Watched in real-time</p>
              </div>
              <div className="space-y-2.5">
                {state.actionPlan.map((task, i) => {
                  const colors = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                  return (
                    <motion.div key={i} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-xl border ${colors.bg} ${colors.border}`}>
                      {task.status === "active" && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      )}
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${task.status === "done" ? "bg-green-500 text-white" : task.status === "active" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {task.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0 z-10">
                        <p className={`text-sm font-semibold truncate ${colors.text} ${task.status === "done" ? "line-through opacity-70" : ""}`}>{task.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{task.responsible} ï¿½ Due: {task.deadline}</p>
                      </div>
                      <div className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} z-10`}>
                        {task.status}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Timeline */}
          {activeTab === "timeline" && (
            <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-1.5"><Clock className="h-4 w-4 text-blue-600" /> Event Timeline</h3>
              <div className="relative pl-5 space-y-5">
                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-100 rounded" />
                {state.timeline.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[25px] mt-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${item.type === 'ai' ? 'bg-violet-500' : 'bg-blue-500'}`} />
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-sm text-slate-800 font-medium">{item.event}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Pipeline */}
          {activeTab === "pipeline" && (
            <motion.div key="pipeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5"><Activity className="h-4 w-4 text-blue-600" /> Multi-Agent Pipeline Status</h3>
                <p className="text-[10px] text-slate-400 mb-6">Live view of AI agents processing this grievance</p>
                <AgentPipeline stage={state.stage} />
              </div>

              {rawGrievance?.ai_triage_data && (
                <div className="bg-[#0A0F1E] rounded-2xl p-5 shadow-sm font-mono text-[11px] leading-relaxed overflow-hidden">
                  <p className="text-slate-400">{"{"}</p>
                  <p className="pl-4"><span className="text-blue-400">"tags"</span>: <span className="text-amber-300">[ {rawGrievance.ai_triage_data.tags?.map(t => `"${t}"`).join(", ")} ]</span>,</p>
                  <p className="pl-4"><span className="text-blue-400">"summary"</span>: <span className="text-amber-300">"{rawGrievance.ai_triage_data.summary}"</span>,</p>
                  <p className="pl-4"><span className="text-blue-400">"category"</span>: <span className="text-amber-300">"{rawGrievance.ai_triage_data.category}"</span>,</p>
                  <p className="pl-4"><span className="text-blue-400">"priority"</span>: <span className="text-red-400">"{rawGrievance.ai_triage_data.priority}"</span>,</p>
                  <p className="pl-4"><span className="text-blue-400">"estimated_sla_hours"</span>: <span className="text-purple-400">{rawGrievance.ai_triage_data.estimated_sla_hours}</span></p>
                  <p className="text-slate-400">{"}"}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
