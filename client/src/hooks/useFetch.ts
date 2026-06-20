import { useCallback, useEffect, useState } from "react";

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useFetch<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;
    setLoading(true);
    setError(null);

    loader(ctrl.signal)
      .then((result) => {
        if (!alive) return;
        setData(result);
      })
      .catch((e: unknown) => {
        if (!alive || ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to reach the API");
        setData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload };
}
