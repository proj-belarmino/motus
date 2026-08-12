import { useCallback, useEffect, useState } from "react";
import { useApi } from "../context/ApiContext";
import { Movie } from "../types";
import { ApiClient } from "../api/ApiClient";

const collectionCache = new Map<"favorites" | "watchlist", Movie[]>();

export const warmCollection = async (
  kind: "favorites" | "watchlist",
  api: Pick<ApiClient, "getFavorites" | "getWatchlist">,
) => {
  try {
    collectionCache.set(
      kind,
      kind === "favorites" ? await api.getFavorites() : await api.getWatchlist(),
    );
  } catch {
    // Prefetching is best-effort; pages fetch on their own if it fails.
  }
};

export const usePersonalCollection = (kind: "favorites" | "watchlist") => {
  const api = useApi();
  const cached = collectionCache.get(kind);
  const [items, setItems] = useState<Movie[]>(cached ?? []);
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result =
        kind === "favorites" ? await api.getFavorites() : await api.getWatchlist();
      collectionCache.set(kind, result);
      setItems(result);
      setError("");
    } catch {
      setError(
        kind === "favorites"
          ? "Your favourites could not be loaded."
          : "Your watchlist could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [api, kind]);

  useEffect(() => {
    // This page owns the personal collection request for the logged-in user.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const remove = useCallback((movieId: string) => {
    setItems((current) => current.filter((item) => item.id !== movieId));
  }, []);

  return { items, loading, error, load, remove };
};