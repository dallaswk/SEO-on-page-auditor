export type TaskStatus = "pending" | "pass" | "fail" | "na";

export interface TaskAction {
  label: string;
  url?: string;
  icon?: string;
  type?: "link" | "auto";
  handlerId?: string;
}

export type TaskInputType = "number" | "text" | "date" | "textarea";

export interface TaskInput {
  id: string;
  label: string;
  type: TaskInputType;
  value?: string | number;
  placeholder?: string;
  helperLink?: string;
  helperText?: string;
}

export interface AuditTask {
  id: string;
  title: string;
  tool: string;
  whatToCheck: string;
  guide?: string;
  status: TaskStatus;
  notes: string;
  actions?: TaskAction[];
  inputs?: TaskInput[];
  images?: string[];
}

export interface AuditSection {
  id: string;
  number: number;
  title: string;
  tasks: AuditTask[];
}

export interface AuditProject {
  domain: string;
  auditor: string;
  startDate: string;
  endDate: string;
  psiApiKey?: string;
  scrapedData?: Record<string, string>;
  sections: AuditSection[];
}

export const defaultChecklist: AuditSection[] = [
  {
    id: "paginas-indexadas",
    number: 1,
    title: "Páginas Indexadas",
    tasks: [
      {
        id: "1-1",
        title: "Comprobar nº de URLs indexadas",
        tool: "Google Search Console / site:dominio.com",
        whatToCheck: "¿El número es coherente con el tamaño real del sitio?",
        guide:
          "<b>1.</b> Ve a la pestaña <b>Páginas</b> en Google Search Console y anota el número de URLs indexadas.<br/><b>2.</b> Busca en Google <code>site:tudominio.com</code> y anota el número de resultados.<br/><b>3.</b> Si la diferencia es muy grande o si es mucho mayor/menor a las páginas reales que has creado, hay un problema de indexación o contenido basura.",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Google Search Console",
            url: "https://search.google.com/search-console",
            icon: "ExternalLink",
          },
          {
            label: "Ver site:{{domain}}",
            url: "https://www.google.com/search?q=site:{{domain}}",
            icon: "Search",
          },
        ],
        inputs: [
          {
            id: "urls_gsc",
            label: "URLs en GSC",
            type: "number",
            placeholder: "Ej: 1540",
          },
          {
            id: "urls_site",
            label: "URLs en Google (site:)",
            type: "number",
            placeholder: "Ej: 1450",
          },
        ],
      },
      {
        id: "1-2",
        title: "Rastrear el dominio con herramienta técnica",
        tool: "Screaming Frog / Ahrefs / Sitebulb",
        whatToCheck:
          "¿Cuántas URLs válidas (2xx) hay? ¿Hay ruido de indexación?",
        guide:
          "<b>1.</b> Abre Screaming Frog y pon la URL de tu inicio.<br/><b>2.</b> Espera a que termine al 100%.<br/><b>3.</b> Ve a la pestaña superior <b>Internal > HTML</b> y filtra por <code>Status Code = 200</code>.<br/><b>4.</b> Revisa si el total de páginas rastreables coincide con lo esperado o si hay URLs dinámicas extrañas.",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Abrir Screaming Frog",
            url: "screamingfrog:",
            icon: "Zap",
          },
        ],
      },
      {
        id: "1-3",
        title: "Detectar páginas indexadas no deseadas",
        tool: "Google Search Console → Cobertura",
        whatToCheck:
          "Buscar 404s, páginas staging, duplicados, thin content indexado",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Escáner de Basura (Auto)",
            type: "auto",
            handlerId: "detectJunk",
            icon: "Search",
          },
          {
            label: "Buscar Staging/Test",
            url: "https://www.google.com/search?q=site:{{domain}}+inurl:stage+OR+inurl:test+OR+inurl:dev",
            icon: "ExternalLink",
          },
          {
            label: "Buscar PDFs",
            url: "https://www.google.com/search?q=site:{{domain}}+filetype:pdf",
            icon: "ExternalLink",
          },
          {
            label: "GSC: URLs Excluidas",
            url: "https://search.google.com/search-console/index",
            icon: "Layout",
          },
        ],
      },
    ],
  },
  {
    id: "sitemap-xml",
    number: 2,
    title: "Sitemap XML",
    tasks: [
      {
        id: "2-1",
        title: "Verificar existencia y accesibilidad del sitemap",
        tool: "Browser / Google Search Console",
        whatToCheck:
          "¿Está en /sitemap.xml o /sitemap_index.xml? ¿Responde 200?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Probar /sitemap.xml",
            type: "auto",
            handlerId: "fetchSitemap",
            url: "/sitemap.xml",
            icon: "Zap",
          },
          {
            label: "Probar /sitemap_index.xml",
            type: "auto",
            handlerId: "fetchSitemap",
            url: "/sitemap_index.xml",
            icon: "Zap",
          },
        ],
      },
      {
        id: "2-2",
        title: "Revisar estructura del sitemap index",
        tool: "Screaming Frog → Sitemaps / XML Viewer",
        whatToCheck:
          "¿Hay sitemaps por tipo de contenido? ¿Están todos activos?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Analizar Sitemap XML guardado",
            type: "auto",
            handlerId: "checkSitemapStructure",
            icon: "Search",
          },
        ],
      },
      {
        id: "2-3",
        title: "Comprobar URLs dentro de cada sitemap",
        tool: "Google Search Console",
        whatToCheck: "¿Contienen URLs 301, 404 o noindex? Eliminarlas.",
        guide:
          "<b>1.</b> Entra en tu propiedad de <b>Google Search Console</b> y ve a <b>Páginas</b>.<br/><b>2.</b> Arriba en los filtros, haz clic en <i>Todas las páginas enviadas</i> y cámbialo a <i>Solo páginas enviadas en sitemaps</i> (o los sitemaps concretos).<br/><b>3.</b> Revisa la zona inferior: ¿Por qué no se indexan las páginas?.<br/><b>4.</b> Aquí verás si hay 404s, exclusiones por robots o redirecciones 301 que todavía están metidas en tu sitemap. Míralas y sácalas desde tu CMS.",
        status: "pending",
        notes: "",
      },
      {
        id: "2-4",
        title: "Añadir sitemap de imágenes/vídeos si procede",
        tool: "Yoast SEO / RankMath / Plugin CMS",
        whatToCheck:
          "¿Hay contenido multimedia relevante sin sitemap específico?",
        guide:
          "<b>1.</b> Solo es necesario si eres un medio, e-commerce o portal donde la imagen/vídeo trae tráfico de Image Search.<br/><b>2.</b> Ve a tu plugin SEO (RankMath, Yoast) y busca la configuración de <b>Sitemaps</b>.<br/><b>3.</b> Asegúrate de tener activada la inclusión de imágenes. Para vídeos, suele requerir un Add-on.",
        status: "pending",
        notes: "",
      },
      {
        id: "2-5",
        title: "Enviar sitemaps a Search Console",
        tool: "Google Search Console → Sitemaps",
        whatToCheck: "¿Están enviados y sin errores? ¿Fecha de última lectura?",
        guide:
          "<b>1.</b> Ve a Google Search Console > Sitemaps (en el menú lateral izquierdo).<br/><b>2.</b> Pega la terminación de tu sitemap (ej: <code>sitemap.xml</code> o <code>sitemap_index.xml</code>) y pulsa Enviar.<br/><b>3.</b> Verifica en la tabla inferior que el estado dice <b>Correcto</b> y la fecha de última lectura es reciente.",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "GSC Sitemaps",
            url: "https://search.google.com/search-console/sitemaps",
            icon: "ExternalLink",
          },
        ],
      },
    ],
  },
  {
    id: "robots-txt",
    number: 3,
    title: "Robots.txt y Meta Robots",
    tasks: [
      {
        id: "3-1",
        title: "Verificar robots.txt accesible y sin bloqueos críticos",
        tool: "Browser (/robots.txt) / Screaming Frog",
        whatToCheck: "¿Bloquea CSS, JS, imágenes o páginas necesarias?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Probar /robots.txt",
            type: "auto",
            handlerId: "fetchRobots",
            url: "/robots.txt",
            icon: "Zap",
          },
          {
            label: "Ver /robots.txt",
            url: "https://{{domain}}/robots.txt",
            icon: "Globe",
          },
        ],
      },
      {
        id: "3-2",
        title: "Comprobar que el Sitemap apunta a HTTPS",
        tool: "Editar robots.txt manualmente",
        whatToCheck: "La directiva Sitemap: debe usar https://",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Analizar Sitemap en Robots",
            type: "auto",
            handlerId: "checkRobotsSitemap",
            icon: "Search",
          },
        ],
      },
      {
        id: "3-3",
        title: "Revisar reglas Disallow para admin WordPress",
        tool: "robots.txt manual",
        whatToCheck: "Añadir /wp-admin/, /wp-login.php, /cgi-bin/",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Buscar reglas WP Admin",
            type: "auto",
            handlerId: "checkWPAdminRobots",
            icon: "Zap",
          },
        ],
      },
      {
        id: "3-4",
        title: "Auditar meta robots por página",
        tool: "Screaming Frog → Directivas / noindex",
        whatToCheck:
          "¿Hay páginas importantes con noindex o nofollow accidentales?",
        guide:
          "<b>1.</b> Rastrear la web con Screaming Frog. Ve a la pestaña <b>Directives</b>.<br/><b>2.</b> Filtra por <code>noindex</code> o <code>nofollow</code>.<br/><b>3.</b> Revisa la lista de URLs para asegurar que no hayas bloqueado accidentalmente páginas de producto o artículos importantes.",
        status: "pending",
        notes: "",
      },
    ],
  },
  {
    id: "paginadores",
    number: 4,
    title: "Paginadores",
    tasks: [
      {
        id: "4-1",
        title: "Comprobar funcionamiento de paginación",
        tool: "Browser / Screaming Frog",
        whatToCheck:
          "¿Los enlaces /page/2/, /page/3/ son rastreables y accesibles?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Probar /page/2/",
            type: "auto",
            handlerId: "checkPaginationAccess",
            url: "/page/2/",
            icon: "Zap",
          },
        ],
      },
      {
        id: "4-2",
        title: "Revisar si la paginación está bloqueada en robots.txt",
        tool: "robots.txt + Screaming Frog",
        whatToCheck: "¿Alguna regla Disallow afecta a /page/?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Analizar bloqueos en Robots",
            type: "auto",
            handlerId: "checkRobotsPagination",
            icon: "Search",
          },
        ],
      },
      {
        id: "4-3",
        title: "Implementar rel=next / rel=prev en listados largos",
        tool: "Código fuente / Yoast / RankMath",
        whatToCheck: "Listados con >3 páginas deberían tener estas etiquetas",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Buscar rel=next/prev",
            type: "auto",
            handlerId: "checkRelNextPrev",
            icon: "Zap",
          },
        ],
        inputs: [
          {
            id: "pagination_url",
            label: "URL específica (opcional)",
            type: "text",
            placeholder: "Ej: /blog o /tienda",
          },
        ],
      },
      {
        id: "4-4",
        title: "Consistencia de URLs de paginación en HTTPS",
        tool: "Screaming Frog → Filtro por URL",
        whatToCheck:
          "¿Todas las páginas paginadas usan HTTPS y estructura uniforme?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Validar HTTPS en Paginación",
            type: "auto",
            handlerId: "checkPaginationHTTPS",
            icon: "ShieldCheck",
          },
        ],
        inputs: [
          {
            id: "pagination_url_4_4",
            label: "URL específica (opcional)",
            type: "text",
            placeholder: "Ej: /blog o /shop",
          },
        ],
      },
    ],
  },
  {
    id: "canonicals",
    number: 5,
    title: "Etiquetas Canonical",
    tasks: [
      {
        id: "5-1",
        title: "Verificar canonical autodeclarado en todas las páginas",
        tool: "Screaming Frog → Canonical / Ahrefs",
        whatToCheck:
          "¿Todas las páginas indexables tienen su canonical correcto?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Analizar Canonical",
            type: "auto",
            handlerId: "checkCanonical",
            icon: "Zap",
          },
        ],
        inputs: [
          {
            id: "canonical_url_5_1",
            label: "URL específica (opcional)",
            type: "text",
            placeholder: "Ej: /blog/entrada-1",
          },
        ],
      },
      {
        id: "5-2",
        title: "Detectar canonicals apuntando a HTTP o dominio distinto",
        tool: "Screaming Frog → Filtro Canonical",
        whatToCheck:
          "Deben apuntar siempre a la versión HTTPS del mismo dominio",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Analizar Protocolo/Dominio",
            type: "auto",
            handlerId: "checkCanonical",
            icon: "ShieldCheck",
          },
        ],
      },
      {
        id: "5-3",
        title: "Revisar páginas con 301 que tienen canonical activo",
        tool: "Screaming Frog → Status + Canonical",
        whatToCheck: "Las páginas redirigidas no deben tener canonical propio",
        guide:
          "<b>1.</b> En Screaming Frog, ve a <b>Response Codes</b> y filtra por <code>Redirection (3xx)</code>.<br/><b>2.</b> Desplázate a la derecha horizontalmente hasta la columna <b>Canonical Link Element 1</b>.<br/><b>3.</b> Si una página que redirige (301) tiene además canonical, entra al CMS y elimina el canonical de esa página origen para evitar conflictos.",
        status: "pending",
        notes: "",
      },
      {
        id: "5-4",
        title: "Gestionar duplicados con canonical (filtros, parámetros)",
        tool: "Google Search Console / Screaming Frog",
        whatToCheck:
          "¿Hay variantes de URL por parámetros? Consolidar con canonical",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Probar Parámetro Fake",
            type: "auto",
            handlerId: "checkCanonicalParams",
            icon: "Zap",
          },
        ],
        inputs: [
          {
            id: "canonical_url_5_4",
            label: "URL para testear",
            type: "text",
            placeholder: "Ej: /tienda",
          },
        ],
      },
    ],
  },
  {
    id: "redirecciones",
    number: 6,
    title: "Redirecciones Internas",
    tasks: [
      {
        id: "6-1",
        title: "Rastrear todas las redirecciones 3xx internas",
        tool: "Screaming Frog → Filtro 3xx",
        whatToCheck: "¿Cuántas hay? ¿Son 301 o 302?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Analizar Enlaces Internos",
            type: "auto",
            handlerId: "checkInternalRedirects",
            icon: "Search",
          },
        ],
        inputs: [
          {
            id: "redirects_url_6_1",
            label: "URL para escanear enlaces",
            type: "text",
            placeholder: "Ej: /blog o /tienda",
          },
        ],
      },
      {
        id: "6-2",
        title: "Identificar cadenas y bucles de redirección",
        tool: "Screaming Frog → Redirect Chains",
        whatToCheck: "Cada salto adicional consume crawl budget",
        guide:
          "<b>1.</b> En Screaming Frog, ve al menú superior <b>Reports > Redirects > Redirect Chains</b>.<br/><b>2.</b> Exporta el archivo CSV/Excel.<br/><b>3.</b> Analiza las cadenas A -> B -> C.<br/><b>4.</b> Edita tu servidor (.htaccess o plugins CMS) para que A apunte directamente a C.",
        status: "pending",
        notes: "",
      },
      {
        id: "6-3",
        title: "Actualizar enlaces internos que apuntan a URLs redirigidas",
        tool: "Screaming Frog → Inlinks sobre 301s",
        whatToCheck: "Sustituirlos por la URL final directa",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Detectar Enlaces a 301s",
            type: "auto",
            handlerId: "checkInternalRedirects",
            icon: "Zap",
          },
        ],
      },
      {
        id: "6-4",
        title: "Revisar plantillas generadoras de redirecciones sistemáticas",
        tool: "CMS / Dev",
        whatToCheck:
          "¿Alguna categoría o tipo de contenido genera 301s masivos?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Test Redirecciones Globales",
            type: "auto",
            handlerId: "checkGlobalRedirects",
            icon: "ShieldCheck",
          },
        ],
      },
    ],
  },
  {
    id: "errores-rastreo",
    number: 7,
    title: "Errores de Rastreo (4xx / 5xx)",
    tasks: [
      {
        id: "7-1",
        title: "Detectar URLs con error 404",
        tool: "Screaming Frog / Google Search Console → Cobertura",
        whatToCheck:
          "¿Están enlazadas internamente? ¿Tienen backlinks externos?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Escanear Enlaces 404",
            type: "auto",
            handlerId: "checkInternal404s",
            icon: "Search",
          },
        ],
        inputs: [
          {
            id: "scan_url_7_1",
            label: "URL para escanear enlaces",
            type: "text",
            placeholder: "Ej: /blog o /home",
          },
        ],
      },
      {
        id: "7-2",
        title: "Revisar errores en Search Console",
        tool: "Google Search Console → Cobertura / Experiencia",
        whatToCheck: "Clasificar: excluidas, con advertencias, con errores",
        guide:
          "<b>1.</b> En Google Search Console, entra a <b>Páginas</b> (Indexación).<br/><b>2.</b> Comprueba la tabla de 'Por qué no se indexan las páginas'.<br/><b>3.</b> Haz clic en 'No se ha encontrado (404)' o 'Error de servidor (5xx)' para ver exactamente qué URLs fallan y repáralas.",
        status: "pending",
        notes: "",
      },
      {
        id: "7-3",
        title: "Verificar Soft 404 (Código de respuesta real)",
        tool: "Browser / HTTP Status Checker",
        whatToCheck: "Debe devolver código 404 real (no 200 'soft 404')",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Test de Soft 404",
            type: "auto",
            handlerId: "checkSoft404",
            icon: "Zap",
          },
        ],
      },
    ],
  },
  {
    id: "urls-amigables",
    number: 8,
    title: "URLs Amigables",
    tasks: [
      {
        id: "8-1",
        title: "Auditar estructura general de URLs",
        tool: "Screaming Frog → URL column",
        whatToCheck: "¿Son cortas, descriptivas, con guiones y sin parámetros?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Analizar Slugs",
            type: "auto",
            handlerId: "checkUrlStructure",
            icon: "Search",
          },
        ],
        inputs: [
          {
            id: "slugs_url_8_1",
            label: "URL para extraer muestras",
            type: "text",
            placeholder: "Ej: /blog o /tienda",
          },
        ],
      },
      {
        id: "8-2",
        title: "Detectar URLs con doble barra o caracteres raros",
        tool: "Screaming Frog → Filtro URL",
        whatToCheck:
          "Buscar //, mayúsculas, caracteres codificados (%20, etc.)",
        guide:
          "<b>1.</b> En Screaming Frog, selecciona la pestaña superior <b>URL</b>.<br/><b>2.</b> Filtra por <i>Uppercase</i> (Mayúsculas), <i>Multiple Slashes</i> (Dobles barras) o <i>Non ASCII Characters</i>.<br/><b>3.</b> Realiza redirecciones 301 a la versión limpia sin mayúsculas.",
        status: "pending",
        notes: "",
      },
      {
        id: "8-3",
        title: "Verificar profundidad máxima de URL (máx. 3 niveles)",
        tool: "Screaming Frog → URL Depth",
        whatToCheck: "URLs con profundidad >4 pierden relevancia en rastreo",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Chequear Profundidad",
            type: "auto",
            handlerId: "checkUrlDepth",
            icon: "Layout",
          },
        ],
      },
      {
        id: "8-4",
        title: "Homogeneizar minúsculas y separadores",
        tool: "CMS / .htaccess / redirecciones",
        whatToCheck: "¿Todo en minúsculas? ¿Solo guiones, sin guiones bajos?",
        guide:
          "<b>1.</b> Ve a la configuración de enlaces permanentes de tu CMS.<br/><b>2.</b> Asegúrate de que las URLs generadas usen siempre minúsculas y guiones convencionales <code>-</code> (no uses espacios ni guiones bajos <code>_</code>).",
        status: "pending",
        notes: "",
      },
    ],
  },
  {
    id: "core-web-vitals",
    number: 9,
    title: "Core Web Vitals",
    tasks: [
      {
        id: "9-1",
        title: "Medir LCP (Largest Contentful Paint)",
        tool: "PageSpeed Insights / Search Console → CWV",
        whatToCheck:
          "Objetivo: <2,5s. Identificar el elemento LCP (imagen/texto)",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Lanzar Auditoría PSI",
            type: "auto",
            handlerId: "checkPerformance",
            icon: "Zap",
          },
        ],
        inputs: [
          {
            id: "perf_url_9_1",
            label: "URL para analizar (PSI)",
            type: "text",
            placeholder: "Ej: / o /producto/...",
          },
          {
            id: "psi_api_key",
            label: "API Key de Google (Opcional)",
            type: "text",
            placeholder: "Pega tu clave para evitar errores de cuota",
            helperLink:
              "https://developers.google.com/speed/docs/insights/v5/get-started?hl=es",
            helperText: "Obtener clave",
          },
        ],
      },
      {
        id: "9-2",
        title: "Medir INP (Interaction to Next Paint)",
        tool: "PageSpeed Insights / CrUX",
        whatToCheck:
          "Objetivo: <200ms. Revisar JS que bloquea el hilo principal",
        status: "pending",
        notes: "",
      },
      {
        id: "9-3",
        title: "Medir CLS (Cumulative Layout Shift)",
        tool: "PageSpeed Insights / Lighthouse",
        whatToCheck: "Objetivo: <0,1. Buscar imágenes sin dimensiones, banners",
        status: "pending",
        notes: "",
      },
      {
        id: "9-4",
        title: "Revisar métricas en móvil Y escritorio por separado",
        tool: "PageSpeed Insights / Search Console",
        whatToCheck: "Móvil suele ser más crítico; priorizar mejoras ahí",
        status: "pending",
        notes: "",
      },
      {
        id: "9-5",
        title: "Identificar recursos bloqueantes (CSS/JS)",
        tool: "PageSpeed Insights → Oportunidades",
        whatToCheck: "Defer JS, Critical CSS, lazy load imágenes",
        status: "pending",
        notes: "",
      },
    ],
  },
  {
    id: "https-ssl",
    number: 10,
    title: "HTTPS / Seguridad SSL",
    tasks: [
      {
        id: "10-1",
        title: "Verificar certificado SSL válido y vigente",
        tool: "Browser (candado) / SSL Labs (ssllabs.com)",
        whatToCheck: "¿Emitido por CA reconocida? ¿Fecha de expiración?",
        status: "pending",
        notes: "",
        actions: [
          {
            label: "Ejecutar Auditoría SSL",
            type: "auto",
            handlerId: "checkSSL",
            icon: "ShieldCheck",
          },
        ],
      },
      {
        id: "10-2",
        title: "Comprobar redirección de HTTP → HTTPS",
        tool: "Browser / Screaming Frog",
        whatToCheck:
          "Acceder a http:// debe redirigir automáticamente a https://",
        guide:
          "<b>1.</b> Abre una nueva ventana de incógnito.<br/><b>2.</b> Visita <code>http://tudominio.com</code> (sin la S).<br/><b>3.</b> Si no cambia automáticamente a <code>https://tudominio.com</code> con el candado visible, debes forzar SSL en tu panel de servidor (cPanel, Plesk, Nginx).",
        status: "pending",
        notes: "",
      },
      {
        id: "10-3",
        title: "Detectar contenido mixto (mixed content)",
        tool: "Browser DevTools / Screaming Frog → Mixed",
        whatToCheck: "¿Hay recursos (img, scripts, CSS) servidos por HTTP?",
        status: "pending",
        notes: "",
      },
      {
        id: "10-4",
        title: "Actualizar enlaces internos de HTTP a HTTPS",
        tool: "Screaming Frog + CMS / DB",
        whatToCheck:
          "Especialmente en /wp-content/uploads/ y recursos incrustados",
        status: "pending",
        notes: "",
      },
      {
        id: "10-5",
        title: "Verificar que robots.txt Sitemap apunta a HTTPS",
        tool: "robots.txt manual",
        whatToCheck: "La URL del sitemap debe ser https://",
        status: "pending",
        notes: "",
      },
      {
        id: "10-6",
        title: "Comprobar URLs HTTP accesibles sin redirección",
        tool: "Screaming Frog / curl",
        whatToCheck: "Todas las versiones HTTP deben redirigir 301 a HTTPS",
        guide:
          "<b>1.</b> En Screaming Frog ve a <b>Configuration > Spider > Advanced</b>.<br/><b>2.</b> Desmarca <i>Follow HTTP/HTTPS redirects</i>.<br/><b>3.</b> Rastrea tu sitio empezando por <code>http://tudominio.com</code>.<br/><b>4.</b> Te debería bloquear/arrojar un 301. Si de lo contrario saca cientos de URLs 200, tu web aloja duplicados HTTP inseguros.",
        status: "pending",
        notes: "",
      },
    ],
  },
];
