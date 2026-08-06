import { projects } from "@/data/projects";
import type { ChatLocale } from "@/types/chat";

interface KnowledgeProject {
  name: string;
  summary: string;
  demonstratedWork: string[];
  technologies: string[];
  repositoryUrl: string | null;
  liveUrl: string | null;
}

export interface RecruiterKnowledge {
  professionalSummary: string[];
  experience: Array<{
    company: string;
    role: string;
    dates: string;
    demonstratedWork: string[];
  }>;
  projects: KnowledgeProject[];
  capabilities: string[];
  testingAndQuality: string[];
  deploymentAndInfrastructure: string[];
  educationAndTraining: string[];
  languages: string[];
  locationAndAvailability: string[];
  publicContact: string[];
}

function projectLinks(id: string) {
  const project = projects.find((item) => item.id === id);

  return {
    repositoryUrl: project?.repoUrl ?? null,
    liveUrl: project?.liveUrl ?? null,
  };
}

const sharedLinks = {
  aiCodeReviewTrainer: projectLinks("ai-code-review-trainer"),
  reservationManagement: projectLinks("caseta-martiicarmeta"),
  deltaRoutes: projectLinks("guided-tours-platform"),
};

export const recruiterKnowledge = {
  en: {
    professionalSummary: [
      "Marc España is a Full Stack Web Developer based in Dublin who builds production-ready web applications with React, Next.js, TypeScript, Node.js, and REST APIs.",
      "His public profile emphasizes frontend-heavy full-stack work, internal tools, booking systems, admin panels, clean architecture, maintainability, performance, practical problem-solving, and AI-assisted development workflows.",
    ],
    experience: [
      {
        company: "Delinternet Telecom",
        role: "Full Stack Web Developer",
        dates: "2024–2026",
        demonstratedWork: [
          "Designed internal tools and interfaces that helped employees work faster and more precisely.",
          "Developed applications mainly with Next.js and React and also contributed to full-stack functionality and REST API integrations.",
          "Built a QGIS and Python workflow that reduced a housing-unit identification task from hours of manual work to seconds.",
          "Led testing for a public address system application, supporting reliability, edge-case handling, and product quality.",
        ],
      },
      {
        company: "Infortur Software S.L. / KeyPoint",
        role: "Frontend Web Developer",
        dates: "2021–2022",
        demonstratedWork: [
          "Built responsive client-facing interfaces with HTML, CSS, and JavaScript.",
          "Developed interfaces for electronic locker systems used by hotel guests to retrieve room keys after completing a reservation.",
          "Connected frontend features to backend web services and improved existing UI components.",
        ],
      },
    ],
    projects: [
      {
        name: "AI Code Review Trainer",
        summary:
          "A full-stack educational app for practising code reviews with structured AI feedback, authentication, review history, rate limiting, internationalisation, and production monitoring.",
        demonstratedWork: [
          "Treats submitted code as untrusted text and never executes it.",
          "Supports anonymous use plus GitHub and Google sign-in for saved history.",
          "Uses Vitest, ESLint, Prettier, TypeScript, production builds, Husky, lint-staged, and manual bilingual, responsive, theme, keyboard, and user-flow checks.",
          "Deploys development and production through GitHub Actions, a self-hosted runner, Docker Compose, PostgreSQL, Prisma migrations, Traefik, HTTPS, and private-network Ollama.",
        ],
        technologies: [
          "Next.js",
          "React",
          "TypeScript",
          "PostgreSQL",
          "Prisma",
          "Ollama",
          "Vitest",
          "Docker",
          "GitHub Actions",
          "Traefik",
          "Sentry",
        ],
        ...sharedLinks.aiCodeReviewTrainer,
      },
      {
        name: "Reservation Management System",
        summary:
          "A bilingual full-stack booking platform for a rural house with a public availability flow and an authenticated administration calendar.",
        demonstratedWork: [
          "Supports public availability, reservation requests, and administrator creation, editing, and deletion workflows.",
          "Uses NextAuth roles, React Hook Form, Zod, Prisma, PostgreSQL, and separated business-use-case and persistence mapping layers.",
          "Uses Vitest for reservation, handler, validation, mapper, authorization, authentication, and public-site behavior, plus ESLint, TypeScript, and production builds.",
          "Deploys development and production with GitHub Actions, Docker Compose, Prisma migrations, Traefik, HTTPS, and Sentry monitoring.",
        ],
        technologies: [
          "Next.js",
          "React",
          "TypeScript",
          "Tailwind CSS",
          "Prisma",
          "PostgreSQL",
          "NextAuth",
          "Zod",
          "Vitest",
          "Docker",
          "GitHub Actions",
          "Traefik",
          "Sentry",
        ],
        ...sharedLinks.reservationManagement,
      },
      {
        name: "DeltaRoutes / Guided Tours Platform",
        summary:
          "A full-stack guided outdoor-experience platform covering discovery, scheduled sessions, capacity, booking, payments, waiting lists, emails, cancellations, and refunds.",
        demonstratedWork: [
          "Supports guest checkout, temporary capacity holds, Stripe payments and webhooks, transactional email, and administrator, guide, and staff roles.",
          "Current quality checks use ESLint, TypeScript production builds, and Prisma validation; the portfolio explicitly states that it does not yet have an automated unit, integration, or end-to-end suite.",
          "Uses a multi-stage Docker build, Docker Compose, PostgreSQL health checks and persistence, automatic Prisma migrations, Traefik, HTTPS, and Let's Encrypt; no push-triggered GitHub Actions deployment is currently documented.",
        ],
        technologies: [
          "Next.js",
          "React",
          "TypeScript",
          "Tailwind CSS",
          "Prisma",
          "PostgreSQL",
          "Stripe",
          "Resend",
          "React Email",
          "Docker",
          "Traefik",
        ],
        ...sharedLinks.deltaRoutes,
      },
    ],
    capabilities: [
      "Frontend and UI: React, Next.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Shadcn, responsive layouts, accessibility, and design-system maintenance.",
      "Backend and APIs: Node.js, NestJS, REST APIs, validation, authentication, authorization, third-party integrations, and database-backed business flows.",
      "Data tools shown publicly: PostgreSQL, MySQL, MongoDB, Prisma, Python, and QGIS.",
      "Architecture and quality: Clean, Hexagonal, and Onion architecture; modular design; Factory and Singleton patterns; DRY, KISS, and YAGNI.",
      "Tools shown publicly: Git, GitHub, GitLab, Docker, Linux, GitHub Actions, Postman, Claude Code, Codex, and other AI-assisted development workflows. These entries demonstrate use or familiarity, not an expert-level claim.",
    ],
    testingAndQuality: [
      "Marc has led application testing professionally and applies automated tests, validation, linting, formatting, TypeScript checks, production-build checks, pre-commit checks, manual responsive and keyboard verification, and production error monitoring where documented per project.",
      "Testing maturity differs by project; DeltaRoutes is explicitly documented as not yet having an automated unit, integration, or end-to-end test suite.",
    ],
    deploymentAndInfrastructure: [
      "Demonstrated experience includes CI/CD pipelines, GitHub Actions, self-hosted runners, multi-stage Docker images, Docker Compose, persistent PostgreSQL services, Prisma migrations, Traefik reverse proxying, HTTPS/TLS certificates, Linux, and Sentry.",
      "Deployment details are project-specific and should not be generalized to every project.",
    ],
    educationAndTraining: [
      "Master's Degree in AI Development — in progress, 2026–present.",
      "English Language Training, EF Education First, Australia — 2024.",
      "Higher National Diploma in Web Application Development (DAW) — 2020.",
      "Higher National Diploma in Systems and Network Administration (ASIR) — 2019.",
    ],
    languages: [
      "Spanish: native.",
      "Catalan: native.",
      "English: intermediate / B2 coursework, with strong reading and listening comprehension; spoken English is improving through daily practice in Dublin.",
    ],
    locationAndAvailability: [
      "Based in Dublin, Ireland, and an EU citizen eligible to work in Ireland.",
      "The public CV states availability in Dublin for full-time web development, frontend, full-stack, junior-to-mid, and product-oriented engineering roles.",
    ],
    publicContact: [
      "Email: meq.1515@gmail.com",
      "Phone and WhatsApp: +353 87 004 1006",
      "LinkedIn: https://www.linkedin.com/in/marc-espa%C3%B1a-833924141/",
      "GitHub: https://github.com/Marc1515",
      "Instagram: https://www.instagram.com/marc_espp/",
      "Public CV: /Marc_Espana_CV_Full_Stack.pdf",
    ],
  },
  es: {
    professionalSummary: [
      "Marc España es desarrollador web full stack y reside en Dublín. Construye aplicaciones web listas para producción con React, Next.js, TypeScript, Node.js y APIs REST.",
      "Su perfil público destaca el trabajo full stack con mayor peso en frontend, herramientas internas, sistemas de reservas, paneles de administración, arquitectura limpia, mantenibilidad, rendimiento, resolución práctica de problemas y flujos de desarrollo asistidos por IA.",
    ],
    experience: [
      {
        company: "Delinternet Telecom",
        role: "Desarrollador Web Full Stack",
        dates: "2024–2026",
        demonstratedWork: [
          "Diseñó herramientas internas e interfaces que ayudaron a los empleados a trabajar con mayor rapidez y precisión.",
          "Desarrolló aplicaciones principalmente con Next.js y React y también contribuyó en funcionalidades full stack e integraciones con APIs REST.",
          "Construyó un flujo con QGIS y Python que redujo de horas a segundos una tarea manual para identificar viviendas.",
          "Lideró las pruebas de una aplicación de megafonía, contribuyendo a su fiabilidad, tratamiento de casos límite y calidad.",
        ],
      },
      {
        company: "Infortur Software S.L. / KeyPoint",
        role: "Desarrollador Web Frontend",
        dates: "2021–2022",
        demonstratedWork: [
          "Construyó interfaces responsive para clientes con HTML, CSS y JavaScript.",
          "Desarrolló interfaces para sistemas de taquillas electrónicas usados por huéspedes de hotel para recoger las llaves tras reservar.",
          "Conectó funcionalidades frontend con servicios web backend y mejoró componentes de interfaz existentes.",
        ],
      },
    ],
    projects: [
      {
        name: "AI Code Review Trainer",
        summary:
          "Aplicación educativa full stack para practicar revisiones de código con feedback estructurado de IA, autenticación, historial, rate limiting, internacionalización y monitorización en producción.",
        demonstratedWork: [
          "Trata el código enviado como texto no confiable y nunca lo ejecuta.",
          "Permite uso anónimo e inicio de sesión con GitHub y Google para guardar el historial.",
          "Utiliza Vitest, ESLint, Prettier, TypeScript, builds de producción, Husky, lint-staged y verificaciones manuales bilingües, responsive, de temas, teclado y flujos de usuario.",
          "Despliega desarrollo y producción con GitHub Actions, runner self-hosted, Docker Compose, PostgreSQL, migraciones Prisma, Traefik, HTTPS y Ollama en red privada.",
        ],
        technologies: [
          "Next.js",
          "React",
          "TypeScript",
          "PostgreSQL",
          "Prisma",
          "Ollama",
          "Vitest",
          "Docker",
          "GitHub Actions",
          "Traefik",
          "Sentry",
        ],
        ...sharedLinks.aiCodeReviewTrainer,
      },
      {
        name: "Sistema de Gestión de Reservas",
        summary:
          "Plataforma bilingüe full stack de reservas para una casa rural, con flujo público de disponibilidad y calendario de administración autenticado.",
        demonstratedWork: [
          "Incluye disponibilidad pública, solicitudes de reserva y flujos de creación, edición y eliminación para administración.",
          "Utiliza roles con NextAuth, React Hook Form, Zod, Prisma, PostgreSQL y capas separadas para casos de uso y mapeo de persistencia.",
          "Utiliza Vitest para reservas, handlers, validación, mappers, autorización, autenticación y comportamiento del sitio público, además de ESLint, TypeScript y builds de producción.",
          "Despliega desarrollo y producción con GitHub Actions, Docker Compose, migraciones Prisma, Traefik, HTTPS y monitorización con Sentry.",
        ],
        technologies: [
          "Next.js",
          "React",
          "TypeScript",
          "Tailwind CSS",
          "Prisma",
          "PostgreSQL",
          "NextAuth",
          "Zod",
          "Vitest",
          "Docker",
          "GitHub Actions",
          "Traefik",
          "Sentry",
        ],
        ...sharedLinks.reservationManagement,
      },
      {
        name: "DeltaRoutes / Plataforma de Rutas Guiadas",
        summary:
          "Plataforma full stack de experiencias guiadas al aire libre que abarca descubrimiento, sesiones, aforo, reservas, pagos, lista de espera, emails, cancelaciones y reembolsos.",
        demonstratedWork: [
          "Incluye reserva sin cuenta, bloqueos temporales de plazas, pagos y webhooks con Stripe, emails transaccionales y roles de administración, guía y personal.",
          "Sus controles actuales son ESLint, builds de producción con TypeScript y validación de Prisma; el portfolio indica expresamente que todavía no tiene suite automatizada de pruebas unitarias, de integración o end-to-end.",
          "Utiliza build Docker multi-stage, Docker Compose, health checks y persistencia de PostgreSQL, migraciones automáticas de Prisma, Traefik, HTTPS y Let's Encrypt; actualmente no se documenta un despliegue con GitHub Actions activado por push.",
        ],
        technologies: [
          "Next.js",
          "React",
          "TypeScript",
          "Tailwind CSS",
          "Prisma",
          "PostgreSQL",
          "Stripe",
          "Resend",
          "React Email",
          "Docker",
          "Traefik",
        ],
        ...sharedLinks.deltaRoutes,
      },
    ],
    capabilities: [
      "Frontend e interfaz: React, Next.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Shadcn, layouts responsive, accesibilidad y mantenimiento de sistemas de diseño.",
      "Backend y APIs: Node.js, NestJS, APIs REST, validación, autenticación, autorización, integraciones de terceros y flujos de negocio con base de datos.",
      "Herramientas de datos mostradas públicamente: PostgreSQL, MySQL, MongoDB, Prisma, Python y QGIS.",
      "Arquitectura y calidad: arquitectura Clean, Hexagonal y Onion; diseño modular; patrones Factory y Singleton; DRY, KISS y YAGNI.",
      "Herramientas mostradas públicamente: Git, GitHub, GitLab, Docker, Linux, GitHub Actions, Postman, Claude Code, Codex y otros flujos asistidos por IA. Estas menciones demuestran uso o familiaridad, no un nivel experto.",
    ],
    testingAndQuality: [
      "Marc ha liderado pruebas de aplicaciones profesionalmente y aplica tests automatizados, validación, linting, formato, comprobación de TypeScript, builds de producción, controles pre-commit, verificación manual responsive y por teclado y monitorización de errores cuando está documentado en cada proyecto.",
      "La madurez de testing depende del proyecto; se documenta expresamente que DeltaRoutes aún no tiene una suite automatizada unitaria, de integración o end-to-end.",
    ],
    deploymentAndInfrastructure: [
      "La experiencia demostrada incluye pipelines CI/CD, GitHub Actions, runners self-hosted, imágenes Docker multi-stage, Docker Compose, PostgreSQL persistente, migraciones Prisma, reverse proxy con Traefik, certificados HTTPS/TLS, Linux y Sentry.",
      "Los detalles de despliegue dependen de cada proyecto y no deben generalizarse a todos.",
    ],
    educationAndTraining: [
      "Máster en Desarrollo de IA — en curso, 2026–presente.",
      "Formación de inglés, EF Education First, Australia — 2024.",
      "Ciclo Formativo de Grado Superior en Desarrollo de Aplicaciones Web (DAW) — 2020.",
      "Ciclo Formativo de Grado Superior en Administración de Sistemas Informáticos en Red (ASIR) — 2019.",
    ],
    languages: [
      "Español: nativo.",
      "Catalán: nativo.",
      "Inglés: intermedio / formación B2, con buena comprensión lectora y auditiva; mejora la expresión oral mediante práctica diaria en Dublín.",
    ],
    locationAndAvailability: [
      "Reside en Dublín, Irlanda, y es ciudadano de la UE con permiso para trabajar en Irlanda.",
      "El CV público indica disponibilidad en Dublín para puestos full-time de desarrollo web, frontend, full stack, junior-mid y orientados a producto.",
    ],
    publicContact: [
      "Email: meq.1515@gmail.com",
      "Teléfono y WhatsApp: +353 87 004 1006",
      "LinkedIn: https://www.linkedin.com/in/marc-espa%C3%B1a-833924141/",
      "GitHub: https://github.com/Marc1515",
      "Instagram: https://www.instagram.com/marc_espp/",
      "CV público: /Marc_Espana_CV_Full_Stack.pdf",
    ],
  },
} satisfies Record<ChatLocale, RecruiterKnowledge>;
