import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  MapPin,
  Hash,
  ChevronRight,
  Sparkles,
  BarChart3,
  ImageIcon,
  FileText,
  FilePlus2,
  Lock,
  Send,
} from "lucide-react";
import OfficerLayout from "../../layouts/OfficerLayout";
import { useGrievances } from "../../hooks/useGrievances";
import { supabase } from "../../lib/supabase";

const confidenceColor = (score) => {
  if (score >= 85) return { ring: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-500", label: "High Confidence", labelColor: "text-emerald-700", labelBg: "bg-emerald-100 border-emerald-200" };
  if (score >= 65) return { ring: "text-amber-500", bg: "bg-amber-50", bar: "bg-amber-400", label: "Moderate Confidence", labelColor: "text-amber-700", labelBg: "bg-amber-100 border-amber-200" };
  return { ring: "text-red-500", bg: "bg-red-50", bar: "bg-red-500", label: "Low Confidence", labelColor: "text-red-700", labelBg: "bg-red-100 border-red-200" };
};

const recommendationConfig = {
  APPROVE: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Approve for Citizen Verification" },
  REJECT: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Reject — Re-upload Required" },
  REVIEW: { icon: Eye, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Manual Review Needed" },
};

function ConfidenceGauge({ score }) {
  const cfg = confidenceColor(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-2xl ${cfg.bg}`}>
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            className={cfg.ring}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-3xl font-bold ${cfg.ring}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}%
          </motion.span>
        </div>
      </div>
      <span className={`mt-3 text-xs font-bold px-3 py-1 rounded-full border ${cfg.labelBg} ${cfg.labelColor}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function CheckRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      {value ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <CheckCircle2 size={12} /> Verified
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
          <XCircle size={12} /> Failed
        </span>
      )}
    </div>
  );
}

export default function AIEvidenceReport() {
  const navigate = useNavigate();
  const { grievances, refetch } = useGrievances();
  const [selectedId, setSelectedId] = useState(null);
  const [closing, setClosing] = useState(false);
  const [closedId, setClosedId] = useState(null);
  
  const reportedGrievances = grievances.filter(g => g.ai_evidence_report || g.status === 'In Progress');

  React.useEffect(() => {
    if (reportedGrievances.length > 0 && !selectedId) {
      setSelectedId(reportedGrievances[0].id);
    }
  }, [reportedGrievances, selectedId]);

  if (!reportedGrievances || reportedGrievances.length === 0) {
    return (
      <OfficerLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
          <FilePlus2 className="h-16 w-16 mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No AI Reports Available</h2>
          <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
            There are no grievances with AI evidence reports yet. Submit evidence to generate reports.
          </p>
          <button
            onClick={() => navigate('/officer/evidence')}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
          >
            Upload Evidence
          </button>
        </div>
      </OfficerLayout>
    );
  }

  const reportData = reportedGrievances.find((g) => g.id === selectedId);
  if (!reportData) return null;

  const isPending = !reportData.ai_evidence_report && reportData.status === 'In Progress';
  const report = reportData.ai_evidence_report;
  
  const recCfg = report ? recommendationConfig[report.recommendation || 'REVIEW'] : null;
  const canFinalClose = report && report.confidence >= 80 && reportData.status !== 'Resolved';

  const handleFinalClose = async () => {
    if (!reportData?.dbId) return;
    setClosing(true);
    try {
      const resolvedNote = `Grievance verified and closed by officer. AI Evidence Agent confirmed resolution with ${report.confidence}% confidence. Resolution: ${report.observations}`;
      const { error } = await supabase
        .from('grievances')
        .update({
          status: 'resolved'
        })
        .eq('id', reportData.dbId);
      if (error) throw error;
      setClosedId(reportData.id);
      if (refetch) refetch();
    } catch (err) {
      alert('Failed to close case: ' + err.message);
    } finally {
      setClosing(false);
    }
  };

  return (
    <OfficerLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Evidence Report</h2>
          <p className="text-sm text-slate-500 mt-1">Generated by Evidence Agent</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reportedGrievances.map((g) => {
            const pendingStatus = !g.ai_evidence_report && g.status === 'In Progress';
            return (
              <button
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  selectedId === g.id
                    ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                {pendingStatus && (
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
                {g.id}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        key={selectedId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4 mb-5 flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded">{reportData.id}</span>
          <span className="text-sm font-semibold text-slate-800 truncate">{reportData.title}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 ml-auto flex-wrap">
          <span className="flex items-center gap-1"><Hash size={12} /> {reportData.category}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {reportData.location}</span>
        </div>
        <button
          onClick={() => navigate(`/officer/complaints/${reportData.id}`)}
          className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline flex-shrink-0"
        >
          View Case <ChevronRight size={11} />
        </button>
      </motion.div>

      {isPending ? (
        <motion.div
          key={selectedId + "-pending"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm"
        >
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-slate-800">AI is analyzing evidence...</h3>
          <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
            The Evidence Agent is currently reviewing the before and after photos to verify the resolution. This usually takes a few moments.
          </p>
          <p className="text-xs text-slate-400 mt-6 font-mono">
            {reportData.id} is queued for processing.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key={selectedId + "-body"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <ImageIcon size={16} className="text-slate-400" /> Evidence Comparison
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-slate-100">
                      {reportData.evidence_urls?.[0] ? (
                        <img src={reportData.evidence_urls[0]} alt="Before" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Before Image</div>
                      )}
                      <div className="absolute top-2 left-2 text-xs font-bold text-white px-2.5 py-1 rounded-md bg-slate-800/80 backdrop-blur-sm shadow-sm">
                        Citizen's Before Photo
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-slate-100 border-2 border-emerald-400/50">
                      {report.afterImageUrl ? (
                        <img src={report.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No After Image</div>
                      )}
                      <div className="absolute top-2 left-2 text-xs font-bold text-white px-2.5 py-1 rounded-md bg-emerald-700/80 backdrop-blur-sm shadow-sm">
                        Officer's Resolution Photo
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-violet-500" />
                  AI Analysis Observations
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-100">
                  {report.observations || "No observations provided."}
                </p>

                {report.concerns?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Concerns Flagged
                    </h4>
                    <div className="space-y-2">
                      {report.concerns.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-amber-800 font-medium">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

              <div className="space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-slate-900 text-center mb-1">Resolution Confidence</h3>
                <p className="text-xs text-slate-400 text-center mb-4">AI confidence that the issue is resolved</p>
                <ConfidenceGauge score={report.confidence || 0} />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <BarChart3 size={15} className="text-slate-400" /> Verification Checks
                </h3>
                <p className="text-xs text-slate-400 mb-4">Automated checks run by the Evidence Agent</p>
                <div>
                  <CheckRow label="Change detected" value={report.change_detected} />
                </div>
              </div>

              <div className={`rounded-xl border-2 p-5 ${recCfg.bg} ${recCfg.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <recCfg.icon className={`h-5 w-5 ${recCfg.color}`} />
                  <h3 className={`font-bold text-sm ${recCfg.color}`}>AI Recommendation</h3>
                </div>
                <p className={`text-base font-bold mb-2 ${recCfg.color}`}>{recCfg.label}</p>
              </div>

              {/* Final Close CTA */}
              {canFinalClose ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-5 text-white shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={18} />
                    <h3 className="font-bold text-sm">Ready to Close</h3>
                  </div>
                  <p className="text-xs text-emerald-100 mb-4">
                    AI confidence is <strong>{report.confidence}%</strong> — meets the ≥80% threshold.
                    Closing the case will notify the citizen and mark it resolved.
                  </p>
                  <button
                    onClick={handleFinalClose}
                    disabled={closing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-emerald-700 font-bold rounded-xl text-sm shadow hover:bg-emerald-50 transition-colors disabled:opacity-60"
                  >
                    {closing ? (
                      <><div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" /> Closing Case…</>
                    ) : (
                      <><Send size={14} /> Final Submit &amp; Close Case</>
                    )}
                  </button>
                </motion.div>
              ) : report && report.confidence < 80 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={14} className="text-slate-400" />
                    <h3 className="font-bold text-xs text-slate-500">Final Submit Locked</h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Confidence must be ≥80% to close the case. Current: <strong>{report.confidence}%</strong>.
                    Resubmit with clearer evidence to proceed.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}

      {/* Case Closed Success Modal */}
      <AnimatePresence>
        {closedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Case Closed! 🎉</h2>
              <p className="text-slate-500 text-sm mb-1">
                Grievance <span className="font-bold text-blue-700">{closedId}</span> has been marked as <span className="font-bold text-emerald-600">Resolved</span>.
              </p>
              <p className="text-slate-400 text-xs mb-6">
                The citizen will see the case as resolved and can submit feedback on whether the issue was fixed.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setClosedId(null); navigate('/officer/complaints'); }}
                  className="w-full px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors"
                >
                  Go to All Complaints
                </button>
                <button
                  onClick={() => setClosedId(null)}
                  className="w-full px-5 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
                >
                  Stay on Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </OfficerLayout>
  );
}
