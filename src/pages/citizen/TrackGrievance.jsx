import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ArrowLeft, Clock, MapPin, User, Zap,
  CheckCircle2, Circle, AlertTriangle, ChevronRight,
  Bell, TrendingUp, FileSearch, GitBranch, BarChart2,
  AlertOctagon, RefreshCw, Activity,
} from "lucide-react";

// ─── Mock data factory ────────────────────────────────────────────────────────
function buildGrievanceState(data, gid) {
  const category = data?.category || "Water Supply";
  const location = data?.location || "Ward 5, Near Government School";
  const slaHours = { "Water Supply": 48, "Road Infrastructure": 72, "Electricity": 24 }[category] ?? 48;
  return {
    gid,
    category,
    location,
    description: data?.description || "No water supply for 4 days. Multiple households affected.",
    department: "Water Supply Department",
    officer: "Rahul Sharma (Ward Officer)",
    submittedAt: new Date(),
    slaHours,
    priority: "HIGH",
    actionPlan: [
      { id: 1, title: "Verify complaint location", responsible: "Ward Officer", deadline: "4 hrs",  status: "done" },
      { id: 2, title: "Inspect water pipeline",    responsible: "Field Team",   deadline: "12 hrs", status: "active" },
      { id: 3, title: "Identify fault cause",      responsible: "Water Dept",   deadline: "20 hrs", status: "pending", dep: "Inspection" },
      { id: 4, title: "Repair fault",              responsible: "Maintenance",  deadline: "36 hrs", status: "pending", dep: "Cause identified" },
      { id: 5, title: "Upload resolution evidence",responsible: "Field Team",   deadline: "44 hrs", status: "pending" },
      { id: 6, title: "Citizen verification",      responsible: "Citizen",      deadline: "48 hrs", status: "pending" },
    ],
    timeline: [
      { time: "Just now",  event: "Grievance submitted by citizen",          type: "submit" },
      { time: "0m ago",    event: "Triage Agent structured complaint",        type: "ai" },
      { time: "1m ago",    event: "Resolution Planner generated action plan", type: "ai" },
      { time: "2m ago",    event: "Assigned to Rahul Sharma (Ward Officer)",  type: "assign" },
    ],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    { label: "Triage Agent",       model: "GPT-OSS 120B", done: stage >= 0, active: false },
    { label: "Resolution Planner", model: "GPT-OSS 120B", done: stage >= 1, active: false },
    { label: "SLA Engine",         model: "Rules Engine",  done: stage >= 1, active: stage === 1 },
    { label: "Evidence Agent",     model: "Qwen 3.6 27B",  done: stage >= 3, active: stage === 2 },
    { label: "Resolution Agent",   model: "GPT-OSS 120B",  done: stage >= 4, active: stage === 3 },
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TrackGrievance({ data, grievanceId, onBack, onHome, onDetails }) {
  const gid = grievanceId || "GRV-1024";
  const [state, setState] = useState(() => buildGrievanceState(data, gid));
  const [hoursElapsed, setHoursElapsed] = useState(2);
  const [agentStage, setAgentStage] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("plan");

  function pushNotif(msg, type = "info") {
    const id = Date.now();
    setNotifications(p => [{ id, msg, type }, ...p.slice(0, 3)]);
    setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000);
  }

  async function simulateTime() {
    if (isSimulating) return;
    setIsSimulating(true);

    // Advance 24 hours in stages
    for (let h = 6; h <= 24; h += 6) {
      await new Promise(r => setTimeout(r, 700));
      setHoursElapsed(prev => prev + 6);
    }

    // Trigger escalation if no action taken (simulated)
    await new Promise(r => setTimeout(r, 500));
    setEscalated(true);
    pushNotif("⚠️ SLA risk HIGH — officer reminder sent", "warn");

    await new Promise(r => setTimeout(r, 900));
    pushNotif("🔔 Supervisor notified: Rahul Sharma has not filed inspection", "warn");

    // Advance action plan — step 2 completes
    setState(prev => ({
      ...prev,
      actionPlan: prev.actionPlan.map(t =>
        t.id === 2 ? { ...t, status: "done" } :
        t.id === 3 ? { ...t, status: "active" } : t
      ),
      timeline: [
        { time: "now", event: "Supervisor escalation triggered automatically", type: "escalate" },
        { time: "now", event: "Pipeline inspection completed by Field Team", type: "action" },
        ...prev.timeline,
      ],
    }));

    await new Promise(r => setTimeout(r, 800));
    setAgentStage(2);
    pushNotif("✅ Field inspection complete — cause identification started", "success");
    setIsSimulating(false);
  }

  const slaRisk = hoursElapsed / state.slaHours;
  const overallStatus =
    slaRisk >= 1 ? "Overdue" :
    slaRisk >= 0.8 ? "SLA At Risk" :
    escalated ? "Escalated" :
    "In Progress";

  const statusStyle = {
    "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
    "SLA At Risk": "bg-amber-100 text-amber-700 border-amber-200",
    "Overdue":     "bg-red-100 text-red-700 border-red-200",
    "Escalated":   "bg-purple-100 text-purple-700 border-purple-200",
  }[overallStatus];

  const TABS = [
    { id: "plan",     label: "Action Plan",  icon: GitBranch },
    { id: "timeline", label: "Timeline",     icon: Clock },
    { id: "ai",       label: "AI Pipeline",  icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Floating notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-72">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
                n.type === "warn"    ? "bg-amber-50 border-amber-200 text-amber-800" :
                n.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
                                       "bg-white border-slate-200 text-slate-800"
              }`}
            >
              {n.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-700" />
              <span className="font-bold text-slate-900 text-lg">Pravah</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onDetails && (
              <button onClick={onDetails}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-all hover:bg-blue-100">
                View Details
              </button>
            )}
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Citizen Portal
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {/* ── Header card ─────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Grievance ID</p>
              <h1 className="text-2xl font-extrabold text-blue-700 font-mono">{gid}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${PRIORITY_BADGE[state.priority]}`}>
                {state.priority} PRIORITY
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusStyle} flex items-center gap-1`}>
                {(overallStatus === "SLA At Risk" || overallStatus === "Overdue") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
                )}
                {overallStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
              {state.location}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
              {state.officer}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <BarChart2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
              {state.category}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Bell className="h-4 w-4 text-slate-400 flex-shrink-0" />
              {state.department}
            </div>
          </div>

          {/* SLA Bar */}
          <SlaBar hoursElapsed={hoursElapsed} slaHours={state.slaHours} />

          {/* Escalation banner */}
          <AnimatePresence>
            {escalated && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mt-4 flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-3">
                <AlertOctagon className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-purple-800">Escalated to Supervisor</p>
                  <p className="text-xs text-purple-600">No field inspection recorded after 24h — system escalated automatically.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Demo simulation button ──────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <button onClick={simulateTime} disabled={isSimulating}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-dashed border-blue-300 text-blue-700 font-semibold text-sm hover:bg-blue-50 hover:border-blue-500 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
            <RefreshCw className={`h-4 w-4 ${isSimulating ? "animate-spin" : ""}`} />
            {isSimulating ? "Simulating 24 hours…" : "⚡ Simulate 24 Hours (Watch AI Automation)"}
          </button>
          <p className="text-center text-xs text-slate-400 mt-1.5">
            Advances time to trigger SLA monitoring, officer reminders &amp; auto-escalation
          </p>
        </motion.div>

        {/* ── Tabs ────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* Action Plan Tab */}
            {activeTab === "plan" && (
              <motion.div key="plan"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                  AI-Generated Resolution Plan
                </h2>
                <p className="text-xs text-slate-400 mb-5">Generated by Resolution Planner Agent (GPT-OSS 120B)</p>
                <div className="space-y-3">
                  {state.actionPlan.map((task, i) => {
                    const s = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                    return (
                      <motion.div key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border ${s.bg} ${s.border}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          task.status === "done"   ? "bg-green-500" :
                          task.status === "active" ? "bg-blue-500 animate-pulse" :
                                                     "bg-slate-300"
                        }`}>
                          {task.status === "done" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <span className="text-white text-[10px] font-bold">{task.id}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${s.text} ${task.status === "done" ? "line-through opacity-70" : ""}`}>
                            {task.title}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs text-slate-500">{task.responsible}</span>
                            <span className="text-xs text-slate-400">· Due: {task.deadline}</span>
                            {task.dep && <span className="text-xs text-slate-400 italic">· Needs: {task.dep}</span>}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                          {task.status}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <motion.div key="timeline"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Event Timeline
                </h2>
                <div className="relative pl-6 space-y-5">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200 rounded" />
                  {state.timeline.map((evt, i) => {
                    const dot =
                      evt.type === "ai"       ? "bg-blue-500" :
                      evt.type === "escalate" ? "bg-purple-500" :
                      evt.type === "action"   ? "bg-green-500" :
                      evt.type === "assign"   ? "bg-amber-500" :
                                                "bg-slate-400";
                    const Icon =
                      evt.type === "ai"       ? Zap :
                      evt.type === "escalate" ? AlertOctagon :
                      evt.type === "action"   ? CheckCircle2 :
                                                Bell;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-3">
                        <div className={`absolute left-0 w-4 h-4 rounded-full ${dot} flex items-center justify-center -translate-x-0.5`}
                          style={{ top: `${i * 52 + 2}px` }}>
                          <Icon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex-1">
                          <p className="text-sm font-medium text-slate-800">{evt.event}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{evt.time}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* AI Pipeline Tab */}
            {activeTab === "ai" && (
              <motion.div key="ai"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    Multi-Agent Pipeline Status
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">Live view of AI agents processing this grievance</p>
                  <AgentPipeline stage={agentStage} />
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Triage Agent Output</h3>
                  <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-green-400 space-y-0.5">
                    <p><span className="text-slate-500">{'{'}</span></p>
                    <p>&nbsp;&nbsp;<span className="text-blue-400">"category"</span>: <span className="text-amber-300">"{state.category}"</span>,</p>
                    <p>&nbsp;&nbsp;<span className="text-blue-400">"department"</span>: <span className="text-amber-300">"Water Supply Dept"</span>,</p>
                    <p>&nbsp;&nbsp;<span className="text-blue-400">"priority"</span>: <span className="text-red-400">"HIGH"</span>,</p>
                    <p>&nbsp;&nbsp;<span className="text-blue-400">"affected_population"</span>: <span className="text-amber-300">"Multiple households"</span>,</p>
                    <p>&nbsp;&nbsp;<span className="text-blue-400">"urgency_reason"</span>: [<span className="text-amber-300">"Essential service"</span>, <span className="text-amber-300">"4-day duration"</span>]</p>
                    <p><span className="text-slate-500">{'}'}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-blue-800">Recurrence Check</p>
                    <p className="text-xs text-blue-600">3 similar complaints detected in {state.location.split(",")[0]}. Monitoring for systemic pattern.</p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
