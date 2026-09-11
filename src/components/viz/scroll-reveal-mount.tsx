"use client";

import { useScrollReveal } from "@/hooks/use-reveal";

/**
 * Mounts the scroll-reveal IntersectionObserver. Render once per page that
 * uses `.reveal` elements. The hook does the heavy lifting in `useEffect`.
 */
export function ScrollRevealMount() {
  useScrollReveal();
  return null;
}