"use client";

import { useEffect } from "react";

/**
 * Detects when an in-app browser (Instagram, Facebook, etc.) applies a
 * text-zoom factor via Android WebSettings.setTextZoom() and compensates
 * by scaling the root font-size down so rem-based sizes render at the
 * same physical size as in a normal browser.
 */
export function TextZoomNormalize() {
  useEffect(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;font-size:100px;";
    document.body.appendChild(probe);
    const rendered = parseFloat(getComputedStyle(probe).fontSize);
    document.body.removeChild(probe);

    const zoom = rendered / 100;
    if (zoom !== 1) {
      document.documentElement.style.fontSize = `${100 / zoom}%`;
    }
  }, []);

  return null;
}
