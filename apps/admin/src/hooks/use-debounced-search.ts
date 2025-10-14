import { useState, useEffect } from 'react';

/**
 * Hook for debounced search input
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds (default: 500)
 * @returns [debouncedValue, setValue, value] - Debounced value, setter, and immediate value
 */
export function useDebouncedSearch(initialValue: string = '', delay: number = 500) {
  const [value, setValue] = useState<string>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<string>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, setValue, value] as const;
}
