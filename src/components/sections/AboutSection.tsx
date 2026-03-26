import { Section } from "@/components/ui/Section";
import { SECTION_IDS } from "@/lib/constants";

export function AboutSection() {
  return (
    <Section
      id={SECTION_IDS.about}
      title="About Me"
      subtitle="The person behind the projects."
      className="section"
    >
      <div className="flex flex-col gap-8 max-w-[70ch] px-4! md:pl-6! leading-8 text-[var(--muted)]">
        <p>
          Hi, I’m Marc, a web developer passionate about technology and the
          process of building products that are both useful and well crafted. I
          enjoy learning continuously, refining my skills, and challenging
          myself with new tools, ideas, and real-world problems.
        </p>

        <p>
          I strongly value teamwork and collaboration. Working with people who
          share the same passion for technology pushes every project further,
          and I believe the best products are built through good communication,
          shared ideas, and a genuine commitment to improvement.
        </p>

        <p>
          Outside of development, sport plays an important role in my life. I
          train at the gym from Monday to Friday, combining weight training and
          cardio. On weekends, whenever I have the chance, I go hiking with
          friends, explore mountain routes, and enjoy nature. That connection
          with outdoor activities was one of the ideas that inspired me to
          create DeltaRoutes.
        </p>

        <p>
          I also like spending time playing guitar with my father. I am still a
          beginner, but it helps me disconnect from daily routines, stay
          creative, and maintain a healthy balance between work and personal
          life.
        </p>
      </div>
    </Section>
  );
}
