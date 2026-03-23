import { ContactMethod } from "@/components/features/contact/ContactMethod";
import { Section } from "@/components/ui/Section";
import { contactMethods } from "@/data/contact";
import { SECTION_IDS } from "@/lib/constants";

export function ContactSection() {
  return (
    <Section
      id={SECTION_IDS.contact}
      title="Contact"
      subtitle="Let's connect for collaborations, freelance work or full-time opportunities."
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
