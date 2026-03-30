import { useEffect, useRef } from "react";
import { EVENTS, track } from "../lib/analytics";

const THRESHOLDS = [25, 50, 75, 100] as const;

export function useScrollDepth(pathname: string): void {
  const firedRef = useRef(new Set<number>());

  // Reset on route change — must be separate effect from the listener
  useEffect(() => {
    firedRef.current = new Set();
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = Math.min(100, (window.scrollY / total) * 100);
      for (const threshold of THRESHOLDS) {
        if (pct >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold);
          track(EVENTS.SCROLL_DEPTH, { depth: threshold, page: pathname });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);
}
