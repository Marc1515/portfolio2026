"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Section } from "@/components/ui/Section";
import { DesktopTechnologiesList } from "@/components/features/technologies/DesktopTechnologiesList";
import MobileTechnologiesList from "@/components/features/technologies/MobileTechnologiesList";
import { SECTION_IDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

export function TechnologiesSection() {
  const t = useTranslations("technologies");

  return (
    <Section
      id={SECTION_IDS.technologies}
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <DesktopTechnologiesList className="hidden! md:grid!" />
      <MobileTechnologiesList />
    </Section>
  );
}
