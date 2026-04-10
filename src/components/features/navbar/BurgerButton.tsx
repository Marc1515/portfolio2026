import clsx from "clsx";
import { useTranslations } from "next-intl";

type BurgerButtonProps = {
  open: boolean;
  onToggle: () => void;
};

const BurgerButton = ({ open, onToggle }: BurgerButtonProps) => {
  const t = useTranslations("layout");

  return (
    <button
      className="fixed top-4 right-4 z-110 flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-[5px] border-0 bg-transparent p-2 md:hidden"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={t("menuToggle")}
    >
      <span
        className={clsx(
          "block h-[2px] w-6 origin-center rounded-[2px] bg-foreground transform-gpu transition-all duration-350 ease-[cubic-bezier(0.77,0,0.18,1)]",
          open ? "translate-y-[7px] rotate-45" : "",
        )}
      />
      <span
        className={clsx(
          "block h-[2px] w-6 origin-center rounded-[2px] bg-foreground transform-gpu transition-all duration-350 ease-[cubic-bezier(0.77,0,0.18,1)]",
          open ? "opacity-0" : "",
        )}
      />
      <span
        className={clsx(
          "block h-[2px] w-6 origin-center rounded-[2px] bg-foreground transform-gpu transition-all duration-350 ease-[cubic-bezier(0.77,0,0.18,1)]",
          open ? "-translate-y-[7px] -rotate-45" : "",
        )}
      />
    </button>
  );
};

export default BurgerButton;
