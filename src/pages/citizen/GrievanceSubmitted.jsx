import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Clock,
  MapPin,
  Tag,
  Zap,
  Home,
} from 'lucide-react';

// Simulate what the Triage Agent would return
function generateTriageResult(data) {
  const categoryMap = {
    'Water Supply': { dept: 'Water Supply Department', priority: 'HIGH', sla: '48 hours' },
    'Road Infrastructure': { dept: 'Public Works Department', priority: 'HIGH', sla: '72 hours' },
    'Sanitation & Drainage': { dept: 'Sanitation Department', priority: 'MEDIUM', sla: '48 hours' },
    'Electricity': { dept: 'Electricity Department', priority: 'HIGH', sla: '24 hours' },
    'Street Lighting': { dept: 'Electricity Department', priority: 'LOW', sla: '96 hours' },
    'Garbage Collection': { dept: 'Sanitation Department', priority: 'MEDIUM', sla: '24 hours' },
    'Public Property Damage': { dept: 'Municipal Corporation', priority: 'MEDIUM', sla: '72 hours' },
    'Noise Pollution': { dept: 'Environment Department', priority: 'LOW', sla: '96 hours' },
    'Other': { dept: 'Municipal Corporation', priority: 'MEDIUM', sla: '72 hours' },
  };

  const cat = data?.category || 'Water Supply';
  const result = categoryMap[cat] || categoryMap['Other'];
  return {
    category: cat || 'Water Supply',
    department: result.dept,
    priority: result.priority,
    sla: result.sla,
  };
}

const PRIORITY_STYLES = {
  HIGH:   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',   dot: 'bg-red-500'   },
  MEDIUM: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200', dot: 'bg-amber-500' },
  LOW:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200', dot: 'bg-green-500' },
};

export default function GrievanceSubmitted({ data, onTrack, onHome }) {
  const grievanceId = `GRV-${Math.floor(1000 + Math.random() * 9000)}`;
  const [gid] = useState(grievanceId);
  const [copied, setCopied] = useState(false);
  const [triageReady, setTriageReady] = useState(false);
  const triage = generateTriageResult(data);
  const priority = PRIORITY_STYLES[triage.priority] || PRIORITY_STYLES.MEDIUM;

  // Simulate Triage Agent processing delay
  useEffect(() => {
    const t = setTimeout(() => setTriageReady(true), 2200);
    return () => clearTimeout(t);
  }, []);

  function copyId() {
    navigator.clipboard.writeText(gid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const submittedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-700" />
            <span className="font-bold text-slate-900 text-lg">Pravah</span>
          </div>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Citizen Portal
          </span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="relative mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 180 }}
              className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-600" strokeWidth={1.5} />
            </motion.div>
            {/* Pulse ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ delay: 0.3, duration: 1, repeat: Infinity, repeatDelay: 1 }}
              className="absolute inset-0 rounded-full bg-green-400"
            />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-2xl font-extrabold text-slate-900 mb-2"
          >
            Your grievance has been submitted!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-slate-500 text-sm max-w-sm"
          >
            We have received your complaint and our team is working on it. Use your Grievance ID to track progress.
          </motion.p>
        </motion.div>

        {/* Grievance ID card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Grievance ID</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-3xl font-extrabold text-blue-700 tracking-tight font-mono">{gid}</span>
            <button
              onClick={copyId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Submitted on {submittedAt}
          </p>
        </motion.div>

        {/* Submission details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4"
        >
          <h2 className="text-sm font-bold text-slate-700 mb-4">Submission Summary</h2>
          <div className="space-y-3">
            {data?.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="text-sm text-slate-800 font-medium">{data.location}</p>
                </div>
              </div>
            )}
            {data?.description && (
              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Description</p>
                  <p className="text-sm text-slate-800 font-medium line-clamp-2">{data.description}</p>
                </div>
              </div>
            )}
            {data?.files?.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="h-4 w-4 mt-0.5 flex-shrink-0 flex items-center justify-center">
                  <span className="text-slate-400 text-xs">📎</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Evidence</p>
                  <p className="text-sm text-slate-800 font-medium">{data.files.length} file{data.files.length > 1 ? 's' : ''} attached</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Triage card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-700">AI Triage Agent</h2>
            {!triageReady && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Processing...
              </span>
            )}
            {triageReady && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-auto flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"
              >
                <Check className="h-3 w-3" />
                Structured
              </motion.span>
            )}
          </div>

          {!triageReady ? (
            <div className="space-y-2.5">
              {[80, 60, 45].map((w, i) => (
                <div key={i} className={`h-4 bg-slate-100 rounded animate-pulse`} style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Category</p>
                  <p className="text-sm font-semibold text-slate-800">{triage.category}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">SLA Deadline</p>
                  <p className="text-sm font-semibold text-slate-800">{triage.sla}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Assigned Department</p>
                <p className="text-sm font-semibold text-slate-800">{triage.department}</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${priority.bg} ${priority.border}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`} />
                <p className="text-xs text-slate-500">Priority</p>
                <p className={`text-sm font-bold ml-auto ${priority.text}`}>{triage.priority}</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onTrack?.(gid)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Track Grievance <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" /> Back to Home
          </button>
        </motion.div>

        {/* Help note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="text-center text-xs text-slate-400 mt-6"
        >
          Save your Grievance ID <span className="font-semibold text-slate-600">{gid}</span> to track your complaint status anytime.
        </motion.p>
      </main>
    </div>
  );
}
