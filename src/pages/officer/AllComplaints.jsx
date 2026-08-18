import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  User,
  Calendar,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  X,
  Filter,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import OfficerLayout from "../../layouts/OfficerLayout";
import { PriorityBadge, SLABadge, StatusBadge } from "../../components/Badges";
import { useGrievances } from "../../hooks/useGrievances";

const CATEGORIES = ["All", "Water Supply", "Road Damage", "Street Light", "Garbage Collection", "Sewage", "Parks"];
const PRIORITIES = ["All", "HIGH", "MEDIUM", "LOW"];
const STATUSES = ["All", "In Progress", "Pending", "Overdue", "Under Review", "Resolved"];

const TABS = [
  { label: "All", key: "All" },
  { label: "Assigned to Me", key: "Assigned to Me" },
  { label: "At Risk", key: "At Risk" },
  { label: "Overdue", key: "Overdue" },
];

function SortIcon({ field, sortConfig }) {
  if (sortConfig.field !== field)
    return <ChevronUp className="h-3 w-3 text-slate-300" />;
  return sortConfig.dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-blue-600" />
    : <ChevronDown className="h-3 w-3 text-blue-600" />;
}

export default function AllComplaints() {
  const navigate = useNavigate();
  const { grievances, loading, error, refetch } = useGrievances();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ field: "submitted", dir: "desc" });

  const handleSort = (field) => {
    setSortConfig((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    );
  };

  const clearFilters = () => {
    setFilterCategory("All");
    setFilterPriority("All");
    setFilterStatus("All");
    setSearch("");
  };

  const activeFilterCount = [filterCategory, filterPriority, filterStatus].filter(
    (f) => f !== "All"
  ).length + (search ? 1 : 0);

  const filtered = useMemo(() => {
    let data = [...grievances];

    // Tab filter
    if (activeTab === "At Risk") data = data.filter((c) => c.slaStatus === "warning" || c.slaStatus === "critical");
    if (activeTab === "Overdue") data = data.filter((c) => c.slaStatus === "overdue");

    // Search
    if (search)
      data = data.filter(
        (c) =>
          c.id.toLowerCase().includes(search.toLowerCase()) ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.location?.toLowerCase().includes(search.toLowerCase())
      );

    // Dropdowns
    if (filterCategory !== "All") data = data.filter((c) => c.category === filterCategory);
    if (filterPriority !== "All") data = data.filter((c) => c.priority === filterPriority);
    if (filterStatus !== "All") data = data.filter((c) => c.status === filterStatus);

    // Sort
    data.sort((a, b) => {
      let aVal = a[sortConfig.field] ?? "";
      let bVal = b[sortConfig.field] ?? "";
      if (sortConfig.dir === "asc") return String(aVal).localeCompare(String(bVal));
      return String(bVal).localeCompare(String(aVal));
    });

    return data;
  }, [grievances, search, activeTab, filterCategory, filterPriority, filterStatus, sortConfig]);

  const tabCounts = {
    "All": grievances.length,
    "Assigned to Me": grievances.length,
    "At Risk": grievances.filter((c) => c.slaStatus === "warning" || c.slaStatus === "critical").length,
    "Overdue": grievances.filter((c) => c.slaStatus === "overdue").length,
  };

  if (loading) {
    return (
      <OfficerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </OfficerLayout>
    );
  }

  if (error) {
    return (
      <OfficerLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
          <p className="text-slate-600 font-medium">{error}</p>
          <button onClick={refetch} className="mt-3 text-sm text-blue-600 hover:underline">Retry</button>
        </div>
      </OfficerLayout>
    );
  }

  return (
    <OfficerLayout>
      {/* Page Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">All Complaints</h2>
        <p className="text-sm text-slate-500 mt-1">{grievances.length} total cases assigned to your ward</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key
                  ? tab.key === "Overdue"
                    ? "bg-red-100 text-red-700"
                    : tab.key === "At Risk"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, or citizen name…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setFilterCategory(c)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          filterCategory === c
                            ? "bg-blue-700 text-white border-blue-700"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Priority</label>
                  <div className="flex gap-1.5">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          filterPriority === p
                            ? "bg-blue-700 text-white border-blue-700"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          filterStatus === s
                            ? "bg-blue-700 text-white border-blue-700"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1.2fr_2.5fr_1fr_1fr_1fr_1.1fr_80px] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <button onClick={() => handleSort("id")} className="flex items-center gap-1 hover:text-slate-700 transition-colors text-left">
            ID <SortIcon field="id" sortConfig={sortConfig} />
          </button>
          <button onClick={() => handleSort("title")} className="flex items-center gap-1 hover:text-slate-700 transition-colors text-left">
            Title <SortIcon field="title" sortConfig={sortConfig} />
          </button>
          <button onClick={() => handleSort("category")} className="flex items-center gap-1 hover:text-slate-700 transition-colors text-left">
            Category <SortIcon field="category" sortConfig={sortConfig} />
          </button>
          <button onClick={() => handleSort("priority")} className="flex items-center gap-1 hover:text-slate-700 transition-colors text-left">
            Priority <SortIcon field="priority" sortConfig={sortConfig} />
          </button>
          <button onClick={() => handleSort("status")} className="flex items-center gap-1 hover:text-slate-700 transition-colors text-left">
            Status <SortIcon field="status" sortConfig={sortConfig} />
          </button>
          <button onClick={() => handleSort("slaRemaining")} className="flex items-center gap-1 hover:text-slate-700 transition-colors text-left">
            SLA <SortIcon field="slaRemaining" sortConfig={sortConfig} />
          </button>
          <span />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-50">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-slate-400"
              >
                <Filter className="h-10 w-10 mb-3 text-slate-200" />
                <div className="font-medium text-slate-500">No complaints match your filters</div>
                <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline">
                  Clear all filters
                </button>
              </motion.div>
            ) : (
              filtered.map((c, idx) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="grid grid-cols-[1.2fr_2.5fr_1fr_1fr_1fr_1.1fr_80px] gap-3 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group items-center"
                  onClick={() => navigate(`/officer/complaints/${c.id}`)}
                >
                  {/* ID */}
                  <div>
                    <div className="text-sm font-bold text-blue-700 group-hover:underline">{c.id}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <MapPin size={10} />
                      {c.location}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <div className="text-sm font-medium text-slate-800 truncate pr-2">{c.title}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <User size={10} /> {c.citizen}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={10} /> {c.submitted}
                      </span>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="text-sm text-slate-600">{c.category}</div>

                  {/* Priority */}
                  <div>
                    <PriorityBadge priority={c.priority} />
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={c.status} />
                  </div>

                  {/* SLA */}
                  <div>
                    <SLABadge slaRemaining={c.slaRemaining} slaStatus={c.slaStatus} />
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">
                      Open <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Table Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-700">{grievances.length}</span> complaints
            </span>
          </div>
        )}
      </div>
    </OfficerLayout>
  );
}
