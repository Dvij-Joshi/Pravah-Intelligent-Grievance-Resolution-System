import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ArrowLeft, MapPin, User, Tag, Clock,
  CheckCircle2, Circle, AlertTriangle, ChevronRight,
  Zap, FileText, Bell, Camera, MessageSquare, Phone,
  TrendingUp, Activity, Star, RefreshCw, AlertOctagon,
  Building2, CalendarDays, Hash, Eye, ExternalLink, Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ─── Static mock data for the grievance ──────────────────────────────────────
function buildGrievanceDetails(data, gid) {
  const category   = data?.ai_triage_data?.category || data?.category || "Processing...";
  const location   = data?.location || "Unknown Location";
  const desc       = data?.description || "";
  const slaHours   = data?.ai_triage_data?.estimated_sla_hours || 48;
  const priority   = data?.ai_triage_data?.priority?.toUpperCase() || data?.priority?.toUpperCase() || "MEDIUM";
  
  const created = new Date(data?.created_at || Date.now());
  const hoursElapsed = Math.max(0, Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60)));
  const pct        = Math.min(100, Math.round((hoursElapsed / slaHours) * 100));

  let stage = 0;
  if (data?.ai_triage_data) stage = 1;
  if (data?.ai_workflow) stage = 2;

  const steps = [
    { label: "Submitted",              done: true,  active: false },
    { label: "AI Triage & Structured", done: stage >= 1,  active: stage === 0 },
    { label: "Action Plan Generated",  done: stage >= 2,  active: stage === 1 },
    { label: "Field Inspection",       done: stage >= 3,  active: stage === 2 },
    { label: "Repair & Resolution",    done: stage >= 4,  active: stage === 3 },
    { label: "Evidence Verified",      done: stage >= 5,  active: stage === 4 },
    { label: "Closed",                 done: stage >= 6,  active: stage === 5 },
  ];

  const aiTasks = data?.ai_workflow?.tasks || [];
  let tasks = aiTasks.map((t, i) => ({
    id: typeof t.id === 'string' ? parseInt(t.id, 10) || (i + 1) : (t.id || (i + 1)),
    title: t.title,
    assignee: t.department || "Field Team",
    status: i === 0 ? "active" : "pending",
    time: `${Math.round(slaHours * ((i + 1) / Math.max(1, aiTasks.length)))}h deadline`
  }));

  if (tasks.length === 0) {
    tasks = [
      { id: 1, title: "Waiting for AI Action Plan...", assignee: "AI Agent", status: "pending", time: "--" }
    ];
  }

  const updates = [
    { id: 1, time: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: "submit", msg: "Grievance submitted successfully. ID assigned: " + gid }
  ];
  if (data?.ai_triage_data) {
    updates.push({ id: 2, time: "Triage Done", icon: "ai", msg: `Triage Agent processed complaint — Priority: ${priority}, Dept: ${data.ai_triage_data.department || data.ai_workflow?.primary_department || 'Pending'}` });
  }
  if (data?.ai_workflow) {
    updates.push({ id: 3, time: "Plan Ready", icon: "ai", msg: `Resolution Planner generated a ${aiTasks.length}-step action workflow` });
  }

  return {
    gid,
    category,
    location,
    description: desc,
    department: data?.ai_workflow?.primary_department || data?.ai_triage_data?.department || "Pending Assignment",
    officer: { name: "Pending Assignment", role: "Officer", ward: "" },
    priority,
    status: stage >= 2 ? "In Progress" : "Processing",
    submittedAt: created.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ", " + created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    slaDeadline: `${slaHours}h from submission`,
    hoursElapsed,
    slaHours,
    slaPct: pct,
    filesCount: data?.files?.length || 0,
    isAnonymous: data?.contact === null,
    contactName: data?.contact?.name || null,
    triage: data?.ai_triage_data || {
      summary: "Waiting for Triage Agent...",
      urgency_reason: [],
      affected_population: "Unknown",
      confidence: 0
    },
    steps,
    tasks,
    updates,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const TASK_STYLE = {
  done:    { bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500"  },
  active:  { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500"   },
  pending: { bg: "bg-slate-50",   text: "text-slate-500",  border: "border-slate-200",  dot: "bg-slate-300"  },
};

const UPDATE_STYLE = {
  submit: { dot: "bg-slate-500",   Icon: Hash       },
  ai:     { dot: "bg-blue-500",    Icon: Zap        },
  assign: { dot: "bg-amber-500",   Icon: User       },
  action: { dot: "bg-green-500",   Icon: CheckCircle2 },
  active: { dot: "bg-blue-500",    Icon: Activity   },
  alert:  { dot: "bg-red-500",     Icon: AlertOctagon },
};

function ProgressStepper({ steps }) {
  return (
    <div className="relative">
      {/* Vertical connector */}
      <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-slate-200 rounded-full" />
      <div className="space-y-4">
        {steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative flex items-center gap-4 pl-1">
            <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
              s.done   ? "bg-green-500 border-green-500" :
              s.active ? "bg-blue-500 border-blue-400 shadow-md shadow-blue-200 animate-pulse" :
                         "bg-white border-slate-300"
            }`}>
              {s.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
              ) : s.active ? (
                <span className="w-2 h-2 bg-white rounded-full" />
              ) : (
                <Circle className="h-3 w-3 text-slate-300" />
              )}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className={`text-sm font-semibold ${
                s.done ? "text-slate-700" : s.active ? "text-blue-700" : "text-slate-400"
              }`}>
                {s.label}
              </span>
              {s.active && (
                <span className="text-xs font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Active
                </span>
              )}
              {s.done && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlaRing({ pct }) {
  const color = pct >= 85 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#22c55e";
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
      <motion.circle
        cx="40" cy="40" r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeDasharray={circ}
        strokeLinecap="round"
        strokeDashoffset={dash}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: dash }}
        transition={{ duration: 1, delay: 0.3 }}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="44" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
}

const TABS = [
  { id: "overview", label: "Overview", Icon: Eye },
  { id: "tasks",    label: "Action Plan", Icon: CheckCircle2 },
  { id: "updates",  label: "Updates", Icon: Bell },
  { id: "ai",       label: "AI Analysis", Icon: Zap },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GrievanceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grievance, setGrievance] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    async function fetchGrievance() {
      const { data } = await supabase.from('grievances').select('*').eq('id', id).single();
      setGrievance(data);
      setDbLoading(false);
    }
    fetchGrievance();

    const channel = supabase
      .channel(`grievance-details-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'grievances', filter: `id=eq.${id}` },
        (payload) => {
          setGrievance(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    );
  }

  const gid = grievance?.readable_id || id.slice(0, 8).toUpperCase();
  const g   = buildGrievanceDetails(grievance, gid);

  const PRIORITY_BADGE = {
    HIGH:   "bg-red-100 text-red-700 border-red-200",
    MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
    LOW:    "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-700" />
              <span className="font-bold text-slate-900 text-lg">Pravah</span>
            </div>
          </div>
          <button onClick={() => navigate(`/track/${id}`)}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-all hover:bg-blue-100">
            <Activity className="h-4 w-4" /> Live Track
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {/* ── Action Required Banner ── */}
        {g.status === 'Pending Feedback' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500 rounded-xl text-white flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-950">Action Required: Verify Resolution</h3>
                <p className="text-xs text-green-700 mt-0.5">
                  Officer Rahul Sharma has marked this grievance as resolved. AI Evidence Agent verified before/after photos with 91% confidence. Please verify if the issue is resolved.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/feedback/${id}`)}
              className="flex-shrink-0 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm whitespace-nowrap"
            >
              Verify Resolution <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* ── Hero card ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Color accent top bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />
          <div className="p-6">
            {/* ID + badges */}
            <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Grievance ID</p>
                <h1 className="text-2xl font-extrabold text-blue-700 font-mono">{gid}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${PRIORITY_BADGE[g.priority]}`}>
                  {g.priority}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {g.status}
                </span>
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-sm">
              {[
                { Icon: Tag,          label: "Category",    val: g.category },
                { Icon: MapPin,       label: "Location",    val: g.location },
                { Icon: Building2,    label: "Department",  val: g.department },
                { Icon: User,         label: "Assigned To", val: `${g.officer.name} (${g.officer.role})` },
                { Icon: CalendarDays, label: "Submitted",   val: g.submittedAt },
                { Icon: Clock,        label: "SLA",         val: g.slaDeadline },
              ].map(({ Icon, label, val }) => (
                <div key={label} className="flex items-start gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <Icon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
                    <p className="text-sm text-slate-800 font-medium truncate">{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed">{g.description}</p>
              {g.filesCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                  <Camera className="h-3.5 w-3.5" />
                  {g.filesCount} evidence file{g.filesCount > 1 ? "s" : ""} attached
                </div>
              )}
            </div>

            {/* SLA ring + label */}
            <div className="mt-5 flex items-center gap-5 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <SlaRing pct={g.slaPct} />
              <div>
                <p className="text-sm font-bold text-slate-800">SLA Used</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {g.hoursElapsed}h elapsed of {g.slaHours}h SLA deadline
                </p>
                <div className="mt-2 h-2 bg-slate-200 rounded-full w-48 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${g.slaPct >= 85 ? "bg-red-500" : g.slaPct >= 60 ? "bg-amber-500" : "bg-green-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${g.slaPct}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{g.slaHours - g.hoursElapsed}h remaining</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  tab === t.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}>
                <t.Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Overview: Progress stepper ── */}
            {tab === "overview" && (
              <motion.div key="overview"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Resolution Journey
                  </h2>
                  <ProgressStepper steps={g.steps} />
                </div>

                {/* Officer contact card */}
                <div className="border-t border-slate-100 pt-5">
                  <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Assigned Officer
                  </h2>
                  <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-bold text-lg">
                        {g.officer.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{g.officer.name}</p>
                      <p className="text-xs text-slate-500">{g.officer.role} · {g.officer.ward}</p>
                      <p className="text-xs text-slate-400">{g.department}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors" title="Request update">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Action Plan tab ── */}
            {tab === "tasks" && (
              <motion.div key="tasks"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  AI-Generated Action Plan
                </h2>
                <p className="text-xs text-slate-400 mb-5">Created by Resolution Planner Agent (GPT-OSS 120B)</p>
                <div className="space-y-2.5">
                  {g.tasks.map((task, i) => {
                    const s = TASK_STYLE[task.status];
                    return (
                      <motion.div key={task.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border ${s.bg} ${s.border}`}>
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${s.dot} ${task.status === "active" ? "animate-pulse" : ""}`}>
                          {task.status === "done"
                            ? <CheckCircle2 className="h-3 w-3 text-white" />
                            : <span className="text-white text-[9px] font-bold">{task.id}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${s.text} ${task.status === "done" ? "line-through opacity-70" : ""}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-400">{task.assignee} · {task.time}</p>
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

            {/* ── Updates feed tab ── */}
            {tab === "updates" && (
              <motion.div key="updates"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  Activity Feed
                </h2>
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200 rounded" />
                  {g.updates.map((u, i) => {
                    const { dot, Icon } = UPDATE_STYLE[u.icon] || UPDATE_STYLE.action;
                    return (
                      <motion.div key={u.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="relative flex items-start gap-3">
                        <div className={`absolute -left-[18px] w-4 h-4 rounded-full ${dot} flex items-center justify-center`}>
                          <Icon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                          <p className="text-sm text-slate-800">{u.msg}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{u.time}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Request update CTA */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-xs text-slate-500 mb-3">Not seeing progress? Request a status update from the officer.</p>
                  {feedbackSent ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> Update request sent to Rahul Sharma
                    </motion.div>
                  ) : (
                    <button onClick={() => setFeedbackSent(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200">
                      <RefreshCw className="h-4 w-4" /> Request Status Update
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── AI Analysis tab ── */}
            {tab === "ai" && (
              <motion.div key="ai"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-4">
                {/* Triage output */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" /> Triage Agent Analysis
                    <span className="ml-auto text-xs bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-mono">GPT-OSS 120B</span>
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">Structured output from unstructured citizen description</p>
                  <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs space-y-0.5 overflow-x-auto">
                    <p><span className="text-slate-500">{"{"}</span></p>
                    {grievance?.ai_triage_data ? (
                      Object.entries(grievance.ai_triage_data).map(([key, val], index, arr) => {
                        const isLast = index === arr.length - 1;
                        let valSpan;
                        if (Array.isArray(val)) {
                          valSpan = <>[ {val.map((v, i) => <React.Fragment key={i}><span className="text-amber-300">"{v}"</span>{i < val.length - 1 ? ", " : ""}</React.Fragment>)} ]</>;
                        } else if (typeof val === 'number') {
                          valSpan = <span className="text-purple-400">{val}</span>;
                        } else {
                          valSpan = <span className={key === 'priority' ? "text-red-400" : "text-amber-300"}>"{val}"</span>;
                        }
                        return (
                          <p key={key}>&nbsp;&nbsp;<span className="text-blue-400">"{key}"</span>: {valSpan}{!isLast && ","}</p>
                        );
                      })
                    ) : (
                      <p>&nbsp;&nbsp;<span className="text-slate-400 italic">// Waiting for AI Agent...</span></p>
                    )}
                    <p><span className="text-slate-500">{"}"}</span></p>
                  </div>
                </div>

                {/* Confidence + Recurrence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">AI Confidence</p>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-3xl font-extrabold text-green-600">{Math.round((g.triage?.confidence || 0.94) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-green-500 rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${g.triage.confidence * 100}%` }}
                        transition={{ duration: 1 }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">High confidence classification</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-2">Recurrence Signal</p>
                    <p className="text-xl font-extrabold text-amber-700">3 similar</p>
                    <p className="text-xs text-amber-600 mt-1">complaints in {g.location.split(",")[0]} recently. Similarity engine monitoring for systemic pattern.</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" /> Watch for systemic alert
                    </div>
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
