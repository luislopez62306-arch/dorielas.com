import { useState, useEffect, useRef } from 'react';

export interface UseProgressiveImageOptions {
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Custom hook with IntersectionObserver for lazy loading images
 * with a high-performance blur-up placeholder effect.
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element | null>,
  options: UseProgressiveImageOptions = {}
): boolean {
  const [isInView, setIsInView] = useState(false);
  const { rootMargin = '180px 0px', threshold = 0.01 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [ref, rootMargin, threshold]);

  return isInView;
}

/**
 * Hook to progressively load an image with blur-up placeholder
 */
export function useProgressiveImage(
  src: string,
  options?: UseProgressiveImageOptions
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useIntersectionObserver(containerRef, options);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isInView || !src) return;

    let isMounted = true;
    const img = new Image();
    img.src = src;

    img.onload = () => {
      if (isMounted) {
        setIsLoaded(true);
      }
    };

    img.onerror = () => {
      if (isMounted) {
        setHasError(true);
        setIsLoaded(true);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [isInView, src]);

  return {
    containerRef,
    isInView,
    isLoaded,
    hasError,
  };
}
