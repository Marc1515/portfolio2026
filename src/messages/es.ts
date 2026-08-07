const es = {
  metadata: {
    title: "Portfolio 2026",
    description: "Portfolio personal moderno creado con Next.js y TypeScript.",
  },
  common: {
    languageSwitchAriaLabel: "Cambiar idioma entre español e inglés",
  },
  chat: {
    launcherLabel: "Abrir el asistente profesional de Marc",
    panelTitle: "Asistente profesional de Marc",
    panelDescription:
      "Respuestas verificadas para recruiters y posibles clientes.",
    assistantBadge: "IA del portfolio",
    greeting:
      "¡Hola! Pregúntame por la experiencia, los proyectos y las habilidades técnicas de Marc, o por cómo encaja su perfil verificado en un puesto.",
    suggestedQuestions: [
      "¿Qué experiencia profesional tiene Marc con React?",
      "Háblame de AI Code Review Trainer.",
      "¿Qué experiencia demuestra Marc con pruebas?",
      "¿Cómo encaja Marc con esta oferta de empleo?",
      "¿Cómo puedo contactar con Marc?",
    ],
    suggestionsLabel: "Preguntas sugeridas para recruiters",
    inputLabel: "Mensaje para el asistente profesional de Marc",
    inputPlaceholder: "Pregunta sobre Marc o pega una oferta de empleo…",
    sendLabel: "Enviar",
    closeLabel: "Cerrar el asistente profesional",
    clearLabel: "Borrar conversación",
    loading: "Consultando el perfil verificado de Marc…",
    characterCounter: "{count}/{max} caracteres",
    emptyInput: "Escribe una pregunta antes de enviarla.",
    emptyConversation:
      "Empieza con una pregunta sobre el perfil profesional de Marc.",
    evidenceLabel: "Evidencias relacionadas",
    genericApiError: "No se ha podido responder a tu pregunta ahora mismo.",
    providerUnavailableError:
      "El asistente profesional no está disponible temporalmente.",
    assistantBusyError: "El asistente profesional está ocupado ahora mismo.",
    rateLimitedError: "Has enviado varias preguntas en poco tiempo.",
    requestRejectedError:
      "La configuración de seguridad del sitio ha rechazado esta solicitud.",
    retryGuidance:
      "Inténtalo de nuevo en unos instantes o contacta directamente con Marc.",
    rateLimitRetryGuidance:
      "Inténtalo de nuevo dentro de unos {seconds} segundos.",
    userMessageLabel: "Tu mensaje",
    assistantMessageLabel: "Asistente profesional de Marc",
  },
  layout: {
    primaryNav: "Principal",
    menuToggle: "Abrir o cerrar menú de navegación",
    socialLinksLabel: "Redes sociales",
    footerRights: "Todos los derechos reservados.",
    footerBackToTop: "Subir arriba",
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
    subtitle:
      "Trabajos seleccionados con foco en calidad de producto y mantenibilidad.",
    previewAlt: "Vista previa de {title}",
    techStackAria: "Stack tecnológico de {title}",
    viewDetails: "Ver detalles",
    viewDetailsAria: "Ver detalles de {title}",
    live: "Demo",
    repository: "Repositorio",
    modal: {
      closeAria: "Cerrar detalles del proyecto",
      carousel: {
        regionAria: "Galería de imágenes de {title}",
        previousAria: "Mostrar la imagen anterior de {title}",
        nextAria: "Mostrar la imagen siguiente de {title}",
        indicatorAria: "Mostrar la imagen {index} de {total} de {title}",
        imageAlt: "{title} – imagen {index} de {total}",
      },
      sections: {
        overview: "Resumen",
        keyFeatures: "Funcionalidades principales",
        testing: "Testing y calidad",
        deployment: "Despliegue automatizado",
        technologies: "Tecnologías",
      },
    },
    items: {
      aiCodeReviewTrainer: {
        title: "AI Code Review Trainer",
        description:
          "Aplicación full-stack para practicar revisiones de código con IA, autenticación, rate limiting y un flujo de despliegue fiable.",
        details: {
          overview: [
            "AI Code Review Trainer es una aplicación educativa full-stack creada para ayudar a otros desarrolladores a practicar revisiones técnicas de código. El usuario pega un fragmento, elige el enfoque de la revisión y recibe feedback estructurado con un estilo similar al de un mentor, explicando por qué importa cada problema, priorizando los hallazgos y proponiendo mejoras concretas.",
            "Los enfoques disponibles incluyen revisión general, clean code, bugs, seguridad, rendimiento, arquitectura y testing.",
          ],
          keyFeatures: [
            "El código enviado se trata como texto no confiable y nunca se ejecuta, evalúa ni compila.",
            "Los visitantes pueden utilizar el revisor de forma anónima.",
            "Los usuarios que inician sesión con GitHub o Google pueden guardar y consultar su historial de revisiones.",
            "El análisis con IA se realiza en el servidor mediante una instancia local de Ollama, sin necesidad de que el usuario proporcione una API key.",
            "El modelo local actual está basado en Qwen Coder.",
            "La aplicación incluye validación, autenticación, persistencia, rate limiting, internacionalización, configuración de temas, historial de revisiones y monitorización de errores.",
            "La interfaz está disponible en español e inglés.",
            "Sentry se utiliza para monitorizar errores en producción.",
          ],
          testing: [
            "El proyecto combina pruebas automatizadas con Vitest y controles de calidad mediante ESLint, Prettier, comprobación de tipos con TypeScript y validación del build de producción. Husky y lint-staged ejecutan comprobaciones sobre los archivos preparados antes de crear un commit.",
            "Los cambios también se revisan manualmente en español e inglés, en los temas claro y oscuro, en diferentes tamaños de pantalla, mediante navegación por teclado y en los principales flujos anónimos y autenticados.",
          ],
          deployment: [
            "El despliegue está automatizado con GitHub Actions mediante un runner self-hosted instalado en el VPS. Un push a dev despliega el entorno de desarrollo y un push a main despliega producción. El workflow sincroniza la rama correspondiente y reconstruye y recrea la aplicación mediante Docker Compose.",
            "PostgreSQL funciona como un servicio persistente y no se vuelve a crear durante los despliegues normales de la aplicación. Las migraciones de Prisma se ejecutan automáticamente al iniciar el contenedor. Traefik gestiona el reverse proxy, el enrutamiento, HTTPS y los certificados TLS. Ollama se comunica con la aplicación a través de la red Docker privada y no está expuesto públicamente.",
          ],
        },
      },
      casetaMartiICarmeta: {
        title: "Sistema de Gestion de Reservas",
        description:
          "Plataforma full-stack de reservas para una casa rural, con flujo publico para clientes y panel de administracion de disponibilidad.",
        details: {
          overview: [
            "Sistema de Gestión de Reservas es una plataforma full-stack creada para una casa rural. Los huéspedes consultan la disponibilidad y solicitan su estancia desde un calendario público, mientras el personal autenticado utiliza un calendario de administración específico para crear, actualizar y eliminar reservas.",
            "La aplicación separa claramente la experiencia pública de la administrativa, aunque ambas trabajan sobre el mismo modelo de datos PostgreSQL mediante Prisma. La interfaz está disponible en español e inglés y mantiene una experiencia clara tanto en escritorio como en móvil.",
          ],
          keyFeatures: [
            "Un calendario público de disponibilidad permite consultar las reservas existentes antes de enviar una solicitud.",
            "El calendario de administración permite crear, editar y eliminar reservas desde un único espacio de trabajo.",
            "NextAuth y su adaptador de Prisma protegen las funciones administrativas, con roles diferenciados de administrador y consulta.",
            "React Hook Form y Zod proporcionan una gestión estructurada de formularios y validación de los datos de reserva.",
            "React Big Calendar y date-fns sostienen las experiencias de calendario pública y administrativa.",
            "La aplicación utiliza casos de uso y mappers específicos para separar la lógica de negocio de los handlers HTTP y del acceso a la base de datos.",
            "La interfaz está localizada en español e inglés y Sentry permite monitorizar errores en producción.",
          ],
          testing: [
            "El proyecto utiliza Vitest para cubrir de forma automatizada la creación, actualización y eliminación de reservas, los handlers de las peticiones, la validación de payloads, los mappers de persistencia y calendario, las utilidades del calendario público, la autorización de administradores, los callbacks de autenticación, los datos estructurados y otras utilidades del sitio público.",
            "ESLint, TypeScript y la validación del build de producción aportan controles de calidad adicionales. La configuración de testing limpia y restaura los mocks automáticamente para reducir la filtración de estado entre casos.",
          ],
          deployment: [
            "GitHub Actions automatiza los despliegues mediante un runner self-hosted. Un push a dev reconstruye el entorno de desarrollo y un push a main reconstruye producción. Una regla adicional del repositorio exige que las pull requests dirigidas a main procedan de dev.",
            "Cada entorno se construye con una imagen Docker multi-stage y se recrea mediante su propia configuración de Docker Compose. Las migraciones de Prisma se ejecutan automáticamente al iniciar el contenedor, mientras Traefik gestiona el enrutamiento, las redirecciones a HTTPS y los certificados TLS de los dominios de desarrollo y producción.",
          ],
        },
      },
      guidedToursPlatform: {
        title: "Plataforma de Rutas Guiadas",
        description:
          "Plataforma full-stack para rutas guiadas, con buscador, detalles de cada ruta, confirmación de reserva y una experiencia clara de principio a fin.",
        details: {
          overview: [
            "DeltaRoutes es una plataforma full-stack para descubrir y reservar experiencias guiadas al aire libre, como rutas en bicicleta, kayak, senderismo y minicruceros. Los visitantes pueden explorar las actividades publicadas, comparar su duración, dificultad, ubicación e idiomas disponibles, y completar todo el recorrido desde el descubrimiento hasta la reserva en una interfaz coherente.",
            "El dominio de reservas gestiona sesiones programadas, aforo, precios para adultos y menores, bloqueos temporales de plazas, listas de espera, pagos, emails transaccionales, cancelaciones y reembolsos. PostgreSQL y Prisma mantienen conectados todos esos estados durante el ciclo de vida de la reserva.",
          ],
          keyFeatures: [
            "Las experiencias publicadas incluyen información de la ruta, duración, dificultad, ubicación, imágenes e idiomas disponibles.",
            "Las sesiones programadas definen horarios, punto de encuentro, enlace al mapa, cierre de reservas, capacidad, plazas por guía y precios diferenciados para adultos y menores.",
            "Los clientes pueden reservar sin crear una cuenta, mientras los bloqueos temporales evitan vender dos veces la misma capacidad durante el checkout.",
            "Cuando una sesión está completa, el cliente puede apuntarse a una lista de espera y reclamar más adelante las plazas que vuelvan a estar disponibles mediante un flujo controlado.",
            "Stripe Checkout y sus webhooks coordinan los pagos, confirmaciones, estados de pago, cancelaciones y reembolsos.",
            "Resend y React Email envían mensajes de reserva creada, lista de espera, pago confirmado, disponibilidad y formulario de contacto, con campos de idempotencia para evitar emails transaccionales duplicados.",
            "El modelo de datos contempla roles de administrador, guía y personal, perfiles de idiomas para los guías y su asignación a las reservas.",
            "Las pantallas responsive de reserva y checkout mantienen el flujo claro en escritorio y dispositivos móviles.",
          ],
          testing: [
            "Los controles de calidad actuales se apoyan en ESLint, la validación de TypeScript durante el build de producción de Next.js y la validación del esquema y las migraciones de Prisma. El repositorio todavía no incluye una suite automatizada de pruebas unitarias, de integración o end-to-end.",
            "Varias utilidades de base de datos facilitan la verificación operativa: permiten listar sesiones y reservas, consultar recuentos y detalles de una sesión, crear sesiones futuras y limpiar o forzar la expiración de bloqueos temporales.",
          ],
          deployment: [
            "La aplicación se empaqueta para producción mediante un build Docker multi-stage. La imagen instala las dependencias, genera el cliente de Prisma, valida el build de producción de Next.js y aplica automáticamente las migraciones pendientes antes de iniciar la aplicación.",
            "Docker Compose orquesta la aplicación y PostgreSQL, espera a que la base de datos supere su health check, conserva sus datos y mantiene ambos servicios reiniciables. Traefik publica el dominio mediante HTTPS y gestiona los certificados TLS con Let's Encrypt. Actualmente el repositorio no define un workflow de GitHub Actions que despliegue automáticamente con cada push.",
          ],
        },
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
    subtitle:
      "Tecnologías que uso para construir productos robustos y escalables.",
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
    subtitle:
      "Conectemos para colaboraciones, proyectos freelance u oportunidades full-time.",
  },
};

export default es;
