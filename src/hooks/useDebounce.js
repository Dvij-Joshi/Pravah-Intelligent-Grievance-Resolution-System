import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay (ms).
 * Useful for search inputs to avoid filtering on every keystroke.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

