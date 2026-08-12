import { useState, useEffect, useCallback } from "react";
import { useApi } from "../context/ApiContext";
import { Movie, Page, SearchQuery } from "../types";
import { ApiClient } from "../api/ApiClient";

const pageCache = new Map<string, Page<Movie>>();

const cacheKey = (query: SearchQuery) => JSON.stringify({ ...query });

export const warmMovies = async (api: Pick<ApiClient, "getMovies">) => {
  try {
    const query: SearchQuery = { page: 0, size: 20 };
    pageCache.set(cacheKey(query), await api.getMovies(query));
  } catch {
    // Prefetching is best-effort; pages fetch on their own if it fails.
  }
};

export const useMovies = (
  initialQuery: SearchQuery = { page: 0, size: 20 },
) => {
  const api = useApi();
  const [data, setData] = useState<Page<Movie> | null>(() => {
    return pageCache.get(cacheKey(initialQuery)) ?? null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !pageCache.has(cacheKey(initialQuery));
  });
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<SearchQuery>(initialQuery);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getMovies(query);
      pageCache.set(cacheKey(query), result);
      setData(result);
      setError(null);
    } catch {
      setError("Failed to fetch movies");
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

  return {
    data,
    loading,
    error,
    query,
    updateSearch,
    triggerScan,
    refresh: fetchMovies,
  };
};
