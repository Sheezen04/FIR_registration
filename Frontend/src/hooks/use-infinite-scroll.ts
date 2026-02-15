import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for infinite scroll with intersection observer
 * @param callback - Function to call when bottom is reached
 * @param hasMore - Whether there are more items to load
 * @param isLoading - Whether currently loading
 * @returns ref to attach to the sentinel element
 */
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  isLoading: boolean
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const setSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // If loading or no more items, don't observe
      if (isLoading || !hasMore || !node) {
        sentinelRef.current = null;
        return;
      }

      sentinelRef.current = node;

      // Create new observer
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !isLoading) {
            callback();
          }
        },
        {
          root: null,
          rootMargin: '100px', // Load more before reaching the absolute bottom
          threshold: 0.1,
        }
      );

      observerRef.current.observe(node);
    },
    [callback, hasMore, isLoading]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return setSentinelRef;
}

export default useInfiniteScroll;
