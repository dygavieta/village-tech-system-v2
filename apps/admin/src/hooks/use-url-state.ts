import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for managing state in URL query parameters
 * @param key - URL parameter key
 * @param defaultValue - Default value if parameter is not present
 * @returns [value, setValue] - Current value and setter function
 */
export function useUrlState<T extends string>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const value = (searchParams.get(key) as T) || defaultValue;

  const setValue = useCallback(
    (newValue: T) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newValue === defaultValue || !newValue) {
        params.delete(key);
      } else {
        params.set(key, newValue);
      }

      const queryString = params.toString();
      const url = queryString ? `?${queryString}` : window.location.pathname;

      router.push(url, { scroll: false });
    },
    [key, defaultValue, router, searchParams]
  );

  return [value, setValue];
}

/**
 * Hook for managing array state in URL query parameters
 * @param key - URL parameter key
 * @param defaultValue - Default value if parameter is not present
 * @returns [value, setValue] - Current value array and setter function
 */
export function useUrlArrayState(
  key: string,
  defaultValue: string[] = []
): [string[], (value: string[]) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const value = searchParams.get(key)?.split(',').filter(Boolean) || defaultValue;

  const setValue = useCallback(
    (newValue: string[]) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newValue.length === 0 || (newValue.length === defaultValue.length && newValue.every((v, i) => v === defaultValue[i]))) {
        params.delete(key);
      } else {
        params.set(key, newValue.join(','));
      }

      const queryString = params.toString();
      const url = queryString ? `?${queryString}` : window.location.pathname;

      router.push(url, { scroll: false });
    },
    [key, defaultValue, router, searchParams]
  );

  return [value, setValue];
}
