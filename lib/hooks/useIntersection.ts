import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref to attach to a sentinel element and a boolean that is
 * `true` whenever that element is within the viewport.
 *
 * Useful for infinite scroll — fire your "load more" when `isIntersecting` flips to true.
 */
export function useIntersection(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting };
}
