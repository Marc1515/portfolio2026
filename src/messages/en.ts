const en = {
  metadata: {
    title: "Portfolio 2026",
    description: "Modern personal portfolio built with Next.js and TypeScript.",
  },
  common: {
    languageSwitchAriaLabel: "Switch language between Spanish and English",
  },
  chat: {
    launcherLabel: "Open Marc's professional assistant",
    panelTitle: "Marc's professional assistant",
    panelDescription: "Verified answers for recruiters and potential clients.",
    assistantBadge: "Portfolio AI",
    greeting:
      "Hi! Ask me about Marc's experience, projects, technical skills, or how his verified profile fits a role.",
    suggestedQuestions: [
      "What professional React experience does Marc have?",
      "Tell me about the AI Code Review Trainer.",
      "What testing experience does Marc demonstrate?",
      "How does Marc compare with this job description?",
      "How can I contact Marc?",
    ],
    suggestionsLabel: "Suggested recruiter questions",
    inputLabel: "Message Marc's professional assistant",
    inputPlaceholder: "Ask about Marc or paste a job description…",
    sendLabel: "Send",
    closeLabel: "Close professional assistant",
    clearLabel: "Clear conversation",
    loading: "Reviewing Marc's verified profile…",
    longRequestNotice:
      "This is a detailed request. Generating a thorough answer may take a little longer than usual.",
    characterCounter: "{count}/{max} characters",
    emptyInput: "Enter a question before sending.",
    emptyConversation:
      "Start with a question about Marc's professional profile.",
    evidenceLabel: "Relevant evidence",
    genericApiError: "Your question could not be answered right now.",
    providerUnavailableError:
      "I couldn't reach the professional assistant right now.",
    assistantGenerationError:
      "I couldn't generate this answer right now. Your message is still here, so you can try again in a moment.",
    rateLimitedError: "You have sent several questions in a short time.",
    invalidRequestError:
      "This message could not be submitted. Review it and try again.",
    jobDescriptionTooLongError:
      "This job description is too long for a reliable comparison. Please keep it under 2,500 characters and focus on the main responsibilities, requirements and technologies.",
    requestRejectedError:
      "This request was rejected by the site's security configuration.",
    internalError: "Something unexpected prevented this answer.",
    retryGuidance: "Please try again in a moment.",
    retryLabel: "Try again",
    rateLimitRetryGuidance: "Please try again in about {seconds} seconds.",
    userMessageLabel: "Your message",
    assistantMessageLabel: "Marc's professional assistant",
  },
  layout: {
    primaryNav: "Primary",
    menuToggle: "Toggle navigation menu",
    socialLinksLabel: "Social links",
    footerRights: "All rights reserved.",
    footerBackToTop: "Back to top",
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
    viewDetails: "View details",
    viewDetailsAria: "View details for {title}",
    live: "Live",
    repository: "Repository",
    modal: {
      closeAria: "Close project details",
      carousel: {
        regionAria: "{title} image gallery",
        previousAria: "Show the previous image of {title}",
        nextAria: "Show the next image of {title}",
        indicatorAria: "Show image {index} of {total} for {title}",
        imageAlt: "{title} – image {index} of {total}",
      },
      sections: {
        overview: "Overview",
        keyFeatures: "Key features",
        testing: "Testing and quality",
        deployment: "Automated deployment",
        technologies: "Technologies",
      },
    },
    items: {
      aiCodeReviewTrainer: {
        title: "AI Code Review Trainer",
        description:
          "Full-stack app for practising code reviews with AI feedback, authentication, rate limiting, and a reliable deployment workflow.",
        details: {
          overview: [
            "AI Code Review Trainer is a full-stack educational application created to help developers practise technical code reviews. Users paste a code snippet, choose a review focus, and receive structured mentor-style feedback that explains why each issue matters, prioritises findings, and suggests concrete improvements.",
            "The available review focuses include general review, clean code, bugs, security, performance, architecture, and testing.",
          ],
          keyFeatures: [
            "Submitted code is treated as untrusted text and is never executed, evaluated, or compiled.",
            "Anonymous visitors can use the reviewer without creating an account.",
            "Users who sign in with GitHub or Google can save and revisit their review history.",
            "AI analysis runs server-side through a local Ollama instance, so users do not need an external API key.",
            "The current local model is based on Qwen Coder.",
            "The application includes validation, authentication, persistence, rate limiting, internationalisation, theme settings, review history, and error monitoring.",
            "The interface is available in English and Spanish.",
            "Sentry is used for production error monitoring.",
          ],
          testing: [
            "The project combines automated Vitest tests with ESLint, Prettier, TypeScript type checking, and production-build validation. Husky and lint-staged run quality checks on staged files before commits.",
            "Changes are additionally verified manually across English and Spanish routes, light and dark themes, responsive layouts, keyboard interactions, and the main authenticated and anonymous user flows.",
          ],
          deployment: [
            "Deployment is automated with GitHub Actions running on a self-hosted runner inside the VPS. A push to dev deploys the development environment, while a push to main deploys production. The workflow synchronises the corresponding branch and rebuilds and recreates the application through Docker Compose.",
            "The PostgreSQL database runs as a persistent service and is not recreated during normal application deployments. Prisma migrations run automatically when the application container starts. Traefik handles reverse-proxy routing, HTTPS, and TLS certificates. Ollama communicates with the application through the private Docker network and is not publicly exposed.",
          ],
        },
      },
      casetaMartiICarmeta: {
        title: "Reservation Management System",
        description:
          "Full-stack booking platform for a rural house, featuring a public reservation flow and an admin panel for availability management.",
        details: {
          overview: [
            "Reservation Management System is a full-stack booking platform built for a rural house. Guests use a public calendar to check availability and request a stay, while authenticated staff work in a dedicated administration calendar to create, update, and remove reservations.",
            "The application separates the public and administrative experiences while keeping both connected to the same PostgreSQL data model through Prisma. Its interface is available in English and Spanish and is designed to work clearly across desktop and mobile screens.",
          ],
          keyFeatures: [
            "A public availability calendar gives guests a clear view of existing reservations before they submit a request.",
            "A dedicated administration calendar supports creating, editing, and deleting reservations from one workspace.",
            "NextAuth and the Prisma adapter protect administrative functionality, with separate administrator and viewer roles.",
            "React Hook Form and Zod provide structured form handling and validation for reservation data.",
            "React Big Calendar and date-fns power the public and administrative calendar experiences.",
            "The application uses explicit reservation use cases and persistence mappers to keep business logic separated from HTTP handlers and database access.",
            "The interface is localised in English and Spanish, and Sentry provides production error monitoring.",
          ],
          testing: [
            "The project uses Vitest for automated coverage of reservation creation, updates and deletion, request handlers, payload validation, persistence and calendar mappers, public-calendar utilities, administrator authorisation, authentication callbacks, structured data, and public-site helpers.",
            "ESLint, TypeScript and production-build validation provide additional quality checks. The test configuration isolates each test with automatic mock clearing and restoration to reduce state leakage between cases.",
          ],
          deployment: [
            "GitHub Actions automates deployments through a self-hosted runner. A push to dev rebuilds the development environment, while a push to main rebuilds production. A separate repository rule ensures that pull requests targeting main originate from dev.",
            "Each environment is built with a multi-stage Docker image and recreated through its own Docker Compose configuration. Prisma migrations run automatically when the application container starts, and Traefik handles routing, HTTPS redirects, and TLS certificates for the development and production domains.",
          ],
        },
      },
      guidedToursPlatform: {
        title: "Guided Tours Platform",
        description:
          "Full-stack platform for guided tours, with search, detailed routes, booking confirmation, and a clear experience from discovery to reservation.",
        details: {
          overview: [
            "DeltaRoutes is a full-stack platform for discovering and booking guided outdoor experiences, including cycling, kayaking, walking tours, and mini cruises. Visitors can explore published activities, compare their duration, difficulty, location, and available languages, and complete the journey from discovery to reservation in one consistent interface.",
            "The booking domain handles scheduled sessions, capacity, adult and minor pricing, temporary holds, waiting lists, payments, transactional emails, cancellations, and refunds. PostgreSQL and Prisma keep those states connected throughout the reservation lifecycle.",
          ],
          keyFeatures: [
            "Published experiences include route information, duration, difficulty, location, imagery, and supported languages.",
            "Scheduled sessions define start and end times, meeting points, map links, booking cut-offs, capacity, seats per guide, and separate adult and minor prices.",
            "Customers can reserve without creating an account, while temporary holds prevent the same capacity from being sold twice during checkout.",
            "When a session is full, customers can join a waiting list and later claim newly available places through a controlled reservation flow.",
            "Stripe Checkout and webhooks coordinate payments, confirmations, payment status, cancellations, and refunds.",
            "Resend and React Email deliver reservation-created, waiting-list, payment-confirmed, availability, and contact-form messages, with idempotency fields that prevent duplicate transactional emails.",
            "The data model supports administrator, guide, and staff roles, guide language profiles, and guide assignment to reservations.",
            "Responsive booking and checkout screens keep the flow clear across desktop and mobile devices.",
          ],
          testing: [
            "Quality checks currently rely on ESLint, TypeScript validation during the Next.js production build, and Prisma schema and migration validation. The repository does not yet include an automated unit, integration, or end-to-end test suite.",
            "Dedicated database utilities support operational verification by listing sessions and reservations, inspecting database counts and session details, creating future sessions, and cleaning up or force-expiring temporary holds.",
          ],
          deployment: [
            "Production is packaged with a multi-stage Node.js Docker build. The image installs dependencies, generates the Prisma client, validates the Next.js production build, and automatically applies pending database migrations before starting the application.",
            "Docker Compose orchestrates the application and PostgreSQL, waits for the database health check, persists its data, and keeps both services restartable. Traefik routes the public domain over HTTPS and manages TLS certificates through Let's Encrypt. The repository does not currently define a push-triggered GitHub Actions deployment workflow.",
          ],
        },
      },
    },
  },
  experience: {
    title: "Experience",
    subtitle:
      "Highlights from roles where I shipped and scaled frontend products.",
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
    more: "More",
    less: "Less",
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
    subtitle:
      "Let's connect for collaborations, freelance work or full-time opportunities.",
  },
};

export default en;
