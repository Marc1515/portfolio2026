/**
 * Touch devices and in-app browsers (e.g. Instagram) often struggle with
 * animated CSS filter blur; skip it for smoother ScrollTrigger behavior.
 */
export function isCheapRevealMotionPreferred(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(hover: none)").matches;
}
