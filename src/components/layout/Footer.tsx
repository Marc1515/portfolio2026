import { siteConfig } from "@/data/site";
import { SECTION_IDS } from "@/lib/constants";
import { useTranslations } from "next-intl";
import clsx from "clsx";

const footerLinkClass =
  "text-sm font-medium text-(--muted) transition-colors duration-300 ease-in-out hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2 rounded-sm";

export function Footer() {
  const tLayout = useTranslations("layout");
  const tHome = useTranslations("home");

  return (
    <footer className="mt-auto border-t border-(--surface-border) w-full">
      <div className="container py-(--space-4)! flex flex-col gap-(--space-4) items-center! text-center md:grid md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-(--space-3) md:text-left">
        <div className="md:justify-self-start w-full md:w-auto">
          <a
            href="/MEQ_ESP.pdf"
            download
            className={clsx(
              footerLinkClass,
              "inline-flex items-center gap-1.5",
            )}
          >
            <span aria-hidden className="text-(--accent)">
              ↓
            </span>
            {tHome("downloadCv")}
          </a>
        </div>

        <p className="text-sm text-(--muted) md:justify-self-center md:self-center md:px-(--space-2)">
          {new Date().getFullYear()} {siteConfig.name}.{" "}
          {tLayout("footerRights")}
        </p>

        <div className="w-full md:w-auto md:justify-self-end md:text-right">
          <a
            href={`#${SECTION_IDS.home}`}
            className={clsx(
              footerLinkClass,
              "inline-flex items-center gap-1.5",
            )}
          >
            <span aria-hidden className="text-(--accent)">
              ↑
            </span>
            {tLayout("footerBackToTop")}
          </a>
        </div>
      </div>
    </footer>
  );
}
