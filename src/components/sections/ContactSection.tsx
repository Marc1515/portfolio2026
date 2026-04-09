import { ContactMethod } from "@/components/features/contact/ContactMethod";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Section } from "@/components/ui/Section";
import { contactMethods } from "@/data/contact";
import { SECTION_IDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

export function ContactSection() {
  const t = useTranslations("contact");

  return (
    <Section
      id={SECTION_IDS.contact}
      title={t("title")}
      subtitle={t("subtitle")}
      className="section"
    >
      <ul className="stack grid">
        {contactMethods.map((method, index) => (
          <RevealOnScroll as="li" key={method.id} delayMs={160 + index * 90}>
            <ContactMethod method={method} />
          </RevealOnScroll>
        ))}
      </ul>
    </Section>
  );
}
