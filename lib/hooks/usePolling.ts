'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom polling hook that executes a callback at regular intervals.
 * Automatically cleans up intervals when unmounted or disabled.
 * Guards against concurrent overlapping requests: if the previous invocation
 * has not yet resolved, the next interval tick is skipped.
 */
export function usePolling(
  callback: () => Promise<void> | void,
  intervalMs: number = 5000,
  enabled: boolean = true
): void {
  const savedCallback = useRef(callback);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const runCallback = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        await savedCallback.current();
      } finally {
        isFetchingRef.current = false;
      }
    };

    // Execute immediately on mount/enable
    runCallback();

    const id = setInterval(runCallback, intervalMs);

    return () => {
      clearInterval(id);
      isFetchingRef.current = false;
    };
  }, [intervalMs, enabled]);
}
