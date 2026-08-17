import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ShieldCheck,
  MapPin,
  Clock,
  Hash,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  BarChart3,
  ImageIcon,
  FileText,
} from "lucide-react";
import OfficerLayout from "../../layouts/OfficerLayout";

// ── Dummy AI Evidence Reports ──────────────────────────────────────────────
const reports = [
  {
    grievanceId: "GRV-1024",
    grievanceTitle: "No water supply since 4 days",
    category: "Water Supply",
    location: "Ward 5",
    officerNote: "The field team identified a burst pipe in the main distribution line near the water tower. The pipe was repaired and water supply has been restored to all affected households.",
    workOrderId: "WO-2025-05-1024",
    submittedAt: "10 May 2025, 06:45 PM",
    analysedAt: "10 May 2025, 06:47 PM",
    agentModel: "Qwen 3.6 27B",
    beforeImage: "https://via.placeholder.com/800x500?text=evidence-before.png+(Burst+Pipe)",
    afterImage: "https://via.placeholder.com/800x500?text=evidence-after.png+(Repaired+Pipe)",
    confidence: 91,
    evidenceQuality: "GOOD",
    changeDetected: true,
    visualConsistency: true,
    locationVerified: true,
    timestampValid: true,
    beforeObservation: "Visible water leakage from a cracked pipe section near the Ward 5 distribution node. Surrounding ground shows waterlogging and erosion marks consistent with prolonged leakage.",
    afterObservation: "Pipe section appears to have been replaced. No visible leakage. The ground surrounding the repair site shows fresh concrete patching, consistent with standard repair procedure.",
    concerns: [],
    aiSummary: "The before and after images show a clear and verifiable change at the reported site. The repair is visually consistent with the officer's resolution note describing a burst pipe replacement. Location and timestamp metadata are valid.",
    recommendation: "APPROVE",
    recommendationNote: "Evidence quality is good. Visual change is clearly detectable and matches the reported resolution. Recommend sending to citizen for verification.",
  },
  {
    grievanceId: "GRV-1038",
    grievanceTitle: "Pothole outside government school",
    category: "Road Damage",
    location: "Ward 5",
    officerNote: "Pothole was filled with fresh bituminous mix by the road maintenance team. Road surface levelled and compacted.",
    workOrderId: "WO-2025-05-1038",
    submittedAt: "08 May 2025, 04:30 PM",
    analysedAt: "08 May 2025, 04:32 PM",
    agentModel: "Qwen 3.6 27B",
    beforeImage: "https://via.placeholder.com/800x500?text=evidence-before.png+(Pothole)",
    afterImage: "https://via.placeholder.com/800x500?text=evidence-after.png+(Repaired+Road)",
    confidence: 88,
    evidenceQuality: "GOOD",
    changeDetected: true,
    visualConsistency: true,
    locationVerified: true,
    timestampValid: true,
    beforeObservation: "Large pothole clearly visible on asphalt road surface. Depth and width are consistent with a safety hazard. Surrounding road surface shows cracking.",
    afterObservation: "Pothole is no longer visibly present. Road surface appears to have been patched with fresh asphalt. Patch boundaries are visible, consistent with a standard repair.",
    concerns: ["Patch edges not perfectly blended — minor cosmetic issue only"],
    aiSummary: "Clear visual change detected between before and after images. The repair is consistent with the officer report. One minor concern noted regarding patch edge quality, but this does not affect the structural resolution.",
    recommendation: "APPROVE",
    recommendationNote: "Evidence is sufficient to confirm resolution. Minor concern noted but does not affect validity. Recommend citizen verification.",
  },
];

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

function CheckRow({ label, value, positive = true }) {
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
  const [selectedId, setSelectedId] = useState("GRV-1024");
  const [compareMode, setCompareMode] = useState(false);

  const report = reports.find((r) => r.grievanceId === selectedId) || reports[0];
  const cfg = confidenceColor(report.confidence);
  const recCfg = recommendationConfig[report.recommendation];

  return (
    <OfficerLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Evidence Report</h2>
          <p className="text-sm text-slate-500 mt-1">
            Generated by Evidence Agent · {report.agentModel}
          </p>
        </div>
        {/* Report Selector */}
        <div className="flex gap-2">
          {reports.map((r) => (
            <button
              key={r.grievanceId}
              onClick={() => setSelectedId(r.grievanceId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                selectedId === r.grievanceId
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {r.grievanceId}
            </button>
          ))}
        </div>
      </div>

      {/* Top: Grievance context bar */}
      <motion.div
        key={selectedId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4 mb-5 flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">{report.grievanceId}</span>
          <span className="text-sm font-semibold text-slate-800 truncate">{report.grievanceTitle}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 ml-auto flex-wrap">
          <span className="flex items-center gap-1"><Hash size={11} /> {report.workOrderId || "—"}</span>
          <span className="flex items-center gap-1"><MapPin size={11} /> {report.location}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> Analysed {report.analysedAt}</span>
        </div>
        <button
          onClick={() => navigate(`/officer/complaints/${report.grievanceId}`)}
          className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline flex-shrink-0"
        >
          View Case <ChevronRight size={11} />
        </button>
      </motion.div>

      <motion.div
        key={selectedId + "-body"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Images + Analysis */}
          <div className="lg:col-span-2 space-y-5">

            {/* Image Comparison */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon size={16} className="text-slate-400" /> Image Comparison
                </h3>
                <button
                  onClick={() => setCompareMode((p) => !p)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    compareMode ? "bg-blue-700 text-white border-blue-700" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {compareMode ? "Side by Side" : "Side by Side"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Before", src: report.beforeImage, obs: report.beforeObservation, tag: "bg-slate-700" },
                  { label: "After", src: report.afterImage, obs: report.afterObservation, tag: "bg-emerald-600" },
                ].map(({ label, src, obs, tag }) => (
                  <div key={label}>
                    <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-slate-100">
                      <img src={src} alt={label} className="w-full h-full object-cover" />
                      <div className={`absolute top-2 left-2 text-xs font-bold text-white px-2 py-1 rounded-md ${tag}`}>
                        {label}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">AI Observation</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{obs}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-violet-500" />
                AI Analysis Summary
                <span className="text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full font-semibold ml-1">
                  {report.agentModel}
                </span>
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-100">
                {report.aiSummary}
              </p>

              {/* Concerns */}
              {report.concerns.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Concerns Flagged
                  </h4>
                  <div className="space-y-2">
                    {report.concerns.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-amber-700">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Officer's Note */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                <FileText size={16} className="text-slate-400" /> Officer's Resolution Note
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{report.officerNote}</p>
            </div>
          </div>

          {/* Right: Scores + Recommendation */}
          <div className="space-y-5">
            {/* Confidence Gauge */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-slate-900 text-center mb-1">Resolution Confidence</h3>
              <p className="text-xs text-slate-400 text-center mb-4">AI confidence that the issue is resolved</p>
              <ConfidenceGauge score={report.confidence} />
            </div>

            {/* Verification Checks */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
                <BarChart3 size={15} className="text-slate-400" /> Verification Checks
              </h3>
              <p className="text-xs text-slate-400 mb-4">Automated checks run by the Evidence Agent</p>
              <div>
                <CheckRow label="Change detected" value={report.changeDetected} />
                <CheckRow label="Visual consistency" value={report.visualConsistency} />
                <CheckRow label="Location verified" value={report.locationVerified} />
                <CheckRow label="Timestamp valid" value={report.timestampValid} />
                <CheckRow label="Evidence quality" value={report.evidenceQuality === "GOOD"} />
              </div>
            </div>

            {/* Recommendation Box */}
            <div className={`rounded-xl border-2 p-5 ${recCfg.bg} ${recCfg.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <recCfg.icon className={`h-5 w-5 ${recCfg.color}`} />
                <h3 className={`font-bold text-sm ${recCfg.color}`}>AI Recommendation</h3>
              </div>
              <p className={`text-base font-bold mb-2 ${recCfg.color}`}>{recCfg.label}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{report.recommendationNote}</p>
            </div>

            {/* Officer Decision */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-slate-900 mb-1">Officer Decision</h3>
              <p className="text-xs text-slate-400 mb-4">
                The AI recommends, but the final decision is yours.
              </p>
              <div className="space-y-2.5">
                <button
                  onClick={() => navigate(`/officer/complaints/${report.grievanceId}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <ThumbsUp size={15} /> Approve & Send to Citizen
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 transition-colors">
                  <ThumbsDown size={15} /> Reject Evidence
                </button>
                <button
                  onClick={() => navigate("/officer/evidence")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors"
                >
                  <RotateCcw size={15} /> Request Re-upload
                </button>
              </div>
            </div>

            {/* Agent Metadata */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Report Metadata</p>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Evidence Agent", value: report.agentModel },
                  { label: "Evidence submitted", value: report.submittedAt },
                  { label: "Report generated", value: report.analysedAt },
                  { label: "Evidence quality", value: report.evidenceQuality },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-700 font-semibold text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </OfficerLayout>
  );
}
