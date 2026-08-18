import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  PlusCircle, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Bell, 
  User, 
  ChevronRight, 
  AlertTriangle,
  Zap
} from 'lucide-react';

const mockGrievances = [
  {
    id: 'GRV-1024',
    title: 'Water supply disrupted — multiple houses affected',
    category: 'Water Supply',
    status: 'In Progress',
    date: '18 Aug 2026',
    slaRisk: false
  },
  {
    id: 'GRV-0985',
    title: 'Pothole on Main Road causing accidents',
    category: 'Road Infrastructure',
    status: 'Resolved',
    date: '12 Aug 2026',
    slaRisk: false
  },
  {
    id: 'GRV-0942',
    title: 'Streetlights not working in Sector 4',
    category: 'Electricity',
    status: 'Pending Feedback',
    date: '05 Aug 2026',
    slaRisk: true
  }
];

export default function CitizenDashboard({ onNewGrievance, onViewDetails, onHome }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onHome}>
            <ShieldCheck className="h-6 w-6 text-blue-700" />
            <span className="font-bold text-slate-900 text-lg tracking-tight">Pravah</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                C
              </div>
              <span className="text-sm font-semibold text-slate-700 pr-1">Citizen</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Welcome back, Rohan</h1>
            <p className="text-slate-500">Manage your civic requests and track their resolution progress.</p>
          </motion.div>
          <motion.button 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onNewGrievance}
            className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <PlusCircle className="h-5 w-5" />
            Lodge New Grievance
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { label: 'Active', value: '1', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { label: 'Resolved', value: '12', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                { label: 'Requires Action', value: '1', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${stat.border} ${stat.bg} shadow-sm flex flex-col justify-center items-center text-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color} mb-2`} />
                  <span className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</span>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mt-1">{stat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* My Grievances List */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  My Grievances
                </h2>
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">View All</button>
              </div>
              <div className="divide-y divide-slate-100">
                {mockGrievances.map((g, i) => (
                  <div key={i} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => onViewDetails(g.id)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200">
                          {g.id}
                        </span>
                        <span className="text-xs font-medium text-slate-400">{g.date}</span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        g.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                        g.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {g.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">{g.title}</h3>
                        <p className="text-sm text-slate-500">{g.category}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* AI Assistant Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Zap className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-4">
                  <Zap className="h-3 w-3" /> Pravah AI
                </div>
                <h3 className="text-xl font-bold mb-2">Need help framing your issue?</h3>
                <p className="text-blue-100 text-sm mb-6">
                  Our AI assistant can help you write a clear complaint and automatically route it to the right department.
                </p>
                <button 
                  onClick={onNewGrievance}
                  className="w-full bg-white text-blue-900 hover:bg-blue-50 font-bold py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Start Chat
                </button>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-500" />
                  Recent Notifications
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { msg: "Officer Rahul Sharma requested feedback on GRV-0942", time: "2 hours ago", unread: true },
                  { msg: "Your grievance GRV-0985 was successfully resolved.", time: "12 Aug", unread: false },
                ].map((n, i) => (
                  <div key={i} className={`p-5 flex gap-3 ${n.unread ? 'bg-blue-50/30' : ''}`}>
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.unread ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    <div>
                      <p className={`text-sm ${n.unread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{n.msg}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}
