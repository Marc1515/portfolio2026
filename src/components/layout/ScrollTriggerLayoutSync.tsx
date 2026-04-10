"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * WebViews and font loading can leave ScrollTrigger positions stale on first paint.
 */
export function ScrollTriggerLayoutSync() {
  useEffect(() => {
    const refresh = () => {
      ScrollTrigger.refresh();
    };

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(refresh);
    });

    const onLoad = () => refresh();
    window.addEventListener("load", onLoad);

    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) {
        refresh();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
