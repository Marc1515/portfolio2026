import { siteConfig } from "@/data/site";
import { useTranslations } from "next-intl";

export function Header() {
  const t = useTranslations("layout");

  return (
    <header className="site-header">
      <nav aria-label={t("primaryNav")} className="site-nav">
        <a href={`#${siteConfig.navigation[0]?.id}`} className="brand">
          {siteConfig.name}
        </a>
        <ul className="nav-list">
          {siteConfig.navigation.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{t(`nav.${item.id}`)}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
