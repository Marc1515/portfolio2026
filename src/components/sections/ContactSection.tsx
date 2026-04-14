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
    >
      <ul className="grid grid-cols-1 md:grid-cols-3! gap-(--space-2)!">
        {contactMethods.map((method, index) => (
          <RevealOnScroll as="li" key={method.id} delayMs={160 + index * 90}>
            <ContactMethod
              method={{
                id: method.id,
                label: method.label,
                href: method.href,
                type: method.type,
              }}
            />
          </RevealOnScroll>
        ))}
      </ul>
    </Section>
  );
}
