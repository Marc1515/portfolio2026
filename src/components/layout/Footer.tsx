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
    <footer className="w-full border-t border-(--surface-border)">
      <div className="max-w-6xl! mx-auto! px-(--space-2)! py-(--space-4)! flex flex-col items-center! text-center gap-(--space-2)! md:flex-row md:justify-between!">
        <div className="md:justify-self-start w-full md:w-auto hover:text-(--accent)">
          <a
            href="/MEQ_ESP.pdf"
            download
            className={clsx(
              footerLinkClass,
              "inline-flex items-center gap-1.5",
            )}
          >
            <span aria-hidden className="text-(--accent) hover:text-(--accent)">
              ↓
            </span>
            {tHome("downloadCv")}
          </a>
        </div>

        <p className="text-sm text-(--muted) md:justify-self-center md:self-center md:px-(--space-2)">
          {new Date().getFullYear()} {siteConfig.name}.{" "}
          {tLayout("footerRights")}
        </p>

        <div className="w-full md:w-auto md:justify-self-end md:text-right hover:text-(--accent)">
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
