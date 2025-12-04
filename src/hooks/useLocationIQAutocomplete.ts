import { useState, useCallback, useEffect, useRef } from 'react';
import { locationiqService, LocationIQAutocompleteResult } from '@/services/locationiqService';

interface UseLocationIQAutocompleteOptions {
  debounceMs?: number;
  minChars?: number;
  countryCode?: string;
}

/**
 * Hook for LocationIQ address autocomplete with debouncing
 */
export const useLocationIQAutocomplete = (options: UseLocationIQAutocompleteOptions = {}) => {
  const {
    debounceMs = 300,
    minChars = 3,
    countryCode = 'tr',
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationIQAutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Search for addresses
   */
  const search = useCallback(async (searchQuery: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchQuery || searchQuery.length < minChars) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();
      
      const data = await locationiqService.autocomplete(searchQuery, countryCode);
      
      setResults(data);
      setIsLoading(false);
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err.message || 'Adres arama başarısız oldu';
        setError(errorMessage);
        setResults([]);
      }
      setIsLoading(false);
    }
  }, [minChars, countryCode]);

  /**
   * Handle query change with debouncing
   */
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, search, debounceMs]);

  /**
   * Clear results
   */
  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  /**
   * Update query
   */
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  return {
    query,
    updateQuery,
    results,
    isLoading,
    error,
    clear,
  };
};












