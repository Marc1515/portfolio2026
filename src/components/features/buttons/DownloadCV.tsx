"use client";

import { useRef, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTranslations } from "next-intl";

const baseMixStyle = {
  "--cv-bg-mix": "24%",
  "--cv-border-mix": "60%",
  backgroundColor:
    "color-mix(in srgb, var(--accent) var(--cv-bg-mix), var(--surface))",
  borderColor:
    "color-mix(in srgb, var(--accent) var(--cv-border-mix), var(--surface-border))",
} as CSSProperties;

const DownloadCV = () => {
  const t = useTranslations("home");
  const linkRef = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const el = linkRef.current;
      if (!el) {
        return;
      }

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      let tween: gsap.core.Tween | null = null;
      let clickTl: gsap.core.Timeline | null = null;

      const playClickSpring = () => {
        if (reducedMotion) {
          return;
        }
        clickTl?.kill();
        clickTl = gsap.timeline();
        clickTl
          .to(el, {
            scale: 0.94,
            duration: 0.09,
            ease: "power2.in",
          })
          .to(el, {
            scale: 1,
            duration: 0.72,
            ease: "elastic.out(1, 0.30)",
          });
      };

      const onEnter = () => {
        tween?.kill();
        if (reducedMotion) {
          gsap.set(el, {
            "--cv-bg-mix": "32%",
            "--cv-border-mix": "80%",
          });
          return;
        }
        tween = gsap.to(el, {
          y: -1,
          "--cv-bg-mix": "32%",
          "--cv-border-mix": "80%",
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const onLeave = () => {
        tween?.kill();
        if (reducedMotion) {
          gsap.set(el, {
            "--cv-bg-mix": "24%",
            "--cv-border-mix": "60%",
          });
          return;
        }
        tween = gsap.to(el, {
          y: 0,
          "--cv-bg-mix": "24%",
          "--cv-border-mix": "60%",
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);
      el.addEventListener("click", playClickSpring);

      return () => {
        tween?.kill();
        clickTl?.kill();
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
        el.removeEventListener("click", playClickSpring);
      };
    },
    { scope: linkRef, dependencies: [] },
  );

  return (
    <a
      ref={linkRef}
      href="/MEQ_ESP.pdf"
      download
      style={baseMixStyle}
      className="
                        inline-flex items-center justify-center justify-self-center
                        w-full max-w-64 min-h-13
                        px-4 py-3
                        rounded-[0.85rem]
                        origin-center
                        border border-solid
                        text-foreground font-bold tracking-[0.01em] text-center
                        focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2
                      "
    >
      {t("downloadCv")}
    </a>
  );
};

export default DownloadCV;
