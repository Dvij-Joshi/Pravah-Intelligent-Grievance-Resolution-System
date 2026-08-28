import React, { memo } from "react";

const priorityConfig = {
  HIGH: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  LOW: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
};

const slaConfig = {
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  overdue: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  ok: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  resolved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

const statusConfig = {
  "In Progress": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Pending": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Overdue": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Under Review": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "Resolved": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

export const PriorityBadge = memo(function PriorityBadge({ priority }) {
  const cfg = priorityConfig[priority] || priorityConfig.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
});

export const SLABadge = memo(function SLABadge({ slaRemaining, slaStatus }) {
  const cfg = slaConfig[slaStatus] || slaConfig.ok;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {slaRemaining}
    </span>
  );
});

export const StatusBadge = memo(function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig["Pending"];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {status}
    </span>
  );
});

