import { siteConfig } from "@/data/site";
import { useTranslations } from "next-intl";
import { MobileNav } from "./MobileNav";

export function Header() {
  const t = useTranslations("layout");

  return (
    <header className="site-header fixed! top-0 left-0 right-0 z-50">
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
        <MobileNav />
      </nav>
    </header>
  );
}
