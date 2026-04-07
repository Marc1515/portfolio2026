import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { HomeSection } from "@/components/sections/HomeSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { TechnologiesSection } from "@/components/sections/TechnologiesSection";

export default function Home() {
  return (
    <>
      <MobileNav />
      <Header />
      <main>
        <HomeSection />
        <ProjectsSection />
        <ExperienceSection />
        <TechnologiesSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
