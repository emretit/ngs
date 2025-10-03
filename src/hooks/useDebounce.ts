import { useState, useEffect } from 'react';

/**
 * Debounce hook - değeri belirli bir süre bekledikten sonra günceller
 * @param value - debounce edilecek değer
 * @param delay - bekleme süresi (ms)
 * @returns debounced değer
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}