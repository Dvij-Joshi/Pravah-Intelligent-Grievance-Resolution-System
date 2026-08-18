import { useState, useEffect, useCallback } from 'react';
import { fetchAllGrievances, fetchGrievanceById, mapGrievance } from '../lib/grievanceService';

/**
 * Hook: fetches ALL grievances (officer list / dashboard).
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

  useEffect(() => { load(); }, [load]);

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
          .single();
        if (e2) throw e2;
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
