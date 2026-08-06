import { FiMessageCircle } from "react-icons/fi";

interface ChatLauncherProps {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  controlsId: string;
  isOpen: boolean;
  label: string;
  onClick: () => void;
}

export function ChatLauncher({
  buttonRef,
  controlsId,
  isOpen,
  label,
  onClick,
}: ChatLauncherProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={isOpen}
      aria-controls={controlsId}
      tabIndex={isOpen ? -1 : 0}
      className={`fixed right-4 z-80 inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent)_65%,var(--surface-border))] bg-[color-mix(in_srgb,var(--accent)_22%,var(--surface))] text-2xl text-(--foreground) shadow-[0_0.75rem_2rem_rgb(0_0_0/35%)] transition-[opacity,transform,background-color,border-color] duration-200 [bottom:max(1rem,env(safe-area-inset-bottom))] hover:-translate-y-0.5 hover:border-(--accent) hover:bg-[color-mix(in_srgb,var(--accent)_30%,var(--surface))] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--accent) motion-reduce:transform-none motion-reduce:transition-none sm:right-6 ${
        isOpen ? "pointer-events-none scale-95 opacity-0" : "opacity-100"
      }`}
    >
      <FiMessageCircle aria-hidden="true" />
    </button>
  );
}
