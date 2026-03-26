import { siteConfig } from "@/data/site";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("layout");

  return (
    <footer className="site-footer">
      <p>
        {new Date().getFullYear()} {siteConfig.name}. {t("footerRights")}
      </p>
      <ul className="social-links" aria-label={t("socialLinksLabel")}>
        {siteConfig.socialLinks.map((link) => (
          <li key={link.href}>
            <a href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
