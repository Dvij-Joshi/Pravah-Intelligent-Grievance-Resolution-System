import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, User, Phone, Calendar, Clock,
  AlertTriangle, CheckCircle2, Circle, ChevronRight,
  FileText, MessageSquare, Activity, Workflow, Upload, Send,
  Building2, Tag, Hash, Loader2, CheckSquare,
} from "lucide-react";
import OfficerLayout from "../../layouts/OfficerLayout";
import { PriorityBadge, StatusBadge, SLABadge } from "../../components/Badges";
import { supabase } from "../../lib/supabase";

const TABS = ["Details", "Timeline", "Action Plan", "History"];

const timelineIconMap = {
  submitted:  { icon: FileText,       color: "text-blue-600",   bg: "bg-blue-100",   border: "border-blue-200" },
  ai:         { icon: Activity,       color: "text-violet-600", bg: "bg-violet-100", border: "border-violet-200" },
  assigned:   { icon: User,           color: "text-slate-600",  bg: "bg-slate-100",  border: "border-slate-200" },
  action:     { icon: Workflow,       color: "text-amber-600",  bg: "bg-amber-100",  border: "border-amber-200" },
  pending:    { icon: Circle,         color: "text-slate-300",  bg: "bg-white",      border: "border-slate-200" },
  escalation: { icon: AlertTriangle, color: "text-red-600",    bg: "bg-red-100",    border: "border-red-200" },
};

const stepStatusStyle = {
  done:       { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", Icon: CheckCircle2, iconColor: "text-emerald-500" },
  active:     { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    Icon: Activity,     iconColor: "text-blue-500" },
  pending:    { bg: "bg-slate-50",   text: "text-slate-500",   border: "border-slate-200",   Icon: Circle,       iconColor: "text-slate-300" },
};

export default function ComplaintDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [complaint,  setComplaint]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState("Details");
  const [note,       setNote]       = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [markingDone, setMarkingDone] = useState(null); // task id being marked
  const [markingResolved, setMarkingResolved] = useState(false);

  // Fetch & realtime
  useEffect(() => {
    async function fetchComplaint() {
      const { data, error } = await supabase.from("grievances").select("*").eq("id", id).single();
      if (error) { setError(error.message); }
      else { setComplaint(data); }
      setLoading(false);
    }
    fetchComplaint();

    const channel = supabase
      .channel(`officer-complaint-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "grievances", filter: `id=eq.${id}` },
        (payload) => { setComplaint(payload.new); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Mark a task step as done
  async function markTaskDone(taskIndex) {
    if (!complaint?.ai_workflow?.tasks) return;
    setMarkingDone(taskIndex);
    const tasks   = complaint.ai_workflow.tasks;
    const current = complaint.task_progress || [];

    // Build new progress: mark this done, next one active
    const newProgress = tasks.map((t, i) => {
      const id = t.id ?? i;
      if (i < taskIndex)  return { id, status: "done" };
      if (i === taskIndex) return { id, status: "done" };
      if (i === taskIndex + 1) return { id, status: "active" };
      return current.find(p => p.id === id) || { id, status: "pending" };
    });

    const { error } = await supabase.from("grievances")
      .update({ task_progress: newProgress, status: "In Progress" })
      .eq("id", id);

    if (!error) setComplaint(prev => ({ ...prev, task_progress: newProgress }));
    setMarkingDone(null);
  }

  // Mark entire grievance as Resolved
  async function markResolved() {
    setMarkingResolved(true);
    const { error } = await supabase.from("grievances")
      .update({ status: "Resolved", resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) setComplaint(prev => ({ ...prev, status: "Resolved" }));
    setMarkingResolved(false);
  }

  // Save officer note
  async function saveNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    const existing = complaint?.officer_notes || [];
    const updated = [...existing, { note: note.trim(), by: "Officer", at: new Date().toISOString() }];
    const { error } = await supabase.from("grievances").update({ officer_notes: updated }).eq("id", id);
    if (!error) { setComplaint(prev => ({ ...prev, officer_notes: updated })); setNote(""); }
    setSavingNote(false);
  }

  if (loading) return (
    <OfficerLayout>
      <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    </OfficerLayout>
  );

  if (error || !complaint) return (
    <OfficerLayout>
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <FileText className="h-12 w-12 mb-3 text-slate-200" />
        <div className="font-medium text-slate-500">{error || "Grievance not found"}</div>
        <button onClick={() => navigate("/officer/complaints")} className="mt-3 text-sm text-blue-600 hover:underline">? Back to All Complaints</button>
      </div>
    </OfficerLayout>
  );

  // Normalise complaint fields
  const gid        = complaint.readable_id || complaint.id?.slice(0, 8)?.toUpperCase() || "—";
  const category   = complaint.ai_triage_data?.category || complaint.category || "Uncategorized";
  const department = complaint.ai_workflow?.primary_department || complaint.ai_triage_data?.department || "Pending";
  const priority   = complaint.ai_triage_data?.priority?.toUpperCase() || complaint.priority?.toUpperCase() || "MEDIUM";
  const aiTasks    = complaint.ai_workflow?.tasks || [];
  const progress   = complaint.task_progress || [];

  function getTaskStatus(i) {
    const t = aiTasks[i];
    const saved = progress.find(p => p.id === (t?.id ?? i));
    return saved?.status ?? (i === 0 ? "active" : "pending");
  }

  // Build timeline events from real data
  function buildTimeline() {
    const events = [];
    const timeStr = complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "—";
    events.push({ time: timeStr, event: "Grievance submitted by citizen", type: "submitted", done: true });
    if (complaint.ai_triage_data) {
      events.push({ time: timeStr, event: `Triage Agent structured — Category: ${category}, Priority: ${priority}`, type: "ai", done: true });
    }
    if (complaint.ai_workflow) {
      events.push({ time: timeStr, event: `Resolution plan generated — ${aiTasks.length} action steps`, type: "ai", done: true });
    }
    if (complaint.status === "Resolved" && complaint.resolved_at) {
      events.push({ time: new Date(complaint.resolved_at).toLocaleString(), event: "Officer marked grievance as Resolved", type: "action", done: true });
    }
    if (complaint.status !== "Resolved") {
      events.push({ time: "Pending", event: "Awaiting resolution & evidence upload", type: "pending", done: false });
    }
    return events;
  }

  return (
    <OfficerLayout>
      <button onClick={() => navigate("/officer/complaints")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700 mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to All Complaints
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl shadow-sm mb-5 overflow-hidden">
        {(complaint.status === "Overdue" || complaint.status === "Escalated") && (
          <div className="h-1 w-full bg-red-500" />
        )}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                <span>Officer Portal</span><ChevronRight size={12} /><span>All Complaints</span><ChevronRight size={12} />
                <span className="text-blue-600 font-semibold">{gid}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">{complaint.title || complaint.description?.slice(0, 80) || "No title"}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  complaint.status === "Resolved" ? "bg-green-100 text-green-700 border-green-200"
                  : complaint.status === "In Progress" ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>{complaint.status || "New"}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  priority === "HIGH" ? "bg-red-100 text-red-700 border-red-200"
                  : priority === "MEDIUM" ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-green-100 text-green-700 border-green-200"
                }`}>{priority} PRIORITY</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <button onClick={() => navigate("/officer/evidence")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                <Upload size={15} /> Upload Evidence
              </button>
              <button onClick={() => navigate("/officer/escalations")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors">
                <AlertTriangle size={15} /> Escalate
              </button>
              {complaint.status !== "Resolved" && (
                <button onClick={markResolved} disabled={markingResolved}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-60">
                  {markingResolved ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Mark Resolved
                </button>
              )}
              {complaint.status === "Resolved" && (
                <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
                  <CheckCircle2 size={15} /> Resolved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-slate-100 px-6">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`relative py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab ? "text-blue-700" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-t" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* DETAILS TAB */}
          {activeTab === "Details" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Grievance Description</h3>
                  <p className="text-slate-800 leading-relaxed">{complaint.description}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Attachments</h3>
                  {complaint.evidence_urls && complaint.evidence_urls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {complaint.evidence_urls.map((url, i) => (
                        <div key={i} className="rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                          <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center text-slate-400">
                      <Upload className="h-8 w-8 mb-2 text-slate-300" />
                      <p className="text-sm">No attachments submitted by citizen</p>
                    </div>
                  )}
                </div>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Add Officer Note</h3>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                    placeholder="Add an internal note about this case…"
                    className="w-full text-sm border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none" />
                  <div className="flex justify-end mt-3">
                    <button onClick={saveNote} disabled={!note.trim() || savingNote}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      {savingNote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Save Note
                    </button>
                  </div>
                  {complaint.officer_notes && complaint.officer_notes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {complaint.officer_notes.map((n, i) => (
                        <div key={i} className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                          <p className="text-sm text-slate-800">{n.note}</p>
                          <p className="text-xs text-slate-400 mt-1">{n.by} · {new Date(n.at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-5">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Case Information</h3>
                  <div className="space-y-3.5">
                    {[
                      { icon: Hash,       label: "Grievance ID", value: gid,                      highlight: true },
                      { icon: Tag,        label: "Category",     value: category },
                      { icon: Building2,  label: "Department",   value: department },
                      { icon: MapPin,     label: "Location",     value: complaint.location || "—" },
                      { icon: Calendar,   label: "Submitted",    value: complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : "—" },
                    ].map(({ icon: Icon, label, value, highlight }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 bg-slate-50 rounded-md border border-slate-100 flex-shrink-0">
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                          <div className={`text-sm font-semibold truncate ${highlight ? "text-blue-700" : "text-slate-800"}`}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">AI Triage Summary</h3>
                  {complaint.ai_triage_data ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Priority</span><span className="font-bold text-red-600">{priority}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">SLA</span><span className="font-semibold text-slate-800">{complaint.ai_triage_data.estimated_sla_hours || 48}h</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Affected</span><span className="font-semibold text-slate-800 text-right max-w-[60%] truncate">{complaint.ai_triage_data.affected_population || "—"}</span></div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">AI Triage pending...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === "Timeline" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-3xl">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-6">Case Timeline</h3>
              <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                {buildTimeline().map((item, i) => {
                  const cfg = timelineIconMap[item.type] || timelineIconMap.pending;
                  return (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[29px] top-1 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center ${cfg.bg} ${item.done ? "" : "opacity-50"}`}>
                        <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
                      </div>
                      <p className={`text-sm ${item.done ? "font-semibold text-slate-800" : "text-slate-500"}`}>{item.event}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTION PLAN TAB */}
          {activeTab === "Action Plan" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">AI-Generated Action Plan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Generated by Resolution Planner Agent · GPT-OSS 120B</p>
                </div>
                <div className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">AI Generated</div>
              </div>
              <div className="p-6">
                {!complaint.ai_workflow ? (
                  <div className="text-center py-8 text-slate-500">
                    <Activity className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                    <p>No AI Action Plan generated yet.</p>
                    <p className="text-xs text-slate-400 mt-1">The Resolution Planner Agent will generate this after triage completes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiTasks.map((step, i) => {
                      const status = getTaskStatus(i);
                      const cfg    = stepStatusStyle[status] || stepStatusStyle.pending;
                      const isMarking = markingDone === i;
                      const canMark   = status === "active" && complaint.status !== "Resolved";
                      return (
                        <div key={i} className={`flex gap-4 p-4 rounded-xl border transition-all ${cfg.bg} ${cfg.border}`}>
                          <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            status === "done" ? "bg-emerald-500 text-white" :
                            status === "active" ? "bg-blue-500 text-white animate-pulse" :
                            "bg-slate-200 text-slate-500"
                          }`}>
                            {status === "done" ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className={`font-bold text-sm ${status === "done" ? "line-through opacity-60" : "text-slate-800"}`}>{step.title}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{status}</span>
                              </div>
                              {canMark && (
                                <button onClick={() => markTaskDone(i)} disabled={isMarking}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60 transition-all">
                                  {isMarking ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />}
                                  Mark Done
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                              <span className="flex items-center gap-1"><User size={12} /> {step.department || "Field Team"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "History" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Case History & Audit Log</h3>
              <div className="space-y-3">
                {[
                  ...(complaint.status === "Resolved" ? [{ action: "Grievance marked as Resolved", by: "Officer", time: complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleString() : "—" }] : []),
                  ...(complaint.ai_workflow ? [{ action: `Action plan generated (${aiTasks.length} steps)`, by: "Resolution Planner Agent", time: complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "—" }] : []),
                  ...(complaint.ai_triage_data ? [{ action: "Complaint triaged and structured", by: "Triage Agent", time: complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "—" }] : []),
                  { action: "Complaint submitted by citizen", by: "Citizen", time: complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "—" },
                ].map((entry, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.06 }}
                    className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{entry.action}</div>
                      <div className="text-xs text-slate-400 mt-0.5">by {entry.by}</div>
                    </div>
                    <div className="text-xs text-slate-400 flex-shrink-0">{entry.time}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </OfficerLayout>
  );
}
