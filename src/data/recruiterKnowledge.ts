import {
  trustedEvidenceSource,
  type LocalizedEvidenceText,
  type TrustedEvidenceSourceDefinition,
} from "@/data/chatEvidenceSources";
import type { ChatLocale } from "@/types/chat";

export type RecruiterKnowledgeCategory =
  | "summary"
  | "experience"
  | "project"
  | "commercial_skills"
  | "technologies"
  | "knowledge"
  | "testing"
  | "deployment"
  | "education"
  | "languages"
  | "availability"
  | "contact";

export type LocalizedKnowledgeText = LocalizedEvidenceText;
export type TrustedKnowledgeSource = TrustedEvidenceSourceDefinition;

export interface RecruiterKnowledgeEntry {
  id: string;
  category: RecruiterKnowledgeCategory;
  title: LocalizedKnowledgeText;
  content: LocalizedKnowledgeText;
  keywords: Record<ChatLocale, string[]>;
  aliases?: string[];
  sources: TrustedKnowledgeSource[];
  directContactOnly?: boolean;
}

const publicCv = trustedEvidenceSource("public-cv");

export const recruiterKnowledgeEntries = [
  {
    id: "summary-profile",
    category: "summary",
    title: { en: "Professional profile", es: "Perfil profesional" },
    content: {
      en: "Marc España is a Full Stack Web Developer based in Dublin. His public profile emphasizes frontend-heavy full-stack work, internal tools, booking systems, admin panels, maintainability, performance, practical problem-solving, and AI-assisted development workflows.",
      es: "Marc España es desarrollador web full stack y reside en Dublín. Su perfil público destaca el trabajo full stack con mayor peso en frontend, herramientas internas, sistemas de reservas, paneles de administración, mantenibilidad, rendimiento, resolución práctica de problemas y flujos de desarrollo asistidos por IA.",
    },
    keywords: {
      en: ["profile", "summary", "full stack", "frontend", "dublin"],
      es: ["perfil", "resumen", "full stack", "frontend", "dublín"],
    },
    aliases: ["marc españa", "marc espana"],
    sources: [trustedEvidenceSource("portfolio-about"), publicCv],
  },
  {
    id: "experience-delinternet",
    category: "experience",
    title: { en: "Delinternet Telecom", es: "Delinternet Telecom" },
    content: {
      en: "Full Stack Web Developer, 2024–2026. Marc designed internal tools and interfaces, developed applications mainly with Next.js and React, contributed to full-stack functionality and REST API integrations, built a QGIS and Python workflow that reduced a housing-unit identification task from hours to seconds, and led testing for a public address system application.",
      es: "Desarrollador Web Full Stack, 2024–2026. Marc diseñó herramientas internas e interfaces, desarrolló aplicaciones principalmente con Next.js y React, contribuyó en funcionalidades full stack e integraciones con APIs REST, construyó un flujo con QGIS y Python que redujo de horas a segundos una tarea para identificar viviendas y lideró las pruebas de una aplicación de megafonía.",
    },
    keywords: {
      en: [
        "delinternet",
        "commercial experience",
        "next.js",
        "react",
        "rest api",
        "qgis",
        "python",
        "testing",
        "internal tools",
      ],
      es: [
        "delinternet",
        "experiencia comercial",
        "next.js",
        "react",
        "api rest",
        "qgis",
        "python",
        "pruebas",
        "herramientas internas",
      ],
    },
    aliases: ["delinternet telecom"],
    sources: [trustedEvidenceSource("portfolio-experience"), publicCv],
  },
  {
    id: "experience-infortur",
    category: "experience",
    title: {
      en: "Infortur Software / KeyPoint",
      es: "Infortur Software / KeyPoint",
    },
    content: {
      en: "Frontend Web Developer, 2021–2022. Marc built responsive client-facing interfaces with HTML, CSS, and JavaScript, developed interfaces for electronic hotel key-locker systems, connected frontend features to backend web services, and improved existing UI components.",
      es: "Desarrollador Web Frontend, 2021–2022. Marc construyó interfaces responsive para clientes con HTML, CSS y JavaScript, desarrolló interfaces para sistemas de taquillas electrónicas de llaves de hotel, conectó funcionalidades frontend con servicios web backend y mejoró componentes de interfaz.",
    },
    keywords: {
      en: [
        "infortur",
        "keypoint",
        "commercial experience",
        "frontend",
        "javascript",
        "html",
        "css",
        "hotel",
        "lockers",
      ],
      es: [
        "infortur",
        "keypoint",
        "experiencia comercial",
        "frontend",
        "javascript",
        "html",
        "css",
        "hotel",
        "taquillas",
      ],
    },
    aliases: ["infortur software", "keypoint"],
    sources: [trustedEvidenceSource("portfolio-experience"), publicCv],
  },
  {
    id: "project-ai-code-review-trainer",
    category: "project",
    title: { en: "AI Code Review Trainer", es: "AI Code Review Trainer" },
    content: {
      en: "A full-stack educational app for practising code reviews with structured AI feedback, authentication, review history, rate limiting, internationalisation, and production monitoring. It treats submitted code as untrusted text, supports anonymous and authenticated use, uses Vitest and production quality checks, and deploys with GitHub Actions, Docker Compose, PostgreSQL, Prisma, Traefik, HTTPS, Sentry, and private-network Ollama. Technologies include Next.js, React, TypeScript, PostgreSQL, Prisma, Ollama, Vitest, Docker, GitHub Actions, Traefik, and Sentry.",
      es: "Aplicación educativa full stack para practicar revisiones de código con feedback estructurado de IA, autenticación, historial, rate limiting, internacionalización y monitorización. Trata el código como texto no confiable, permite uso anónimo y autenticado, utiliza Vitest y controles de calidad y despliega con GitHub Actions, Docker Compose, PostgreSQL, Prisma, Traefik, HTTPS, Sentry y Ollama en red privada. Incluye Next.js, React, TypeScript, PostgreSQL, Prisma, Ollama, Vitest, Docker, GitHub Actions, Traefik y Sentry.",
    },
    keywords: {
      en: [
        "ai code review trainer",
        "code review",
        "typescript",
        "postgresql",
        "ollama",
        "vitest",
        "docker",
        "github actions",
        "ci/cd",
        "testing",
      ],
      es: [
        "ai code review trainer",
        "revisión de código",
        "typescript",
        "postgresql",
        "ollama",
        "vitest",
        "docker",
        "github actions",
        "ci/cd",
        "pruebas",
      ],
    },
    aliases: ["code review trainer", "trainer"],
    sources: [
      trustedEvidenceSource("project-ai-code-review-trainer"),
      trustedEvidenceSource("repository-ai-code-review-trainer"),
      trustedEvidenceSource("live-ai-code-review-trainer"),
    ],
  },
  {
    id: "project-reservation-management",
    category: "project",
    title: {
      en: "Reservation Management System",
      es: "Sistema de Gestión de Reservas",
    },
    content: {
      en: "A bilingual full-stack rural-house booking platform with public availability and reservation requests plus an authenticated administration calendar. It uses Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth, Zod, and Vitest, with separated business-use-case and persistence mapping layers. Deployment uses GitHub Actions, Docker Compose, Prisma migrations, Traefik, HTTPS, and Sentry.",
      es: "Plataforma bilingüe full stack de reservas para una casa rural, con disponibilidad y solicitudes públicas y calendario de administración autenticado. Utiliza Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth, Zod y Vitest, con capas separadas de casos de uso y persistencia. Despliega con GitHub Actions, Docker Compose, migraciones Prisma, Traefik, HTTPS y Sentry.",
    },
    keywords: {
      en: [
        "reservation management",
        "booking",
        "typescript",
        "postgresql",
        "prisma",
        "nextauth",
        "vitest",
        "docker",
        "github actions",
        "testing",
      ],
      es: [
        "gestión de reservas",
        "reservas",
        "typescript",
        "postgresql",
        "prisma",
        "nextauth",
        "vitest",
        "docker",
        "github actions",
        "pruebas",
      ],
    },
    aliases: ["reservation system", "caseta martí i carmeta", "caseta"],
    sources: [
      trustedEvidenceSource("project-reservation-management"),
      trustedEvidenceSource("repository-reservation-management"),
      trustedEvidenceSource("live-reservation-management"),
    ],
  },
  {
    id: "project-delta-routes",
    category: "project",
    title: {
      en: "DeltaRoutes / Guided Tours Platform",
      es: "DeltaRoutes / Plataforma de Rutas Guiadas",
    },
    content: {
      en: "A full-stack guided outdoor-experience platform covering discovery, scheduled sessions, capacity, booking, Stripe payments and webhooks, waiting lists, transactional email, cancellations, refunds, and staff roles. It uses Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Stripe, Resend, React Email, Docker, and Traefik. Current checks use ESLint, TypeScript builds, and Prisma validation; the portfolio explicitly says it does not yet have an automated unit, integration, or end-to-end suite.",
      es: "Plataforma full stack de experiencias guiadas al aire libre con descubrimiento, sesiones, aforo, reservas, pagos y webhooks con Stripe, lista de espera, emails, cancelaciones, reembolsos y roles de personal. Utiliza Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Stripe, Resend, React Email, Docker y Traefik. Sus controles actuales son ESLint, builds con TypeScript y validación Prisma; el portfolio indica que todavía no tiene suite automatizada unitaria, de integración o end-to-end.",
    },
    keywords: {
      en: [
        "deltaroutes",
        "guided tours",
        "booking",
        "stripe",
        "typescript",
        "postgresql",
        "prisma",
        "docker",
        "payments",
      ],
      es: [
        "deltaroutes",
        "rutas guiadas",
        "reservas",
        "stripe",
        "typescript",
        "postgresql",
        "prisma",
        "docker",
        "pagos",
      ],
    },
    aliases: ["delta routes", "guided tours platform"],
    sources: [
      trustedEvidenceSource("project-delta-routes"),
      trustedEvidenceSource("repository-delta-routes"),
      trustedEvidenceSource("live-delta-routes"),
    ],
  },
  {
    id: "skills-commercial",
    category: "commercial_skills",
    title: {
      en: "Commercially demonstrated skills",
      es: "Habilidades demostradas comercialmente",
    },
    content: {
      en: "Published professional roles explicitly demonstrate Next.js, React, JavaScript, HTML, CSS, REST API integrations, backend web services, responsive interfaces, QGIS, Python, and application testing. Commercial experience must not be inferred from a technology appearing elsewhere in the portfolio.",
      es: "Los puestos profesionales publicados demuestran explícitamente Next.js, React, JavaScript, HTML, CSS, integraciones con APIs REST, servicios web backend, interfaces responsive, QGIS, Python y pruebas de aplicaciones. No se debe inferir experiencia comercial porque una tecnología aparezca en otra sección del portfolio.",
    },
    keywords: {
      en: ["commercial skills", "professional react", "professional next.js"],
      es: [
        "habilidades comerciales",
        "react profesional",
        "next.js profesional",
      ],
    },
    aliases: ["commercial experience", "experiencia comercial"],
    sources: [trustedEvidenceSource("portfolio-experience"), publicCv],
  },
  {
    id: "technologies-public",
    category: "technologies",
    title: {
      en: "Publicly listed technologies",
      es: "Tecnologías publicadas",
    },
    content: {
      en: "The Technologies section lists React, Next.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Shadcn, Node.js, NestJS, REST APIs, PostgreSQL, MySQL, MongoDB, Prisma, Python, QGIS, Git, GitHub, GitLab, Docker, Linux, GitHub Actions, Postman, Claude Code, and Codex. A listed technology indicates public knowledge or familiarity only unless a professional role or named project separately demonstrates its use.",
      es: "La sección Tecnologías enumera React, Next.js, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS, Shadcn, Node.js, NestJS, APIs REST, PostgreSQL, MySQL, MongoDB, Prisma, Python, QGIS, Git, GitHub, GitLab, Docker, Linux, GitHub Actions, Postman, Claude Code y Codex. Una tecnología enumerada indica conocimiento o familiaridad, salvo que un puesto profesional o proyecto demuestre su uso por separado.",
    },
    keywords: {
      en: [
        "technologies",
        "typescript",
        "nestjs",
        "node.js",
        "databases",
        "postgresql",
        "mysql",
        "mongodb",
      ],
      es: [
        "tecnologías",
        "typescript",
        "nestjs",
        "node.js",
        "bases de datos",
        "postgresql",
        "mysql",
        "mongodb",
      ],
    },
    aliases: ["tech stack", "stack tecnológico"],
    sources: [trustedEvidenceSource("portfolio-technologies"), publicCv],
  },
  {
    id: "knowledge-architecture",
    category: "knowledge",
    title: {
      en: "Self-described knowledge and architecture",
      es: "Conocimientos y arquitectura autodeclarados",
    },
    content: {
      en: "The public profile describes familiarity with validation, authentication, authorization, third-party integrations, database-backed flows, modular design, Clean, Hexagonal and Onion architecture, Factory and Singleton patterns, and DRY, KISS and YAGNI. These are knowledge areas, not expert-level or commercial-experience claims by themselves.",
      es: "El perfil público describe familiaridad con validación, autenticación, autorización, integraciones de terceros, flujos con bases de datos, diseño modular, arquitecturas Clean, Hexagonal y Onion, patrones Factory y Singleton, y DRY, KISS y YAGNI. Son áreas de conocimiento, no afirmaciones de nivel experto ni de experiencia comercial por sí solas.",
    },
    keywords: {
      en: [
        "architecture",
        "clean architecture",
        "hexagonal",
        "onion",
        "authentication",
        "authorization",
        "design patterns",
      ],
      es: [
        "arquitectura",
        "arquitectura limpia",
        "hexagonal",
        "onion",
        "autenticación",
        "autorización",
        "patrones de diseño",
      ],
    },
    sources: [trustedEvidenceSource("portfolio-skills")],
  },
  {
    id: "testing-quality",
    category: "testing",
    title: { en: "Testing and code quality", es: "Pruebas y calidad" },
    content: {
      en: "Marc's Delinternet role explicitly includes leading application testing. Automated tests, validation, linting, formatting, TypeScript checks, build checks, pre-commit checks, manual verification, and monitoring are demonstrated only by the personal projects that document them. AI Code Review Trainer and Reservation Management use Vitest. DeltaRoutes is explicitly documented as not yet having an automated unit, integration, or end-to-end suite.",
      es: "El puesto de Marc en Delinternet incluye explícitamente liderar pruebas de aplicaciones. Los tests automatizados, validación, linting, formato, comprobaciones de TypeScript y build, controles pre-commit, verificación manual y monitorización solo están demostrados por los proyectos personales que los documentan. AI Code Review Trainer y el Sistema de Reservas usan Vitest. DeltaRoutes aún no tiene suite automatizada unitaria, de integración o end-to-end.",
    },
    keywords: {
      en: ["testing", "tests", "quality", "vitest", "test suite", "qa"],
      es: ["pruebas", "tests", "calidad", "vitest", "suite de pruebas"],
    },
    aliases: ["quality assurance", "control de calidad"],
    sources: [
      trustedEvidenceSource("portfolio-experience"),
      trustedEvidenceSource("portfolio-projects"),
    ],
  },
  {
    id: "deployment-infrastructure",
    category: "deployment",
    title: {
      en: "Deployment and infrastructure",
      es: "Despliegue e infraestructura",
    },
    content: {
      en: "Selected personal projects demonstrate CI/CD pipelines, GitHub Actions, self-hosted runners, multi-stage Docker images, Docker Compose, persistent PostgreSQL services, Prisma migrations, Traefik reverse proxying, HTTPS/TLS, Linux, and Sentry. Deployment details are project-specific and must not be generalized to every project.",
      es: "Algunos proyectos personales demuestran pipelines CI/CD, GitHub Actions, runners self-hosted, imágenes Docker multi-stage, Docker Compose, PostgreSQL persistente, migraciones Prisma, reverse proxy con Traefik, HTTPS/TLS, Linux y Sentry. Los detalles dependen de cada proyecto y no deben generalizarse.",
    },
    keywords: {
      en: [
        "deployment",
        "deployments",
        "ci/cd",
        "github actions",
        "docker",
        "traefik",
        "infrastructure",
      ],
      es: [
        "despliegue",
        "despliegues",
        "ci/cd",
        "github actions",
        "docker",
        "traefik",
        "infraestructura",
      ],
    },
    sources: [trustedEvidenceSource("portfolio-projects")],
  },
  {
    id: "education-training",
    category: "education",
    title: { en: "Education and training", es: "Educación y formación" },
    content: {
      en: "Master's Degree in AI Development — in progress, 2026–present. English Language Training, EF Education First, Australia — 2024. Studies in Web Application Development (DAW) — 2020 and Systems and Network Administration (ASIR) — 2019; the public evidence does not establish completion of those diplomas.",
      es: "Máster en Desarrollo de IA — en curso, 2026–presente. Formación de inglés, EF Education First, Australia — 2024. Estudios en Desarrollo de Aplicaciones Web (DAW) — 2020 y Administración de Sistemas Informáticos en Red (ASIR) — 2019; la evidencia pública no acredita la finalización de esos títulos.",
    },
    keywords: {
      en: ["education", "training", "studies", "master", "daw", "asir"],
      es: ["educación", "formación", "estudios", "máster", "daw", "asir"],
    },
    sources: [publicCv],
  },
  {
    id: "languages",
    category: "languages",
    title: { en: "Languages", es: "Idiomas" },
    content: {
      en: "Spanish and Catalan are native languages. English is intermediate / B2 coursework, with strong reading and listening comprehension according to the public profile.",
      es: "Español y catalán son idiomas nativos. El inglés es intermedio / formación B2, con buena comprensión lectora y auditiva según el perfil público.",
    },
    keywords: {
      en: ["languages", "english", "spanish", "catalan", "b2"],
      es: ["idiomas", "inglés", "español", "catalán", "b2"],
    },
    sources: [publicCv],
  },
  {
    id: "availability",
    category: "availability",
    title: {
      en: "Location and availability",
      es: "Ubicación y disponibilidad",
    },
    content: {
      en: "Marc is based in Dublin, Ireland. The current public CV explicitly states EU citizenship and eligibility to work in Ireland; this is reported from that document rather than inferred. Current availability and suitable role level should be confirmed directly with Marc.",
      es: "Marc reside en Dublín, Irlanda. El CV público actual indica expresamente ciudadanía de la UE y permiso para trabajar en Irlanda; se informa desde ese documento y no se infiere. La disponibilidad actual y el nivel de puesto adecuado deben confirmarse directamente con Marc.",
    },
    keywords: {
      en: ["availability", "location", "dublin", "ireland", "work eligibility"],
      es: [
        "disponibilidad",
        "ubicación",
        "dublín",
        "irlanda",
        "permiso de trabajo",
      ],
    },
    sources: [publicCv],
  },
  {
    id: "contact-professional",
    category: "contact",
    title: {
      en: "Professional contact options",
      es: "Opciones de contacto profesional",
    },
    content: {
      en: "Preferred professional contact options: email meq.1515@gmail.com, LinkedIn https://www.linkedin.com/in/marc-espa%C3%B1a-833924141/, GitHub https://github.com/Marc1515, and the public CV /Marc_Espana_CV_Full_Stack.pdf.",
      es: "Opciones preferidas de contacto profesional: email meq.1515@gmail.com, LinkedIn https://www.linkedin.com/in/marc-espa%C3%B1a-833924141/, GitHub https://github.com/Marc1515 y el CV público /Marc_Espana_CV_Full_Stack.pdf.",
    },
    keywords: {
      en: ["contact", "email", "linkedin", "github", "cv", "resume"],
      es: ["contacto", "email", "correo", "linkedin", "github", "cv"],
    },
    sources: [
      trustedEvidenceSource("contact-linkedin"),
      trustedEvidenceSource("contact-github"),
      publicCv,
      trustedEvidenceSource("portfolio-contact"),
    ],
  },
  {
    id: "contact-direct",
    category: "contact",
    title: { en: "Direct contact", es: "Contacto directo" },
    content: {
      en: "Phone and WhatsApp: +353 87 004 1006. Provide this only when the visitor explicitly asks for a phone number, WhatsApp, mobile number, or direct contact.",
      es: "Teléfono y WhatsApp: +353 87 004 1006. Proporcionar solo cuando el visitante pida expresamente teléfono, WhatsApp, número de móvil o contacto directo.",
    },
    keywords: {
      en: ["phone", "telephone", "mobile", "whatsapp", "direct number"],
      es: ["teléfono", "móvil", "whatsapp", "número", "contacto directo"],
    },
    aliases: ["phone number", "número de teléfono"],
    sources: [trustedEvidenceSource("contact-whatsapp")],
    directContactOnly: true,
  },
] satisfies RecruiterKnowledgeEntry[];
