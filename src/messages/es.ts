const es = {
  metadata: {
    title: "Portfolio 2026",
    description: "Portfolio personal moderno creado con Next.js y TypeScript.",
  },
  common: {
    languageSwitchAriaLabel: "Cambiar idioma entre español e inglés",
  },
  layout: {
    primaryNav: "Principal",
    menuToggle: "Abrir o cerrar menú de navegación",
    socialLinksLabel: "Redes sociales",
    footerRights: "Todos los derechos reservados.",
    nav: {
      home: "Inicio",
      projects: "Proyectos",
      experience: "Experiencia",
      skills: "Habilidades",
      technologies: "Tecnologías",
      about: "Sobre mí",
      contact: "Contacto",
    },
  },
  home: {
    role: "Desarrollador Full Stack",
    tagline: "Construyendo experiencias web modernas y de alto rendimiento.",
    profileImageAlt: "Foto de perfil de {name}",
    downloadCv: "Descargar CV",
  },
  projects: {
    title: "Proyectos",
    subtitle: "Trabajos seleccionados con foco en calidad de producto y mantenibilidad.",
    previewAlt: "Vista previa de {title}",
    techStackAria: "Stack tecnológico de {title}",
    live: "Demo",
    repository: "Repositorio",
    items: {
      casetaMartiICarmeta: {
        title: "Sistema de Gestión de Reservas",
        description:
          "Plataforma full-stack de reservas para una casa rural, con flujo público para clientes y panel de administración de disponibilidad.",
      },
      trelloApp: {
        title: "Sistema estilo Trello",
        description:
          "Aplicación de gestión de tareas con tableros, listas, tarjetas y organización mediante drag and drop.",
      },
      guidedToursPlatform: {
        title: "Plataforma de Rutas Guiadas",
        description:
          "Plataforma full-stack para rutas guiadas, con buscador, página de detalle y confirmación de reserva.",
      },
    },
  },
  experience: {
    title: "Experiencia",
    subtitle: "Resumen de roles donde lancé y escalé productos frontend.",
    items: {
      delinternetTelecom: {
        role: "Desarrollador Web Full Stack",
        highlights: [
          "Diseñé herramientas internas e interfaces que permitieron a los empleados trabajar más rápido y con mayor precisión.",
          "Desarrollé aplicaciones principalmente con Next.js y React, contribuyendo también en un proyecto full-stack.",
          "Construí un flujo en QGIS con Python que permitió al equipo de ingeniería identificar el número de viviendas de un municipio con un solo clic, pasando de horas de trabajo manual a segundos.",
          "Lideré las pruebas de una aplicación de megafonía, ayudando a mejorar la fiabilidad y la calidad del producto.",
        ],
      },
      inforturSoftware: {
        role: "Desarrollador Web Frontend",
        highlights: [
          "Desarrollé interfaces para sistemas de taquillas electrónicas usadas por huéspedes de hotel para recoger sus llaves tras completar una reserva.",
          "Trabajé con JavaScript vanilla y conecté funcionalidades frontend con servicios web backend.",
          "Inicié mi carrera como frontend junior, ganando experiencia real en interfaces listas para producción en proyectos de cliente.",
        ],
      },
    },
  },
  skills: {
    title: "Habilidades",
    subtitle:
      "Capacidades técnicas que aplico para construir productos mantenibles, escalables y bien ejecutados de principio a fin.",
    items: {
      frontendUi: {
        title: "Frontend e interfaz",
        caption: "Experiencias claras, rápidas y cuidadas",
        meta: "React · TypeScript · Next.js · CSS",
        highlights: [
          "Construcción de interfaces reutilizables con componentes bien organizados y flujo de datos claro.",
          "Layouts responsive, accesibilidad y atención al rendimiento percibido en experiencias reales de usuario.",
          "Trabajo con sistemas de diseño y evolución de interfaces sin perder consistencia ni mantenibilidad.",
        ],
      },
      backendApis: {
        title: "Backend y APIs",
        caption: "Servicios sólidos para producto real",
        meta: "REST · Node.js · Bases de datos",
        highlights: [
          "Diseño e integración de APIs con validación, manejo de errores y estructuras fáciles de mantener.",
          "Trabajo con lógica de negocio, autenticación, autorización e integraciones con servicios de terceros.",
          "Colaboración en modelos de datos y flujos backend con foco en claridad y fiabilidad.",
        ],
      },
      architectureQuality: {
        title: "Arquitectura y calidad",
        caption: "Código preparado para crecer",
        meta: "Clean · Hexagonal · Onion · DRY · KISS · YAGNI",
        highlights: [
          "Buenos conocimientos de arquitecturas como Clean, Hexagonal y Onion, aplicadas según el contexto del proyecto.",
          "Comprensión de patrones de diseño como Factory, Singleton y otros enfoques orientados a mejorar orden, extensibilidad y reutilización.",
          "Aplicación de principios como DRY, KISS y YAGNI para mantener código simple, legible y sostenible.",
        ],
      },
      cicdDocker: {
        title: "CI/CD y Docker",
        caption: "Entrega fiable y entornos reproducibles",
        meta: "Pipelines · Docker · Git · Calidad en CI",
        highlights: [
          "Automatización de builds, comprobaciones y pruebas mediante pipelines de integración y entrega.",
          "Uso de Docker para reducir diferencias entre desarrollo, testing y despliegue.",
          "Buenas prácticas de Git, revisión de cambios y resolución de incidencias detectadas en CI.",
        ],
      },
      aiAssisted: {
        title: "Desarrollo asistido por IA",
        caption: "Más velocidad con criterio técnico",
        meta: "Claude Code · Sonnet · GPT · elección por tarea",
        highlights: [
          "Uso asistentes de IA para explorar soluciones, acelerar implementación y apoyar refactors o revisiones.",
          "Elijo la herramienta según la tarea, equilibrando contexto, capacidad, coste y calidad de respuesta.",
          "Mantengo validación, criterio técnico y buenas prácticas para que la IA sume sin comprometer el resultado.",
        ],
      },
    },
  },
  technologies: {
    title: "Tecnologías",
    subtitle: "Tecnologías que uso para construir productos robustos y escalables.",
    ariaListLabel: "Tecnologías",
    more: "Más",
    less: "Menos",
  },
  about: {
    title: "Sobre mí",
    subtitle: "La persona detrás de los proyectos.",
    paragraph1:
      "Hola, soy Marc, desarrollador web apasionado por la tecnología y por construir productos útiles y bien cuidados. Me gusta aprender de forma continua, mejorar mis habilidades y retarme con nuevas herramientas, ideas y problemas reales.",
    paragraph2:
      "Valoro mucho el trabajo en equipo y la colaboración. Trabajar con personas que comparten la misma pasión por la tecnología hace que cada proyecto llegue más lejos, y creo que los mejores productos se construyen con buena comunicación, ideas compartidas y compromiso real con la mejora continua.",
    paragraph3:
      "Fuera del desarrollo, el deporte tiene un papel importante en mi vida. Entreno en el gimnasio de lunes a viernes, combinando fuerza y cardio. Los fines de semana, siempre que puedo, hago senderismo con amigos, recorro rutas de montaña y disfruto de la naturaleza. Esa conexión con actividades al aire libre fue una de las ideas que me inspiró para crear DeltaRoutes.",
    paragraph4:
      "También me gusta pasar tiempo tocando la guitarra con mi padre. Aún soy principiante, pero me ayuda a desconectar de la rutina, mantener la creatividad y equilibrar mejor el trabajo con la vida personal.",
  },
  contact: {
    title: "Contacto",
    subtitle: "Conectemos para colaboraciones, proyectos freelance u oportunidades full-time.",
  },
};

export default es;