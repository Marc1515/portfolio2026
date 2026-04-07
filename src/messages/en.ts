const en = {
  metadata: {
    title: "Portfolio 2026",
    description: "Modern personal portfolio built with Next.js and TypeScript.",
  },
  common: {
    languageSwitchAriaLabel: "Switch language between Spanish and English",
  },
  layout: {
    primaryNav: "Primary",
    menuToggle: "Toggle navigation menu",
    socialLinksLabel: "Social links",
    footerRights: "All rights reserved.",
    nav: {
      home: "Home",
      projects: "Projects",
      experience: "Experience",
      skills: "Skills",
      technologies: "Technologies",
      about: "About Me",
      contact: "Contact",
    },
  },
  home: {
    role: "Full Stack Developer",
    tagline: "Building modern, performant web experiences.",
    profileImageAlt: "Profile picture of {name}",
    downloadCv: "Download CV",
  },
  projects: {
    title: "Projects",
    subtitle: "Selected work focused on product quality and maintainability.",
    previewAlt: "{title} preview",
    techStackAria: "{title} tech stack",
    live: "Live",
    repository: "Repository",
    items: {
      casetaMartiICarmeta: {
        title: "Reservation Management System",
        description:
          "Full-stack booking platform for a rural house, featuring a public reservation flow and an admin panel for availability management.",
      },
      trelloApp: {
        title: "Trello System",
        description:
          "Trello-style task management app with boards, lists, cards and drag-and-drop organization.",
      },
      guidedToursPlatform: {
        title: "Guided Tours Platform",
        description:
          "Full-stack platform for guided tours, including search, details page and confirmation.",
      },
    },
  },
  experience: {
    title: "Experience",
    subtitle: "Highlights from roles where I shipped and scaled frontend products.",
    items: {
      delinternetTelecom: {
        role: "Full Stack Web Developer",
        highlights: [
          "Designed internal tools and interfaces that enabled employees to work faster and with greater precision.",
          "Developed applications mainly with Next.js and React, while also contributing to a full-stack project.",
          "Built a QGIS workflow with Python that allowed the engineering team to identify the number of housing units in a town with a single click, turning a manual process that took hours into a task completed in seconds.",
          "Led the testing efforts for a public address system application, helping improve reliability and product quality.",
        ],
      },
      inforturSoftware: {
        role: "Frontend Web Developer",
        highlights: [
          "Developed user interfaces for electronic locker systems used by hotel guests to retrieve their room keys after completing a reservation.",
          "Worked with vanilla JavaScript and connected frontend features to backend web services.",
          "Began my career as a junior frontend developer, gaining practical experience building production-ready interfaces for client projects.",
        ],
      },
    },
  },
  skills: {
    title: "Skills",
    subtitle:
      "Technical capabilities I apply to build maintainable, scalable, and well-executed products from end to end.",
    items: {
      frontendUi: {
        title: "Frontend & UI",
        caption: "Clear, fast, and polished experiences",
        meta: "React · TypeScript · Next.js · CSS",
        highlights: [
          "Building reusable interfaces with well-organized components and a clear data flow.",
          "Responsive layouts, accessibility, and attention to perceived performance in real user experiences.",
          "Working with design systems and evolving interfaces without losing consistency or maintainability.",
        ],
      },
      backendApis: {
        title: "Backend & APIs",
        caption: "Reliable services for real products",
        meta: "REST · Node.js · Databases",
        highlights: [
          "Designing and integrating APIs with validation, error handling, and structures that are easy to maintain.",
          "Working with business logic, authentication, authorization, and third-party service integrations.",
          "Collaborating on data models and backend flows with a focus on clarity and reliability.",
        ],
      },
      architectureQuality: {
        title: "Architecture & Code Quality",
        caption: "Code built to grow",
        meta: "Clean · Hexagonal · Onion · DRY · KISS · YAGNI",
        highlights: [
          "Strong understanding of software architectures such as Clean, Hexagonal, and Onion, applied according to project context.",
          "Understanding of design patterns such as Factory, Singleton, and other approaches that improve structure, extensibility, and reuse.",
          "Applying principles such as DRY, KISS, and YAGNI to keep code simple, readable, and sustainable.",
        ],
      },
      cicdDocker: {
        title: "CI/CD & Docker",
        caption: "Reliable delivery and reproducible environments",
        meta: "Pipelines · Docker · Git · CI Quality",
        highlights: [
          "Automating builds, checks, and tests through integration and delivery pipelines.",
          "Using Docker to reduce differences between development, testing, and deployment environments.",
          "Applying solid Git practices, reviewing changes, and resolving issues detected in CI.",
        ],
      },
      aiAssisted: {
        title: "AI-Assisted Development",
        caption: "More speed with technical judgment",
        meta: "Claude Code · Sonnet · GPT · tool selection by task",
        highlights: [
          "Using AI assistants to explore solutions, accelerate implementation, and support refactors or code reviews.",
          "Choosing the right tool for each task by balancing context, capability, cost, and response quality.",
          "Maintaining validation, technical judgment, and good practices so AI adds speed without compromising the final result.",
        ],
      },
    },
  },
  technologies: {
    title: "Technologies",
    subtitle: "Technologies I use to build robust and scalable products.",
    ariaListLabel: "Technologies",
  },
  about: {
    title: "About Me",
    subtitle: "The person behind the projects.",
    paragraph1:
      "Hi, I'm Marc, a web developer passionate about technology and the process of building products that are both useful and well crafted. I enjoy learning continuously, refining my skills, and challenging myself with new tools, ideas, and real-world problems.",
    paragraph2:
      "I strongly value teamwork and collaboration. Working with people who share the same passion for technology pushes every project further, and I believe the best products are built through good communication, shared ideas, and a genuine commitment to improvement.",
    paragraph3:
      "Outside of development, sport plays an important role in my life. I train at the gym from Monday to Friday, combining weight training and cardio. On weekends, whenever I have the chance, I go hiking with friends, explore mountain routes, and enjoy nature. That connection with outdoor activities was one of the ideas that inspired me to create DeltaRoutes.",
    paragraph4:
      "I also like spending time playing guitar with my father. I am still a beginner, but it helps me disconnect from daily routines, stay creative, and maintain a healthy balance between work and personal life.",
  },
  contact: {
    title: "Contact",
    subtitle: "Let's connect for collaborations, freelance work or full-time opportunities.",
  },
};

export default en;
