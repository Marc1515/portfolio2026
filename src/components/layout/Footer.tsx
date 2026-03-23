import { siteConfig } from "@/data/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <p>
        {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </p>
      <ul className="social-links" aria-label="Social links">
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
