"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/data/site";
import type { SectionId } from "@/types/site";

export function useActiveSection() {
  const [activeId, setActiveId] = useState<SectionId>(
    siteConfig.navigation[0]?.id ?? "home"
  );

  useEffect(() => {
    const ids = siteConfig.navigation.map((n) => n.id);
    let ticking = false;

    const update = () => {
      const threshold = window.innerHeight * 0.1;
      let current = ids[0];

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) {
          current = id;
        }
      }

      setActiveId(current);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return activeId;
}
