import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { HomeSection } from "@/components/sections/HomeSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HomeSection />
        <ProjectsSection />
        <ExperienceSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
