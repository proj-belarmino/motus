import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../context/ApiContext';
import { Movie, Page, SearchQuery } from '../types';

export const useMovies = (initialQuery: SearchQuery = { page: 0, size: 20 }) => {
  const api = useApi();
  const [data, setData] = useState<Page<Movie> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<SearchQuery>(initialQuery);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getMovies(query);
      setData(result);
      setError(null);
    } catch {
      setError('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  }, [api, query]);

  useEffect(() => {
    // This hook owns the asynchronous library request for each query change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMovies();
  }, [fetchMovies]);

  const updateSearch = useCallback((newQuery: Partial<SearchQuery>) => {
    setQuery((prev) => ({ ...prev, ...newQuery, page: 0 }));
  }, []);

  const triggerScan = async () => {
    await api.triggerScan();
  };

  return { data, loading, error, query, updateSearch, triggerScan, refresh: fetchMovies };
};
