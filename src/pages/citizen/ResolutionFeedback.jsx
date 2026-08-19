import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  Star, MessageSquare, Send, ArrowLeft, RefreshCw,
  Zap, Eye, TrendingUp, AlertOctagon, Home, ChevronRight,
  Clock, User, Shield, RotateCcw, ImageIcon, Loader2
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- Constants ----------------------------------------------------------------
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

// --- Sub-components -----------------------------------------------------------
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

// -- Success state — case closed -----------------------------------------------
function CaseClosed({ gid, onHome }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-12 px-6"
    >
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

      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="text-2xl font-extrabold text-slate-900 mb-2">
        Case Closed ??
      </motion.h2>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="text-slate-500 text-sm max-w-xs mb-8">
        Thank you for confirming. Grievance <span className="font-bold text-blue-700">{gid}</span> has been officially closed. The complete audit trail has been saved.
      </motion.p>

      <button onClick={onHome} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-md">
        <Home className="h-4 w-4" /> Back to Dashboard
      </button>
    </motion.div>
  );
}

// -- Reopened state — case back in queue ---------------------------------------
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

      <button onClick={onHome} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-md">
        <Home className="h-4 w-4" /> Back to Dashboard
      </button>
    </motion.div>
  );
}

// --- Main Component -----------------------------------------------------------
export default function ResolutionFeedback() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);

  const gid = grievance?.readable_id || id?.slice(0, 8).toUpperCase() || 'GRV-XXXX';

  const [verdict, setVerdict]       = useState(null);
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcome, setOutcome]       = useState(null);

  const needsComment = verdict === 'partial' || verdict === 'not_resolved';

  useEffect(() => {
    async function fetchGrievance() {
      const { data } = await supabase.from('grievances').select('*').eq('id', id).single();
      setGrievance(data);
      setLoading(false);
    }
    fetchGrievance();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!verdict) return;
    if (needsComment && !comment.trim()) {
      alert("Please provide a comment explaining why it is not fully resolved.");
      return;
    }
    setIsSubmitting(true);

    const isResolved = verdict === 'resolved';
    const newStatus = isResolved ? 'Closed' : 'In Progress';
    
    let updates = {
      feedback_rating: rating || null,
      feedback_text: comment.trim() || null,
      status: newStatus,
    };

    // If reopening, modify task progress & officer notes
    if (!isResolved && grievance) {
      let existingProgress = Array.isArray(grievance.task_progress) && grievance.task_progress.length > 0
        ? [...grievance.task_progress]
        : (grievance.ai_workflow?.tasks || []).map((t, i) => ({ id: t.id ?? i, status: 'done' }));

      if (existingProgress.length > 0) {
        let reversed = [...existingProgress].reverse();
        let lastCompletedIdx = reversed.findIndex(p => p.status === 'done');
        if (lastCompletedIdx !== -1) {
          let originalIdx = existingProgress.length - 1 - lastCompletedIdx;
          existingProgress[originalIdx].status = 'active';
        } else {
          existingProgress[existingProgress.length - 1].status = 'active';
        }
      }
      
      updates.task_progress = existingProgress;

      const existingNotes = Array.isArray(grievance.officer_notes) ? [...grievance.officer_notes] : [];
      existingNotes.push({
        id: Date.now().toString(),
        author: "Citizen Feedback",
        text: `CITIZEN REOPENED ISSUE: ${comment.trim()}`,
        time: new Date().toISOString()
      });
      updates.officer_notes = existingNotes;
    }

    await supabase.from('grievances').update(updates).eq('id', id);

    setIsSubmitting(false);
    setOutcome(isResolved ? 'closed' : 'reopened');
    setSubmitted(true);
  }

  const onHome = () => navigate('/dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    );
  }

  const beforeImage = grievance?.ai_evidence_report?.beforeImageUrl || grievance?.evidence_urls?.[0];
  const afterImage  = grievance?.ai_evidence_report?.afterImageUrl  || grievance?.resolution_evidence_urls?.[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!submitted && (
              <button type="button" onClick={() => navigate(-1)}
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
          {!submitted ? (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6">
              
              <div className="text-center mb-8">
                <p className="text-sm font-bold tracking-widest text-blue-600 mb-2 uppercase">{gid}</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Verify Resolution</h1>
                <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
                  The assigned officer has marked this grievance as resolved. Please confirm if the issue is actually fixed.
                </p>
              </div>

              {/* Before & After Image Comparison */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-slate-400" /> Evidence Comparison
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Before</p>
                    <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                      {beforeImage ? (
                        <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-green-600 uppercase">After (Resolved)</p>
                    <div className="aspect-square rounded-xl bg-green-50 overflow-hidden border border-green-200">
                      {afterImage ? (
                        <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-green-600 text-xs text-center px-4">
                          Resolution marked without image
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-sm relative overflow-hidden">
                <div className="mb-8">
                  <label className="block text-sm font-bold text-slate-800 mb-4 text-center">
                    {grievance?.status === 'Closed' ? "Are you experiencing issues again? Refile this case:" : "Is the issue fully resolved?"}
                  </label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {VERDICTS.map((v) => (
                      <button type="button" key={v.id} onClick={() => setVerdict(v.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 overflow-hidden ${
                          verdict === v.id ? `${v.border} ${v.bg} shadow-sm ring-1 ring-[${v.border}]` : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                        <v.icon className={`h-8 w-8 ${verdict === v.id ? v.text : 'text-slate-400'}`} />
                        <div>
                          <p className={`text-sm font-bold ${verdict === v.id ? v.text : 'text-slate-700'}`}>{v.label}</p>
                          <p className={`text-[10px] mt-1 ${verdict === v.id ? v.text + ' opacity-80' : 'text-slate-400'}`}>{v.sub}</p>
                        </div>
                        {verdict === v.id && (
                          <div className={`absolute top-2 right-2 w-4 h-4 rounded-full ${v.check} text-white flex items-center justify-center`}>
                            <CheckCircle2 size={12} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {verdict && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                      <hr className="border-slate-100" />
                      {needsComment && (
                        <div>
                          <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
                            Please explain why <span className="text-[10px] font-normal text-red-500 bg-red-50 px-2 py-0.5 rounded">*Required</span>
                          </label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What part of the work is incomplete or unsatisfactory?"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px] resize-y"
                            required
                          />
                        </div>
                      )}

                      {verdict === 'resolved' && (
                        <div className="flex flex-col items-center">
                          <label className="block text-sm font-bold text-slate-800 mb-3 text-center">Rate the resolution speed & quality</label>
                          <StarRating value={rating} onChange={setRating} />
                        </div>
                      )}

                      <button type="submit" disabled={isSubmitting || (needsComment && !comment.trim())}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all shadow-md active:scale-[0.98]">
                        {isSubmitting ? (
                          <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                        ) : (
                          <><Send className="h-4 w-4" /> Submit Decision</>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-[500px] flex items-center justify-center">
              {outcome === 'closed' ? (
                <CaseClosed gid={gid} onHome={onHome} />
              ) : (
                <CaseReopened gid={gid} verdict={verdict} onHome={onHome} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
