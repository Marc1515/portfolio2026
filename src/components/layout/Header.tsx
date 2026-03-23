import { siteConfig } from "@/data/site";

export function Header() {
  return (
    <header className="site-header">
      <nav aria-label="Primary" className="site-nav">
        <a href={`#${siteConfig.navigation[0]?.id}`} className="brand">
          {siteConfig.name}
        </a>
        <ul className="nav-list">
          {siteConfig.navigation.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
