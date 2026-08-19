import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ImagePlus,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Clock,
  Hash,
  ChevronDown,
  Camera,
  Send,
  Info,
  Circle,
} from "lucide-react";
import OfficerLayout from "../../layouts/OfficerLayout";
import { PriorityBadge, SLABadge } from "../../components/Badges";
import { useGrievances } from "../../hooks/useGrievances";
import { supabase } from "../../lib/supabase";


function ImageDropZone({ label, hint, value, onChange, icon: Icon = Camera }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onChange({ file, url, name: file.name });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col h-full">
      <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
        <Icon size={14} className="text-slate-400" />
        {label}
        <span className="text-red-500">*</span>
      </label>

      {value ? (
        // Preview
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-xl overflow-hidden border-2 border-emerald-300 flex-1 min-h-48"
        >
          <img
            src={value.url}
            alt={label}
            className="w-full h-full object-cover"
            style={{ minHeight: "12rem" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="text-xs text-white font-medium bg-black/40 px-2 py-1 rounded truncate max-w-[70%]">
              {value.name}
            </span>
            {!value.isReadonly && (
              <button
                onClick={() => onChange(null)}
                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-2 py-1 rounded-full font-semibold shadow-sm">
              <CheckCircle2 size={11} /> {value.isReadonly ? 'Auto-filled' : 'Uploaded'}
            </span>
          </div>
        </motion.div>
      ) : (
        // Drop zone
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex-1 min-h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragging
              ? "border-blue-400 bg-blue-50 scale-[1.01]"
              : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"
          }`}
        >
          <div className={`p-4 rounded-full mb-3 transition-colors ${dragging ? "bg-blue-100" : "bg-slate-100"}`}>
            <ImagePlus className={`h-7 w-7 ${dragging ? "text-blue-500" : "text-slate-400"}`} />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            {dragging ? "Drop image here" : "Click or drag to upload"}
          </p>
          <p className="text-xs text-slate-400 mt-1">{hint}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}

export default function EvidenceUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const { grievances } = useGrievances();
  const actionableComplaints = grievances.filter((c) => {
    if (c.status === 'Resolved') return false;
    if (!c.ai_evidence_report && c.status === 'In Progress') return false;
    if (c.ai_evidence_report && c.ai_evidence_report.recommendation === 'APPROVE') return false;
    return true;
  });
  const [selectedId, setSelectedId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [workOrderId, setWorkOrderId] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedComplaint = grievances.find((c) => c.id === selectedId);

  useEffect(() => {
    if (location.state?.grievanceDbId) {
      const g = grievances.find(x => x.dbId === location.state.grievanceDbId);
      if (g) {
        setSelectedId(g.id);
        if (g.evidence_urls?.length > 0) {
          setBeforeImage({ url: g.evidence_urls[0], name: "Citizen's Before Photo", isReadonly: true });
        }
      }
    }
  }, [location.state, grievances]);

  const validate = () => {
    const e = {};
    if (!selectedId) e.grievance = "Please select a grievance.";
    if (!beforeImage) e.before = "Before image is required.";
    if (!afterImage) e.after = "After image is required.";
    if (!resolutionNote.trim()) e.note = "Resolution note is required.";
    return e;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setIsSubmitting(true);

    try {
      // 1. Upload After Image to Supabase Storage
      const timestamp = new Date().getTime();
      const filename = afterImage.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `officer-evidence/${selectedComplaint.dbId}/${timestamp}-${filename}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, afterImage.file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);

      // 2. Trigger Evidence Agent
      const evidenceRes = await fetch('http://localhost:3001/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          grievance: { ...selectedComplaint, id: selectedComplaint.dbId },
          beforeDesc: 'Citizen uploaded photo of issue',
          afterDesc: 'Officer uploaded after-photo as evidence of resolution',
          officerNote: resolutionNote,
          afterImageUrl: publicUrl
        })
      });
      const evidenceReport = await evidenceRes.json();
      
      // 3. Update grievance status to in_progress
      await supabase.from('grievances').update({ status: 'in_progress' }).eq('id', selectedComplaint.dbId);

      setSubmitted(true);
    } catch (err) {
      console.error("AI Evidence workflow failed", err);
      setErrors({ form: err.message || "Failed to upload evidence or analyze with AI." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeness = [
    !!selectedId,
    !!beforeImage,
    !!afterImage,
    !!workOrderId.trim(),
    !!resolutionNote.trim(),
  ].filter(Boolean).length;

  const pct = Math.round((completeness / 5) * 100);

  if (submitted) {
    return (
      <OfficerLayout>
        <div className="max-w-lg mx-auto mt-16 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Evidence Submitted!</h2>
            <p className="text-slate-500 mb-2">
              Evidence for <span className="font-semibold text-blue-700">{selectedId}</span> has been submitted for AI review.
            </p>
            <p className="text-sm text-slate-400 mb-8">
              The Evidence Agent will analyze your before & after images and generate a confidence report.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => navigate(`/officer/evidence-report`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors"
              >
                View AI Evidence Report <ChevronDown size={14} className="-rotate-90" />
              </button>
              <button
                onClick={() => navigate("/officer/complaints")}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Back to All Complaints
              </button>
            </div>
          </motion.div>
        </div>
      </OfficerLayout>
    );
  }

  return (
    <OfficerLayout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Resolution Evidence</h2>
        <p className="text-sm text-slate-500 mt-1">
          Submit before & after photos for AI-powered verification before case closure
        </p>
      </div>

      {errors.form && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errors.form}</div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step 1: Select Grievance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <h3 className="font-bold text-slate-900">Select Grievance</h3>
            </div>

            {/* Custom dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((p) => !p)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                  errors.grievance ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-blue-300"
                } focus:outline-none`}
              >
                {selectedComplaint ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-bold text-blue-700">{selectedComplaint.id}</span>
                    <span className="text-slate-700 truncate">{selectedComplaint.title}</span>
                    <PriorityBadge priority={selectedComplaint.priority} />
                  </div>
                ) : (
                  <span className="text-slate-400">Choose a grievance to submit evidence for…</span>
                )}
                <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 ml-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {errors.grievance && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertTriangle size={11} /> {errors.grievance}</p>}

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden"
                  >
                    {actionableComplaints.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedId(c.id); setDropdownOpen(false); setErrors((e) => ({ ...e, grievance: undefined })); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                          selectedId === c.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <span className="text-xs font-bold text-blue-700 w-20 flex-shrink-0">{c.id}</span>
                        <span className="text-sm text-slate-700 flex-1 truncate">{c.title}</span>
                        <PriorityBadge priority={c.priority} />
                        <SLABadge slaRemaining={c.slaRemaining} slaStatus={c.slaStatus} />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected complaint info */}
            <AnimatePresence>
              {selectedComplaint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {[
                      { icon: MapPin, label: "Location", value: selectedComplaint.location },
                      { icon: Hash, label: "Category", value: selectedComplaint.category },
                      { icon: Clock, label: "Submitted", value: selectedComplaint.submitted },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label}>
                        <div className="text-slate-400 flex items-center gap-1 mb-0.5"><Icon size={10} /> {label}</div>
                        <div className="font-semibold text-slate-700">{value}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Step 2: Image Upload */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <h3 className="font-bold text-slate-900">Upload Before & After Images</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5 ml-8">
              Both images are required. The AI Evidence Agent will compare them to verify the resolution.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <ImageDropZone
                  label="Before Image"
                  hint="Photo of the issue before repair"
                  value={beforeImage}
                  onChange={setBeforeImage}
                />
                {errors.before && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertTriangle size={11} /> {errors.before}</p>}
              </div>
              <div>
                <ImageDropZone
                  label="After Image"
                  hint="Photo of the site after resolution"
                  value={afterImage}
                  onChange={setAfterImage}
                />
                {errors.after && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertTriangle size={11} /> {errors.after}</p>}
              </div>
            </div>
          </motion.div>

          {/* Step 3: Resolution Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <h3 className="font-bold text-slate-900">Resolution Details</h3>
            </div>

            <div className="space-y-4">
              {/* Work Order ID */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5 block">
                  <Hash size={13} className="text-slate-400" /> Work Order ID
                  <span className="text-slate-400 font-normal text-xs">(optional)</span>
                </label>
                <input
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(e.target.value)}
                  placeholder="e.g. WO-2025-05-1024"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>

              {/* Resolution Note */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5 block">
                  <FileText size={13} className="text-slate-400" /> Resolution Note
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => { setResolutionNote(e.target.value); setErrors((e2) => ({ ...e2, note: undefined })); }}
                  rows={4}
                  placeholder="Describe what was done to resolve the issue, which team carried out the work, and any relevant observations…"
                  className={`w-full px-4 py-3 text-sm border rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none ${
                    errors.note ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {errors.note && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={11} /> {errors.note}</p>}
              </div>

              {/* Auto-captured fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Location (auto-captured)</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                    <MapPin size={13} className="text-slate-400" />
                    {selectedComplaint ? selectedComplaint.location : "—"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Timestamp (auto-captured)</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                    <Clock size={13} className="text-slate-400" />
                    {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end gap-3"
          >
            <button
              onClick={() => navigate("/officer/complaints")}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-sm"
            >
              <Send size={15} /> Submit for AI Review
            </button>
          </motion.div>
        </div>

        {/* Right: Checklist + Info */}
        <div className="space-y-5">
          {/* Completeness */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-5"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-4">Submission Checklist</h3>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Completeness</span>
                <span className="font-bold text-slate-700">{pct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Grievance selected", done: !!selectedId },
                { label: "Before image uploaded", done: !!beforeImage },
                { label: "After image uploaded", done: !!afterImage },
                { label: "Work order ID entered", done: !!workOrderId.trim() },
                { label: "Resolution note written", done: !!resolutionNote.trim() },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle size={16} className="text-slate-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${item.done ? "text-slate-700 font-medium" : "text-slate-400"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Notice */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-violet-50 border border-violet-200 rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <Info size={16} className="text-violet-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-violet-800 mb-1">AI Evidence Review</h4>
                <p className="text-xs text-violet-600 leading-relaxed">
                  After submission, the <strong>Evidence Agent (Qwen 3.6 27B)</strong> will analyze your before &amp; after images and generate a confidence report comparing the two states.
                </p>
                <p className="text-xs text-violet-500 mt-2">
                  The Resolution Agent will then use this report to recommend approval or rejection before the case is sent for citizen verification.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Guidelines */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.24 }}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          >
            <h4 className="text-sm font-bold text-slate-900 mb-3">Photo Guidelines</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              {[
                "Take both photos from the same angle and distance",
                "Ensure good natural lighting — avoid shadows",
                "Include a recognisable landmark or signage if possible",
                "Photos must be taken at the actual complaint site",
                "Minimum resolution: 1 MP",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </OfficerLayout>
  );
}
