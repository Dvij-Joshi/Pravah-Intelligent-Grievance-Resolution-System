import React, { useState } from 'react';
import { useGrievances } from '../hooks/useGrievances';
import { Activity, Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import OfficerLayout from '../layouts/OfficerLayout';

export default function TestAIAgents() {
  const { grievances, loading } = useGrievances();
  const [runningId, setRunningId] = useState(null);
  const [results, setResults] = useState({});

  const runPipeline = async (grievance) => {
    setRunningId(grievance.id);
    setResults(prev => ({ ...prev, [grievance.id]: { status: 'running', logs: [] } }));

    const log = (msg, data = null) => {
      setResults(prev => ({
        ...prev,
        [grievance.id]: {
          ...prev[grievance.id],
          logs: [...prev[grievance.id].logs, { msg, data }]
        }
      }));
    };

    try {
      log('Triggering Triage Agent...');
      const triageRes = await fetch('http://localhost:3001/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grievance: { id: grievance.dbId, title: grievance.title, description: grievance.description, category: grievance.category } })
      });
      const triageData = await triageRes.json();
      log('Triage Completed', triageData);

      log('Triggering Resolution Planner Agent...');
      const planRes = await fetch('http://localhost:3001/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grievance: { id: grievance.dbId, title: grievance.title, description: grievance.description }, triageData })
      });
      const planData = await planRes.json();
      log('Resolution Plan Completed', planData);

      setResults(prev => ({
        ...prev,
        [grievance.id]: { ...prev[grievance.id], status: 'success' }
      }));
    } catch (err) {
      log('Error occurred', err.message);
      setResults(prev => ({
        ...prev,
        [grievance.id]: { ...prev[grievance.id], status: 'error' }
      }));
    } finally {
      setRunningId(null);
    }
  };

  if (loading) return <OfficerLayout><div className="flex justify-center mt-12"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div></OfficerLayout>;

  // Show grievances that haven't been processed by AI yet, or all of them
  return (
    <OfficerLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="text-violet-600" /> AI Agent Testing Playground
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Trigger the AI pipeline manually for grievances to see the exact API outputs and test the models.
        </p>
      </div>

      <div className="space-y-6">
        {grievances.map(g => (
          <div key={g.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">{g.id} - {g.title}</h3>
                <p className="text-xs text-slate-500">Currently has Action Plan: {g.ai_workflow ? 'Yes' : 'No'}</p>
              </div>
              <button
                onClick={() => runPipeline(g)}
                disabled={runningId === g.id}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {runningId === g.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Play className="h-4 w-4" />}
                {runningId === g.id ? 'Running AI Pipeline...' : 'Run Pipeline'}
              </button>
            </div>

            {results[g.id] && (
              <div className="p-6 bg-slate-900 text-slate-300 font-mono text-xs overflow-x-auto">
                <div className="space-y-4">
                  {results[g.id].logs.map((l, i) => (
                    <div key={i}>
                      <span className="text-violet-400">[{new Date().toLocaleTimeString()}]</span> <span className="text-white font-semibold">{l.msg}</span>
                      {l.data && (
                        <pre className="mt-2 pl-4 border-l-2 border-violet-500/30 text-emerald-300 whitespace-pre-wrap">
                          {JSON.stringify(l.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                  {results[g.id].status === 'success' && (
                    <div className="flex items-center gap-2 text-emerald-400 mt-4 font-bold border-t border-slate-700 pt-4">
                      <CheckCircle className="h-4 w-4" /> AI Pipeline completed successfully. Refresh the app to see it in Complaint Details.
                    </div>
                  )}
                  {results[g.id].status === 'error' && (
                    <div className="flex items-center gap-2 text-red-400 mt-4 font-bold border-t border-slate-700 pt-4">
                      <AlertTriangle className="h-4 w-4" /> AI Pipeline failed.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </OfficerLayout>
  );
}
