import Image from "next/image";

import { Section } from "@/components/ui/Section";
import { SECTION_IDS } from "@/lib/constants";
import { siteConfig } from "@/data/site";

export function HomeSection() {
  return (
    <Section id={SECTION_IDS.home} className="section hero">
      <div className="hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">{siteConfig.role}</p>
          <h1>{siteConfig.name}</h1>
          <p className="lead">{siteConfig.tagline}</p>
          <p className="muted">{siteConfig.location}</p>
        </div>

        <div className="hero-profile">
          <Image
            src="/images/home/fotoPerfil.png"
            alt={`Foto de perfil de ${siteConfig.name}`}
            width={256}
            height={256}
            priority
            sizes="(max-width: 768px) 60vw, 25vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>
    </Section>
  );
}
