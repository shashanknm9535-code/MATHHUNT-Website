'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom polling hook that executes a callback at regular intervals.
 * Automatically cleans up intervals when unmounted or disabled.
 */
export function usePolling(
  callback: () => Promise<void> | void,
  intervalMs: number = 5000,
  enabled: boolean = true
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Execute immediately on mount/enable
    savedCallback.current();

    const id = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
