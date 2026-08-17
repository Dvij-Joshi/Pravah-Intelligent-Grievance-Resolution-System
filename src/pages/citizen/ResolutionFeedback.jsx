import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  Star, MessageSquare, Send, ArrowLeft, RefreshCw,
  Zap, Eye, TrendingUp, AlertOctagon, Home, ChevronRight,
  Clock, User, Shield, RotateCcw,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const VERDICTS = [
  {
    id: "resolved",
    label: "Yes, Resolved",
    sub: "The issue has been fully fixed.",
    icon: CheckCircle2,
    color: "green",
    bg:     "bg-green-50",
    border: "border-green-300",
    activeBg: "bg-green-600",
    text:   "text-green-700",
    check:  "bg-green-500",
  },
  {
    id: "partial",
    label: "Partially Resolved",
    sub: "Some improvement, but the issue persists.",
    icon: AlertTriangle,
    color: "amber",
    bg:     "bg-amber-50",
    border: "border-amber-300",
    activeBg: "bg-amber-500",
    text:   "text-amber-700",
    check:  "bg-amber-500",
  },
  {
    id: "not_resolved",
    label: "Not Resolved",
    sub: "The problem still exists as before.",
    icon: XCircle,
    color: "red",
    bg:     "bg-red-50",
    border: "border-red-300",
    activeBg: "bg-red-600",
    text:   "text-red-700",
    check:  "bg-red-500",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 transition-colors duration-150 ${
              n <= (hovered || value) ? "text-amber-400 fill-amber-400" : "text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Success state — case closed ───────────────────────────────────────────────
function CaseClosed({ gid, onHome }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-12 px-6"
    >
      {/* Animated checkmark */}
      <div className="relative mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircle2 className="w-14 h-14 text-green-600" strokeWidth={1.5} />
        </motion.div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ delay: 0.3, duration: 1.2, repeat: 2 }}
          className="absolute inset-0 rounded-full bg-green-300"
        />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-extrabold text-slate-900 mb-2"
      >
        Case Closed 🎉
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-slate-500 text-sm max-w-xs mb-8"
      >
        Thank you for confirming. Grievance <span className="font-bold text-blue-700">{gid}</span> has been officially closed. The complete audit trail has been saved.
      </motion.p>

      {/* Lifecycle recap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-left"
      >
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Completed Lifecycle</p>
        {[
          "Grievance submitted",
          "AI triage & classification",
          "Action plan generated",
          "Field inspection completed",
          "Evidence verified by AI (91%)",
          "Citizen confirmed resolution",
        ].map((step, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 + i * 0.07 }}
            className="flex items-center gap-2.5 py-1.5"
          >
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-slate-700">{step}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Recurrence note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-8 text-left w-full max-w-sm"
      >
        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          <span className="font-bold">Recurrence Agent activated.</span> This case will be analyzed for systemic patterns with similar complaints in your area.
        </p>
      </motion.div>

      <button
        onClick={onHome}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-md"
      >
        <Home className="h-4 w-4" /> Back to Home
      </button>
    </motion.div>
  );
}

// ── Reopened state — case back in queue ───────────────────────────────────────
function CaseReopened({ gid, verdict, onHome }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-10 px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 180 }}
        className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-5"
      >
        <RotateCcw className="w-12 h-12 text-amber-600" strokeWidth={1.5} />
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-xl font-extrabold text-slate-900 mb-2">
        Case Reopened
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="text-slate-500 text-sm max-w-sm mb-6">
        We have not created a new complaint. Grievance <span className="font-bold text-blue-700">{gid}</span> has been reopened and escalated. The system is taking automatic action.
      </motion.p>

      {/* Auto-actions cascade */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm space-y-2 mb-6"
      >
        {[
          { icon: RotateCcw,     label: "Existing case reopened",               color: "bg-amber-500" },
          { icon: User,          label: "Officer Rahul Sharma notified",          color: "bg-blue-500"  },
          { icon: AlertOctagon,  label: "Supervisor escalation triggered",        color: "bg-red-500"   },
          { icon: Zap,           label: "New action plan being generated by AI",  color: "bg-purple-500"},
          { icon: Shield,        label: "Audit trail updated — no closure bypass", color: "bg-green-500"},
        ].map((item, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + i * 0.12 }}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm"
          >
            <div className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center flex-shrink-0`}>
              <item.icon className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm text-slate-700">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="bg-slate-900 text-slate-200 rounded-xl px-4 py-3 text-xs text-left w-full max-w-sm mb-6 font-mono">
        <p className="text-slate-400 mb-1">// System log</p>
        <p><span className="text-green-400">REOPEN</span> {gid} — status: IN_PROGRESS</p>
        <p><span className="text-amber-400">NOTIFY</span> officer_id: ward_officer_005</p>
        <p><span className="text-red-400">ESCALATE</span> supervisor: district_supervisor_01</p>
        <p><span className="text-purple-400">AGENT</span> resolution_planner — regenerating...</p>
      </motion.div>

      <button onClick={onHome}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-md">
        <Home className="h-4 w-4" /> Back to Home
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ResolutionFeedback({ data, grievanceId, onBack, onHome }) {
  const gid = grievanceId || "GRV-1024";

  const [verdict, setVerdict]       = useState(null);
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcome, setOutcome]       = useState(null); // "closed" | "reopened"

  const needsComment = verdict === "partial" || verdict === "not_resolved";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!verdict) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1600));
    setIsSubmitting(false);
    setOutcome(verdict === "resolved" ? "closed" : "reopened");
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!submitted && (
              <button type="button" onClick={onBack}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-700" />
              <span className="font-bold text-slate-900 text-lg">Pravah</span>
            </div>
          </div>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Citizen Portal
          </span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">

        <AnimatePresence mode="wait">

          {/* ── Post-submit outcomes ── */}
          {submitted && outcome === "closed" && (
            <CaseClosed key="closed" gid={gid} onHome={onHome} />
          )}
          {submitted && outcome === "reopened" && (
            <CaseReopened key="reopened" gid={gid} verdict={verdict} onHome={onHome} />
          )}

          {/* ── Feedback form ── */}
          {!submitted && (
            <motion.div key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Is your issue resolved?</h1>
                <p className="text-slate-500 text-sm">
                  Your feedback helps us improve and prevents this case from being closed prematurely.
                </p>
                <p className="text-xs text-blue-600 font-semibold mt-1.5">
                  Grievance <span className="font-mono">{gid}</span> has been marked as resolved by the officer.
                </p>
              </div>

              {/* AI Evidence summary card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-700">AI Resolution Agent Review</h2>
                  <span className="ml-auto text-xs bg-green-100 border border-green-200 text-green-700 px-2 py-0.5 rounded-full font-bold">91% Confidence</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Before</p>
                    <p className="text-xs text-slate-700 font-medium">Water supply disrupted — multiple houses affected</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">After</p>
                    <p className="text-xs text-green-700 font-medium">Pipeline repaired — supply restored to all households</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[
                    "Complaint matches action taken",
                    "Before/after evidence supports resolution",
                    "Location verified by officer",
                    "Timestamp within valid window",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 italic">
                    AI Recommendation: <span className="font-semibold text-slate-700">Approve for citizen verification</span>
                  </p>
                </div>
              </motion.div>

              <form onSubmit={handleSubmit}>
                {/* Verdict selection */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4"
                >
                  <h2 className="text-sm font-bold text-slate-700 mb-4">Your Verdict</h2>
                  <div className="space-y-3">
                    {VERDICTS.map((v) => {
                      const isSelected = verdict === v.id;
                      return (
                        <motion.button
                          key={v.id}
                          type="button"
                          onClick={() => setVerdict(v.id)}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            isSelected
                              ? `${v.bg} ${v.border} shadow-sm`
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {/* Radio circle */}
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            isSelected ? `${v.check} border-transparent` : "border-slate-300"
                          }`}>
                            {isSelected && <span className="w-2 h-2 bg-white rounded-full" />}
                          </div>

                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? v.activeBg : "bg-slate-100"
                          }`}>
                            <v.icon className={`h-5 w-5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold transition-colors ${isSelected ? v.text : "text-slate-800"}`}>
                              {v.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{v.sub}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Warning for non-resolved */}
                  <AnimatePresence>
                    {(verdict === "partial" || verdict === "not_resolved") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 overflow-hidden"
                      >
                        <RefreshCw className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          <span className="font-bold">This case will be automatically reopened.</span> A new action will be generated and the supervisor will be notified. No new complaint needed.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Additional comments */}
                <AnimatePresence>
                  {verdict && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-4 overflow-hidden"
                    >
                      <label htmlFor="fb-comment" className="block text-sm font-bold text-slate-700 mb-1">
                        Additional Comments
                        {needsComment && <span className="text-red-500 ml-1">*</span>}
                        {!needsComment && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
                      </label>
                      <p className="text-xs text-slate-400 mb-3">
                        {needsComment
                          ? "Please describe what is still wrong — this helps the officer prioritize correctly."
                          : "Any additional feedback about the resolution process?"}
                      </p>
                      <textarea
                        id="fb-comment"
                        value={comment}
                        onChange={e => setComment(e.target.value.slice(0, 500))}
                        rows={3}
                        placeholder={needsComment
                          ? "e.g. Water supply restored partially — pressure is still very low in upper floors..."
                          : "e.g. Officer was very responsive and professional..."}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                      />
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-slate-400 font-mono">{comment.length}/500</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Service rating */}
                <AnimatePresence>
                  {verdict && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 overflow-hidden"
                    >
                      <h2 className="text-sm font-bold text-slate-700 mb-1">Rate the Service</h2>
                      <p className="text-xs text-slate-400 mb-3">How satisfied are you with how this was handled?</p>
                      <StarRating value={rating} onChange={setRating} />
                      {rating > 0 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="mt-2 text-xs text-slate-500">
                          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]} · {rating}/5 stars
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <AnimatePresence>
                  {verdict && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-3"
                    >
                      <button
                        type="submit"
                        disabled={isSubmitting || (needsComment && !comment.trim())}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                      >
                        <AnimatePresence mode="wait">
                          {isSubmitting ? (
                            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              Submitting feedback...
                            </motion.span>
                          ) : (
                            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="flex items-center gap-2">
                              <Send className="h-4 w-4" />
                              Submit Feedback
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>

                      {needsComment && !comment.trim() && (
                        <p className="text-center text-xs text-red-500">Please describe what is still wrong before submitting.</p>
                      )}

                      <p className="text-center text-xs text-slate-400">
                        Your feedback is final and will be used to update this case in the audit trail.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
