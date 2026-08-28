import { useState, useEffect, useCallback } from 'react';
import { fetchAllGrievances, mapGrievance } from '../lib/grievanceService';
import { supabase } from '../lib/supabase';

/**
 * Hook: fetches ALL grievances (officer list / dashboard).
 * Subscribes to Supabase realtime so the list auto-updates.
 * Returns { grievances, loading, error, refetch }
 */
export function useGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchAllGrievances();
      setGrievances(raw.map(mapGrievance));
    } catch (e) {
      setError(e.message || 'Failed to load grievances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Realtime: patch local state on UPDATE, reload on INSERT/DELETE
    const channel = supabase
      .channel('grievances-list')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'grievances' }, (payload) => {
        setGrievances(prev =>
          prev.map(g => g.dbId === payload.new.id ? mapGrievance(payload.new) : g)
        );
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'grievances' }, () => load())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'grievances' }, (payload) => {
        setGrievances(prev => prev.filter(g => g.dbId !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { grievances, loading, error, refetch: load };
}


/**
 * Hook: fetches a SINGLE grievance by its Supabase UUID or readable_id.
 * Returns { grievance, loading, error, refetch }
 */
export function useGrievance(id) {
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // Try by UUID first; fall back to readable_id lookup
      let raw;
      try {
        raw = await fetchGrievanceById(id);
      } catch {
        const { supabase } = await import('../lib/supabase');
        const { data, error: e2 } = await supabase
          .from('grievances')
          .select('*')
          .eq('readable_id', id)
          .maybeSingle();
        if (e2) throw e2;
        if (!data) throw new Error("Grievance not found");
        raw = data;
      }
      setGrievance(mapGrievance(raw));
    } catch (e) {
      setError(e.message || 'Failed to load grievance');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { grievance, loading, error, refetch: load };
}
