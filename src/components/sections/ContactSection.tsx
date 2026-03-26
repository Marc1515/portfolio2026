import { ContactMethod } from "@/components/features/contact/ContactMethod";
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
      <ul className="stack contact-list">
        {contactMethods.map((method) => (
          <ContactMethod key={method.id} method={method} />
        ))}
      </ul>
    </Section>
  );
}
