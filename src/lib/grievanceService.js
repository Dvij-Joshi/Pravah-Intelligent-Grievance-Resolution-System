import { supabase } from '../lib/supabase';

// ─── Grievances ───────────────────────────────────────────────────────────────

export async function fetchAllGrievances() {
  const { data, error } = await supabase
    .from('grievances')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchGrievanceById(id) {
  const { data, error } = await supabase
    .from('grievances')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateGrievanceStatus(id, status) {
  const { error } = await supabase
    .from('grievances')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps a raw Supabase grievance row into the shape the officer UI expects.
 */
export function mapGrievance(g) {
  return {
    id: g.readable_id || g.id,
    dbId: g.id,
    title: g.title,
    category: g.category,
    location: g.location,
    status: mapStatus(g.status),
    priority: (g.priority || 'medium').toUpperCase(),
    submitted: g.created_at
      ? new Date(g.created_at).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        })
      : '—',
    description: g.description,
    citizen: g.is_anonymous ? 'Anonymous Citizen' : (g.contact_name || 'Citizen'),
    phone: g.is_anonymous ? 'Hidden' : (g.contact_phone || 'Not provided'),
    evidence_urls: g.evidence_urls || [],
    slaRemaining: computeSLA(g.created_at, g.status),
    slaStatus: computeSLAStatus(g.created_at, g.status),
    ai_workflow: g.ai_workflow || null,
    ai_triage_data: g.ai_triage_data || null,
    ai_evidence_report: g.ai_evidence_report || null,
    ai_verdict: g.ai_verdict || null,
    created_at_raw: g.created_at
  };
}

function mapStatus(raw) {
  const map = {
    submitted: 'Open',
    open: 'Open',
    in_progress: 'In Progress',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
    closed: 'Resolved',
    reopened: 'Reopened',
    escalated: 'Escalated',
  };
  return map[(raw || '').toLowerCase()] || 'Open';
}

function computeSLA(createdAt, status) {
  if (!createdAt) return '—';
  if ((status || '').toLowerCase() === 'resolved') return 'Resolved';
  const SLA_HOURS = 48;
  const created = new Date(createdAt);
  const now = new Date();
  const elapsedHours = (now - created) / 36e5;
  const remaining = SLA_HOURS - elapsedHours;
  if (remaining <= 0) return 'Overdue';
  if (remaining < 4) return `${Math.round(remaining)}h left`;
  if (remaining < 12) return `${Math.round(remaining)}h left`;
  if (remaining < 24) return `${Math.round(remaining)}h left`;
  const days = Math.floor(remaining / 24);
  const hrs = Math.round(remaining % 24);
  return hrs > 0 ? `${days}d ${hrs}h left` : `${days}d left`;
}

function computeSLAStatus(createdAt, status) {
  if (!createdAt) return 'ok';
  if ((status || '').toLowerCase() === 'resolved') return 'ok';
  const SLA_HOURS = 48;
  const elapsed = (new Date() - new Date(createdAt)) / 36e5;
  const remaining = SLA_HOURS - elapsed;
  if (remaining <= 0) return 'overdue';
  if (remaining < 4) return 'critical';
  if (remaining < 12) return 'warning';
  return 'ok';
}
