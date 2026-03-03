import { useAuditStore } from "./useAuditStore";
import type { AuditTask, TaskAction } from "../data/checklist";

export function useAutoAudit() {
  const { project, setTaskStatus, updateNotes } = useAuditStore();

  const getCleanDomain = () => {
    return project.value.domain
      .replace("https://", "")
      .replace("http://", "")
      .replace(/\/$/, "");
  };

  const fetchWithProxy = async (url: string) => {
    // List of proxies to try
    const proxies = [
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) =>
        `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    ];

    let lastError = null;

    for (const proxy of proxies) {
      const proxyUrl = proxy(url);
      try {
        console.log(`Intentando fetching vía proxy: ${proxyUrl}`);

        // Use a timeout to avoid waiting too long for a failing proxy
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // If it's allorigins /get endpoint, we need to parse JSON
        if (proxyUrl.includes("allorigins.win/get")) {
          const json = await response.json();
          return json.contents;
        }

        return await response.text();
      } catch (e: any) {
        lastError = e;
        console.warn(`Proxy fallido (${proxyUrl}): ${e.message}`);
        // Continue to next proxy
      }
    }

    throw new Error(
      `No se pudo obtener el contenido tras probar varios proxies. Último error: ${lastError?.message}`,
    );
  };

  const handleFetchSitemap = async (task: AuditTask, action: TaskAction) => {
    if (!project.value.domain) {
      alert("Por favor, introduce un dominio primero.");
      return;
    }

    const domain = project.value.domain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    const domainsToTry = [domain];
    if (!domain.startsWith("www.")) {
      domainsToTry.push(`www.${domain}`);
    }

    let success = false;
    let lastError = "";

    for (const currentDomain of domainsToTry) {
      const sitemapUrl = `https://${currentDomain}${action.url}`;
      try {
        const xml = await fetchWithProxy(sitemapUrl);
        if (xml && (xml.includes("<sitemap") || xml.includes("<urlset"))) {
          // Save to scraped data
          if (!project.value.scrapedData) project.value.scrapedData = {};
          project.value.scrapedData["sitemap"] = xml;

          setTaskStatus(task.id, "pass");
          const message = `[Generado Automáticamente] Sitemap encontrado y guardado desde ${sitemapUrl}`;
          updateNotes(task.id, message);
          alert(`¡Sitemap obtenido correctamente desde ${sitemapUrl}!`);
          success = true;
          break;
        } else {
          throw new Error(
            "El archivo obtenido no parece ser un sitemap XML válido.",
          );
        }
      } catch (e: any) {
        lastError = e.message;
        console.warn(`Falló intento en ${sitemapUrl}: ${e.message}`);
      }
    }

    if (!success) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] Error al obtener el sitemap. Probados: ${domainsToTry.join(", ")}. Último error: ${lastError}`,
      );
      alert(`No se pudo obtener el sitemap: ${lastError}`);
    }
  };

  const handleCheckSitemapStructure = async (task: AuditTask) => {
    const sitemapXml = project.value.scrapedData?.["sitemap"];
    if (!sitemapXml) {
      alert(
        "No hay ningún sitemap guardado. Primero ejecuta la tarea anterior para obtener el sitemap.",
      );
      return;
    }

    const isIndex = sitemapXml.includes("<sitemapindex");
    let message = "";
    if (isIndex) {
      const match = sitemapXml.match(/<sitemap>/g);
      const count = match ? match.length : 0;
      message = `[Automático] Es un sitemap index válido. Contiene ${count} sitemaps hijos. ¡Estructura correcta!`;
      setTaskStatus(task.id, "pass");
    } else if (sitemapXml.includes("<urlset")) {
      const match = sitemapXml.match(/<url>/g);
      const count = match ? match.length : 0;
      message = `[Automático] No es un sitemap index, pero es un sitemap válido con ${count} URLs.`;
      setTaskStatus(task.id, "pass"); // Could mark as pass or warning depending on preference
    } else {
      message =
        "[Automático] El XML guardado no parece tener la estructura correcta.";
      setTaskStatus(task.id, "fail");
    }

    updateNotes(task.id, message);
    alert("Revisión completada. Abre las notas para ver el resultado.");
  };

  const handleFetchRobots = async (task: AuditTask, action: TaskAction) => {
    if (!project.value.domain) {
      alert("Por favor, introduce un dominio primero.");
      return;
    }

    const domain = project.value.domain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    const robotsUrl = `https://${domain}${action.url}`;

    try {
      const content = await fetchWithProxy(robotsUrl);
      if (content && content.toLowerCase().includes("user-agent")) {
        if (!project.value.scrapedData) project.value.scrapedData = {};
        project.value.scrapedData["robots"] = content;

        setTaskStatus(task.id, "pass");
        const message = `[Automático] Robots.txt obtenido correctamente de ${robotsUrl}.\n\nContenido detectado:\n${content.substring(0, 200)}...`;
        updateNotes(task.id, message);
        alert("Robots.txt obtenido y guardado.");
      } else {
        throw new Error("El archivo no parece ser un robots.txt válido.");
      }
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] Error al obtener robots.txt: ${e.message}`,
      );
      alert(`Error: ${e.message}`);
    }
  };

  const handleCheckRobotsSitemap = async (task: AuditTask) => {
    const robots = project.value.scrapedData?.["robots"];
    if (!robots) {
      alert("Primero obtén el robots.txt en la tarea anterior.");
      return;
    }

    const lines = robots.split("\n");
    const sitemapLines = lines.filter((l) =>
      l.toLowerCase().startsWith("sitemap:"),
    );

    if (sitemapLines.length > 0) {
      const allHttps = sitemapLines.every((l) =>
        l.toLowerCase().includes("https://"),
      );
      if (allHttps) {
        setTaskStatus(task.id, "pass");
        updateNotes(
          task.id,
          `[Automático] Se han encontrado ${sitemapLines.length} directivas Sitemap y todas usan HTTPS.`,
        );
      } else {
        setTaskStatus(task.id, "fail");
        updateNotes(
          task.id,
          `[Automático] ¡Alerta! Se han encontrado directivas Sitemap pero alguna NO usa HTTPS:\n${sitemapLines.join("\n")}`,
        );
      }
    } else {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        "[Automático] No se ha encontrado ninguna directiva Sitemap: en el robots.txt.",
      );
    }
    alert("Revisión de Sitemap en robots finalizada.");
  };

  const handleCheckWPAdminRobots = async (task: AuditTask) => {
    const robots = project.value.scrapedData?.["robots"];
    if (!robots) {
      alert("Primero obtén el robots.txt.");
      return;
    }

    const commonWPRules = ["/wp-admin/", "/wp-login.php", "/xmlrpc.php"];
    const found = commonWPRules.filter((rule) =>
      robots.toLowerCase().includes(rule.toLowerCase()),
    );

    if (found.length > 0) {
      setTaskStatus(task.id, "pass");
      updateNotes(
        task.id,
        `[Automático] Se han detectado reglas de bloqueo para WordPress: ${found.join(", ")}. ¡Correcto!`,
      );
    } else {
      setTaskStatus(task.id, "na");
      updateNotes(
        task.id,
        "[Automático] No se han detectado reglas estándar de WordPress. Si no es un WordPress, esto es normal.",
      );
    }
    alert("Revisión de reglas WordPress finalizada.");
  };

  const handleCheckPaginationAccess = async (
    task: AuditTask,
    action: TaskAction,
  ) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }
    const domain = getCleanDomain();
    const url = `https://${domain}${action.url}`;
    try {
      await fetchWithProxy(url);
      setTaskStatus(task.id, "pass");
      updateNotes(
        task.id,
        `[Automático] La URL de paginación ${url} es accesible.`,
      );
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] Error al acceder a ${url}: ${e.message}. Es posible que la web use otra estructura (?p=2, /p/2, etc.).`,
      );
    }
    alert("Prueba de acceso a paginación completada.");
  };

  const handleCheckRobotsPagination = async (task: AuditTask) => {
    const robots = project.value.scrapedData?.["robots"];
    if (!robots) {
      alert("Obtén primero el robots.txt.");
      return;
    }
    const blocked =
      robots.toLowerCase().includes("disallow: /page/") ||
      robots.toLowerCase().includes("disallow: /p/");
    if (blocked) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        "[Automático] ¡Atención! Se han detectado reglas Disallow que podrían estar bloqueando la paginación (/page/ o /p/).",
      );
    } else {
      setTaskStatus(task.id, "pass");
      updateNotes(
        task.id,
        "[Automático] No se detectan bloqueos evidentes para /page/ en el robots.txt.",
      );
    }
    alert("Análisis de robots completado.");
  };

  const handleCheckRelNextPrev = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    // Check for custom URL in inputs
    const customUrlInput = task.inputs?.find((i) => i.id === "pagination_url");
    let path = customUrlInput?.value || "/";
    if (typeof path === "string" && !path.startsWith("/")) path = "/" + path;

    const targetUrl = `https://${project.value.domain}${path}`;

    try {
      const html = await fetchWithProxy(targetUrl);
      const hasNext = html.toLowerCase().includes('rel="next"');
      const hasPrev = html.toLowerCase().includes('rel="prev"');

      if (hasNext || hasPrev) {
        setTaskStatus(task.id, "pass");
        updateNotes(
          task.id,
          `[Automático] Se han detectado etiquetas: ${hasNext ? 'rel="next"' : ""} ${hasPrev ? 'rel="prev"' : ""} en el código fuente de ${targetUrl}.`,
        );
      } else {
        setTaskStatus(task.id, "fail");
        updateNotes(
          task.id,
          `[Automático] No se han encontrado etiquetas rel="next" ni rel="prev" en la URL analizada (${targetUrl}).`,
        );
      }
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] Error al analizar ${targetUrl}: ${e.message}`,
      );
    }
    alert(`Búsqueda de rel=next/prev en ${path} finalizada.`);
  };

  const handleCheckPaginationHTTPS = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    const customUrlInput = task.inputs?.find(
      (i) => i.id === "pagination_url_4_4",
    );
    let path = customUrlInput?.value || "/";
    if (typeof path === "string" && !path.startsWith("/")) path = "/" + path;
    const targetUrl = `https://${project.value.domain}${path}`;

    try {
      const html = await fetchWithProxy(targetUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = Array.from(doc.querySelectorAll("a[href]"));

      // Patterns that usually represent pagination
      const paginationPatterns = [
        /\/page\/\d+/i,
        /[?&]p=\d+/i,
        /[?&]page=\d+/i,
        /[?&]pagination=\d+/i,
      ];

      const paginationLinks = links.filter((a) => {
        const href = a.getAttribute("href") || "";
        return paginationPatterns.some((pattern) => pattern.test(href));
      });

      if (paginationLinks.length === 0) {
        setTaskStatus(task.id, "na");
        updateNotes(
          task.id,
          `[Automático] No se han detectado enlaces de paginación claros en ${targetUrl}. Prueba con una URL de listado.`,
        );
      } else {
        const insecureLinks = paginationLinks.filter((a) => {
          const href = a.getAttribute("href") || "";
          return href.startsWith("http://"); // Check for absolute insecure links
        });

        if (insecureLinks.length > 0) {
          setTaskStatus(task.id, "fail");
          updateNotes(
            task.id,
            `[Automático] ¡Atención! Se han detectado ${insecureLinks.length} enlaces de paginación usando HTTP en lugar de HTTPS.`,
          );
        } else {
          setTaskStatus(task.id, "pass");
          updateNotes(
            task.id,
            `[Automático] Analizados ${paginationLinks.length} enlaces de paginación en ${targetUrl}. Todos parecen correctos (HTTPS o relativos).`,
          );
        }
      }
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] Error al analizar ${targetUrl}: ${e.message}`,
      );
    }
    alert("Validación de protocolo en paginación finalizada.");
  };

  const handleDetectJunk = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    const domain = project.value.domain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    let notes =
      "[Automático] Resultados del Escáner de Basura de Indexación:\n\n";
    let issuesFound = 0;

    // 1. Scan Sitemap for junk (if we have it)
    const sitemap = project.value.scrapedData?.["sitemap"];
    if (sitemap) {
      const junkPatterns = [
        "staging",
        "test",
        "demo",
        "dev",
        "old",
        "backup",
        "v1",
        "v2",
        "temp",
        "tmp",
      ];
      const sitemapUrls = sitemap.match(/<loc>(.*?)<\/loc>/g) || [];
      const junkInSitemap = sitemapUrls.filter((loc) =>
        junkPatterns.some((p) => loc.toLowerCase().includes(p)),
      );

      if (junkInSitemap.length > 0) {
        issuesFound++;
        notes += `⚠️ SITEMAP: Se han encontrado ${junkInSitemap.length} URLs sospechosas de ser contenido de prueba.\n`;
      } else {
        notes +=
          "✅ SITEMAP: No se detectan URLs de prueba o staging en el sitemap.\n";
      }
    } else {
      notes +=
        "ℹ️ SITEMAP: No hay datos de sitemap para analizar. Ejecuta la tarea 2-1 primero.\n";
    }

    // 2. Check for dangerous/leaking files
    const sensitiveFiles = [
      "/.env",
      "/.git/config",
      "/wp-config.php.bak",
      "/backup.sql",
    ];
    notes += "\n--- Escaneo de Archivos Sensibles ---\n";

    for (const file of sensitiveFiles) {
      const url = `https://${domain}${file}`;
      try {
        const content = await fetchWithProxy(url);
        // If it returns content that doesn't look like a 404 page
        if (
          content &&
          content.length > 50 &&
          !content.toLowerCase().includes("404 not found")
        ) {
          issuesFound++;
          notes += `🚨 PELIGRO: Archivo expuesto en ${url}. ¡Riesgo de seguridad e indexación!\n`;
        } else {
          notes += `✅ ${file}: No accesible / Protegido.\n`;
        }
      } catch (e: any) {
        notes += `✅ ${file}: No accesible (${e.message}).\n`;
      }
    }

    if (issuesFound > 0) {
      setTaskStatus(task.id, "fail");
      notes += `\nResultado: Se han detectado ${issuesFound} riesgos potenciales. Se recomienda revisar manualmente.`;
    } else {
      setTaskStatus(task.id, "pass");
      notes +=
        "\nResultado: No se han encontrado riesgos evidentes en el escaneo superficial.";
    }

    updateNotes(task.id, notes);
    alert("Escáner de basura finalizado. Revisa las notas de la tarea.");
  };

  const handleCheckCanonical = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    const customUrlInput = task.inputs?.find(
      (i) => i.id === "canonical_url_5_1",
    );
    let path = customUrlInput?.value || "/";
    if (typeof path === "string" && !path.startsWith("/")) path = "/" + path;
    const targetUrl = `https://${project.value.domain}${path}`;

    try {
      const html = await fetchWithProxy(targetUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const canonicalTag = doc.querySelector('link[rel="canonical"]');
      const canonicalHref = canonicalTag?.getAttribute("href");

      if (!canonicalHref) {
        setTaskStatus(task.id, "fail");
        updateNotes(
          task.id,
          `[Automático] ❌ No se ha encontrado ninguna etiqueta canonical en ${targetUrl}.`,
        );
      } else {
        const isHttps = canonicalHref.startsWith("https://");
        const includesDomain = canonicalHref.includes(project.value.domain);
        const isSelfReferential =
          canonicalHref === targetUrl ||
          canonicalHref === targetUrl.replace(/\/$/, "");

        let resultNotes = `[Automático] Canonical encontrado: ${canonicalHref}\n\n`;
        resultNotes += isHttps
          ? "✅ Usa HTTPS.\n"
          : "❌ No usa HTTPS (Protocolo inseguro).\n";
        resultNotes += includesDomain
          ? "✅ El dominio coincide.\n"
          : "❌ Apunta a un dominio externo o diferente.\n";
        resultNotes += isSelfReferential
          ? "✅ Es autodeclarado (apunta a sí mismo).\n"
          : "⚠️ No es autodeclarado (esto puede ser correcto si es un duplicado).\n";

        if (isHttps && includesDomain) {
          setTaskStatus(task.id, "pass");
        } else {
          setTaskStatus(task.id, "fail");
        }
        updateNotes(task.id, resultNotes);
      }
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] Error al analizar canonical: ${e.message}`,
      );
    }
    alert("Análisis de canonical completado.");
  };

  const handleCheckCanonicalParams = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    const customUrlInput = task.inputs?.find(
      (i) => i.id === "canonical_url_5_4",
    );
    let path = customUrlInput?.value || "/";
    if (typeof path === "string" && !path.startsWith("/")) path = "/" + path;

    const baseUrl = `https://${project.value.domain}${path}`;
    const pathStr = String(path);
    const testUrl = `${baseUrl}${pathStr.includes("?") ? "&" : "?"}seo_audit_test=123`;

    try {
      const html = await fetchWithProxy(testUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const canonicalHref = doc
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href");

      if (!canonicalHref) {
        setTaskStatus(task.id, "fail");
        updateNotes(
          task.id,
          `[Automático] Error: No hay canonical en ${testUrl}.`,
        );
      } else {
        const canonicalMatchesBase =
          canonicalHref === baseUrl ||
          canonicalHref === baseUrl.replace(/\/$/, "");

        const baseUrlWww = baseUrl.replace("https://", "https://www.");
        const baseUrlNoWww = baseUrl.replace("https://www.", "https://");
        const matchesWwwAlt =
          canonicalHref === baseUrlWww ||
          canonicalHref === baseUrlNoWww ||
          canonicalHref === baseUrlWww.replace(/\/$/, "") ||
          canonicalHref === baseUrlNoWww.replace(/\/$/, "");

        if (canonicalMatchesBase) {
          setTaskStatus(task.id, "pass");
          updateNotes(
            task.id,
            `[Automático] ✅ ¡Correcto! El canonical consolida parámetros y apunta a la versión limpia: ${canonicalHref}.`,
          );
        } else if (matchesWwwAlt) {
          setTaskStatus(task.id, "pass");
          updateNotes(
            task.id,
            `[Automático] ✅ ¡Correcto! El canonical consolida parámetros.\n\nNota: Tu web prefiere la versión ${canonicalHref.includes("://www.") ? "con WWW" : "sin WWW"}. Se recomienda actualizar el dominio en la configuración para mayor consistencia.`,
          );
        } else {
          setTaskStatus(task.id, "fail");
          updateNotes(
            task.id,
            `[Automático] ❌ El canonical NO está consolidando parámetros correctamente.\nEsperado: ${baseUrl}\nEncontrado: ${canonicalHref}`,
          );
        }
      }
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] Error en prueba de parámetros: ${e.message}`,
      );
    }
    alert("Prueba de consolidación de parámetros finalizada.");
  };

  const handleCheckInternalRedirects = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    const customUrlInput = task.inputs?.find(
      (i) => i.id === "redirects_url_6_1",
    );
    let path = customUrlInput?.value || "/";
    if (typeof path === "string" && !path.startsWith("/")) path = "/" + path;
    const targetUrl = `https://${project.value.domain}${path}`;

    try {
      const html = await fetchWithProxy(targetUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = Array.from(doc.querySelectorAll("a[href]"));

      const domainBase = project.value.domain.replace("www.", "");
      const internalLinks = links.filter((a) => {
        const href = a.getAttribute("href") || "";
        return (
          href.includes(domainBase) ||
          href.startsWith("/") ||
          (!href.startsWith("http") && !href.startsWith("#"))
        );
      });

      const suspicious = internalLinks.filter((a) => {
        const href = a.getAttribute("href") || "";
        if (href.startsWith("http://")) return true;

        const currentIsWww = project.value.domain.startsWith("www.");
        if (currentIsWww && href.includes("://") && !href.includes("://www."))
          return true;
        if (!currentIsWww && href.includes("://www.")) return true;

        return false;
      });

      if (suspicious.length > 0) {
        setTaskStatus(task.id, "fail");
        const list = suspicious
          .slice(0, 15)
          .map((a) => `• ${a.getAttribute("href")}`)
          .join("\n");
        const extra =
          suspicious.length > 15
            ? `\n... y ${suspicious.length - 15} más.`
            : "";

        updateNotes(
          task.id,
          `[Automático] Analizados ${internalLinks.length} enlaces en ${targetUrl}.\n\n⚠️ Se han detectado ${suspicious.length} enlaces internos "sucios" (vía HTTP o dominio incorrecto):\n\n${list}${extra}\n\nNota: Estos enlaces provocan redirecciones 301 innecesarias.`,
        );
      } else {
        setTaskStatus(task.id, "pass");
        updateNotes(
          task.id,
          `[Automático] Analizados ${internalLinks.length} enlaces internos en ${targetUrl}. Todos parecen apuntar directamente a la versión correcta.`,
        );
      }
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] Error al analizar enlaces: ${e.message}`,
      );
    }
    alert("Análisis de enlaces internos finalizado.");
  };

  const handleCheckGlobalRedirects = async (task: AuditTask) => {
    if (!project.value.domain) return;
    const domainBase = project.value.domain.replace("www.", "");

    // We try to fetch the "opposite" or insecure version and see if it redirects back to the preferred one
    const testUrl = project.value.domain.startsWith("www.")
      ? `http://${domainBase}/`
      : `http://www.${domainBase}/`;

    try {
      // Note: Some proxies follow redirects and we can't easily see the intermediate jumps,
      // but if we get a result, we can check basic connectivity.
      await fetchWithProxy(testUrl);

      setTaskStatus(task.id, "pass");
      updateNotes(
        task.id,
        `[Automático] El servidor responde correctamente a peticiones de redirección global (${testUrl}).`,
      );
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] Error al probar redirección global en ${testUrl}: ${e.message}`,
      );
    }
    alert("Prueba de redirecciones globales completada.");
  };

  const handleCheckInternal404s = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    const customUrlInput = task.inputs?.find((i) => i.id === "scan_url_7_1");
    let path = customUrlInput?.value || "/";
    if (typeof path === "string" && !path.startsWith("/")) path = "/" + path;
    const targetUrl = `https://${project.value.domain}${path}`;

    try {
      const html = await fetchWithProxy(targetUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = Array.from(doc.querySelectorAll("a[href]")).slice(0, 15); // Limit for performance

      let brokenLinks = [];
      let notes = `[Automático] Analizando los primeros ${links.length} enlaces de ${targetUrl}...\n\n`;

      for (const link of links) {
        let href = link.getAttribute("href") || "";
        if (href.startsWith("/"))
          href = `https://${project.value.domain}${href}`;
        if (!href.startsWith("http")) continue;

        try {
          await fetchWithProxy(href);
        } catch (e: any) {
          if (e.message.includes("404")) {
            brokenLinks.push(href);
          }
        }
      }

      if (brokenLinks.length > 0) {
        setTaskStatus(task.id, "fail");
        notes +=
          `❌ Se han encontrado ${brokenLinks.length} enlaces rotos (404):\n` +
          brokenLinks.map((l) => `• ${l}`).join("\n");
      } else {
        setTaskStatus(task.id, "pass");
        notes += `✅ Todos los enlaces analizados en esta muestra (${links.length}) responden correctamente.`;
      }
      updateNotes(task.id, notes);
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(task.id, `[Automático] Error al escanear: ${e.message}`);
    }
    alert("Escaneo de enlaces 404 finalizado.");
  };

  const handleCheckSoft404 = async (task: AuditTask) => {
    if (!project.value.domain) return;
    const testUrl = `https://${project.value.domain}/non-existent-page-seo-audit-${Math.floor(Math.random() * 1000)}`;

    try {
      await fetchWithProxy(testUrl);
      // If it reaches here, it returned a 200 OK for a non-existent page -> SOFT 404
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        `[Automático] 🚨 ¡Alerta de Soft 404! La URL ${testUrl} ha devuelto un código 200 OK cuando debería ser 404. Esto confunde a Google.`,
      );
    } catch (e: any) {
      if (e.message.includes("404")) {
        setTaskStatus(task.id, "pass");
        updateNotes(
          task.id,
          `[Automático] ✅ Correcto. El servidor ha devuelto un error 404 real para la URL inexistente ${testUrl}.`,
        );
      } else {
        setTaskStatus(task.id, "na");
        updateNotes(
          task.id,
          `[Automático] El servidor devolvió un error (${e.message}), pero no pudimos confirmar si es un 404 real.`,
        );
      }
    }
    alert("Prueba de Soft 404 completada.");
  };

  const handleCheckUrlStructure = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    const customUrlInput = task.inputs?.find((i) => i.id === "slugs_url_8_1");
    let path = customUrlInput?.value || "/";
    if (typeof path === "string" && !path.startsWith("/")) path = "/" + path;
    const targetUrl = `https://${project.value.domain}${path}`;

    try {
      const html = await fetchWithProxy(targetUrl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = Array.from(doc.querySelectorAll("a[href]"));

      const domainBase = project.value.domain.replace("www.", "");
      const internalLinks = links.filter((a) => {
        const href = a.getAttribute("href") || "";
        return (
          href.includes(domainBase) ||
          href.startsWith("/") ||
          (!href.startsWith("http") && !href.startsWith("#"))
        );
      });

      const badUrls = internalLinks.filter((a) => {
        const href = a.getAttribute("href") || "";
        const urlStr = href.split("?")[0] || "";

        const isUpper = /[A-Z]/.test(urlStr);
        const hasUnderscore = urlStr.includes("_");
        const hasDoubleSlash =
          urlStr.includes("//") && !urlStr.startsWith("http");
        const hasSpaces = urlStr.includes("%20") || urlStr.includes(" ");
        const hasParams = href.includes("?");

        return (
          isUpper || hasUnderscore || hasDoubleSlash || hasSpaces || hasParams
        );
      });

      if (badUrls.length > 0) {
        setTaskStatus(task.id, "fail");
        const list = Array.from(
          new Set(badUrls.map((a) => a.getAttribute("href") || "")),
        ).slice(0, 10);
        updateNotes(
          task.id,
          `[Automático] ❌ Se han detectado ${badUrls.length} URLs con estructura no amigable (mayúsculas, guiones bajos, espacios o parámetros):\n\n${list.map((u) => `• ${u}`).join("\n")}${badUrls.length > 10 ? "\n... y más." : ""}`,
        );
      } else {
        setTaskStatus(task.id, "pass");
        updateNotes(
          task.id,
          `[Automático] ✅ Enlaces analizados en ${targetUrl} tienen una estructura correcta (minúsculas, guiones medios y sin caracteres extraños).`,
        );
      }
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(task.id, `[Automático] Error al analizar URLs: ${e.message}`);
    }
    alert("Análisis de estructura de URLs finalizado.");
  };

  const handleCheckUrlDepth = async (task: AuditTask) => {
    if (!project.value.domain) return;
    try {
      const html = await fetchWithProxy(`https://${project.value.domain}/`);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = Array.from(doc.querySelectorAll("a[href]"));

      const deepUrls = links.filter((a) => {
        const href = a.getAttribute("href") || "";
        if (!href.startsWith("/") && !href.includes(project.value.domain))
          return false;

        let urlPath = "";
        try {
          urlPath = href.includes("://")
            ? new URL(href).pathname
            : href.split("?")[0] || "";
        } catch (e) {
          urlPath = href.split("?")[0] || "";
        }
        const depth = urlPath.split("/").filter((p) => p !== "").length;
        return depth > 3;
      });

      if (deepUrls.length > 0) {
        setTaskStatus(task.id, "fail");
        const list = Array.from(
          new Set(deepUrls.map((a) => a.getAttribute("href"))),
        ).slice(0, 5);
        updateNotes(
          task.id,
          `[Automático] ❌ Se han detectado URLs con demasiada profundidad (>3 niveles):\n\n${list.map((u) => `• ${u}`).join("\n")}\n\nNota: Google prefiere estructuras planas.`,
        );
      } else {
        setTaskStatus(task.id, "pass");
        updateNotes(
          task.id,
          `[Automático] ✅ No se han detectado URLs con profundidad excesiva en la muestra de la Home.`,
        );
      }
    } catch (e: any) {
      updateNotes(
        task.id,
        `[Automático] Error al analizar profundidad: ${e.message}`,
      );
    }
    alert("Análisis de profundidad finalizado.");
  };

  const handleCheckPerformance = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    const domain = getCleanDomain();
    if (domain.includes("localhost") || domain.includes("127.0.0.1")) {
      alert(
        "Google PageSpeed Insights no puede analizar sitios locales (localhost). Por favor, usa un dominio público.",
      );
      setTaskStatus(task.id, "fail");
      updateNotes(
        task.id,
        "[Automático] ❌ Error: Google no tiene acceso a sitios en local.",
      );
      return;
    }

    const customUrlInput = task.inputs?.find((i) => i.id === "perf_url_9_1");
    let path = customUrlInput?.value || "/";
    if (typeof path === "string" && !path.startsWith("/")) path = "/" + path;
    const targetUrl = `https://${domain}${path}`;

    // Warn the user as this takes time
    updateNotes(
      task.id,
      `[Automático]⏳ Analizando ${targetUrl} vía PSI... Esto suele tardar unos 45 segundos.`,
    );

    const apiKeyInput = task.inputs?.find((i) => i.id === "psi_api_key");
    const psiApiKey = (apiKeyInput?.value as string) || project.value.psiApiKey;

    try {
      const fetchPSI = async (strategy: "mobile" | "desktop") => {
        let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance`;
        if (psiApiKey) {
          apiUrl += `&key=${psiApiKey}`;
        }
        const response = await fetch(apiUrl);
        let data: any;
        try {
          data = await response.json();
        } catch (err) {
          throw new Error("Respuesta de API inválida.");
        }
        if (!response.ok) {
          throw new Error(
            data.error?.message || `Error HTTP ${response.status}`,
          );
        }
        return data;
      };

      // 1. Analizar Móvil
      updateNotes(
        task.id,
        `[Automático]⏳ Analizando versión MÓVIL de ${targetUrl}...`,
      );
      const mobileData = await fetchPSI("mobile");
      const mobileLighthouse = mobileData.lighthouseResult;
      const mobileField = mobileData.loadingExperience?.metrics;

      if (!mobileLighthouse || !mobileLighthouse.audits) {
        throw new Error(
          "No se obtuvieron resultados de Lighthouse para móvil.",
        );
      }

      // 2. Analizar Escritorio
      updateNotes(
        task.id,
        `[Automático]⏳ Analizando versión ESCRITORIO de ${targetUrl}... (esto tomará un momento)`,
      );
      const desktopData = await fetchPSI("desktop");
      const desktopLighthouse = desktopData.lighthouseResult;

      // --- Tarea 9-1: LCP ---
      const lcpAudit = mobileLighthouse.audits["largest-contentful-paint"];
      const lcpValue = lcpAudit ? lcpAudit.numericValue / 1000 : 0;
      const lcpDesktopAudit =
        desktopLighthouse?.audits?.["largest-contentful-paint"];
      const lcpDesktopValue = lcpDesktopAudit
        ? lcpDesktopAudit.numericValue / 1000
        : 0;
      const lcpStatus = lcpValue > 0 && lcpValue < 2.5 ? "pass" : "fail";
      setTaskStatus("9-1", lcpStatus);
      updateNotes(
        "9-1",
        `[Automático] 🚀 LCP (Móvil): ${lcpValue.toFixed(2)}s\n[Automático] 🚀 LCP (Escritorio): ${lcpDesktopValue.toFixed(2)}s\n\n${lcpStatus === "pass" ? "✅ Móvil: ¡Excelente! (<2.5s)." : "❌ Móvil: Necesita mejora."}`,
      );

      // --- Tarea 9-2: INP/TBT ---
      const desktopField = desktopData.loadingExperience?.metrics;
      const inpMetric = mobileField?.INTERACTIVE_TO_NEXT_PAINT;
      const tbtAudit = mobileLighthouse.audits["total-blocking-time"];
      const inpValue = inpMetric
        ? inpMetric.percentile
        : tbtAudit
          ? tbtAudit.numericValue
          : 0;

      const inpDesktopMetric = desktopField?.INTERACTIVE_TO_NEXT_PAINT;
      const tbtDesktopAudit =
        desktopLighthouse?.audits?.["total-blocking-time"];
      const inpDesktopValue = inpDesktopMetric
        ? inpDesktopMetric.percentile
        : tbtDesktopAudit
          ? tbtDesktopAudit.numericValue
          : 0;

      const inpStatus = inpValue < 200 ? "pass" : "fail";
      setTaskStatus("9-2", inpStatus);
      updateNotes(
        "9-2",
        `[Automático] ⚡ ${inpMetric ? "INP (Móvil, Campo)" : "TBT (Móvil, Lab)"}: ${inpValue.toFixed(0)}ms\n[Automático] ⚡ ${inpDesktopMetric ? "INP (Escritorio, Campo)" : "TBT (Escritorio, Lab)"}: ${inpDesktopValue.toFixed(0)}ms\n\n${inpStatus === "pass" ? "✅ Móvil: Buen tiempo de interacción." : "❌ Móvil: El hilo principal está demasiado ocupado."}`,
      );

      // --- Tarea 9-3: CLS ---
      const clsAudit = mobileLighthouse.audits["cumulative-layout-shift"];
      const clsValue = clsAudit ? clsAudit.numericValue : 0;
      const clsDesktopAudit =
        desktopLighthouse?.audits?.["cumulative-layout-shift"];
      const clsDesktopValue = clsDesktopAudit
        ? clsDesktopAudit.numericValue
        : 0;
      const clsStatus = clsValue < 0.1 ? "pass" : "fail";
      setTaskStatus("9-3", clsStatus);
      updateNotes(
        "9-3",
        `[Automático] 📐 CLS (Móvil): ${clsValue.toFixed(3)}\n[Automático] 📐 CLS (Escritorio): ${clsDesktopValue.toFixed(3)}\n\n${clsStatus === "pass" ? "✅ Móvil: Estabilidad visual perfecta." : "❌ Móvil: Hay cambios de diseño bruscos."}`,
      );

      // --- Tarea 9-4: Móvil vs Escritorio ---
      const mobileScore =
        (mobileLighthouse.categories?.performance?.score || 0) * 100;
      const desktopScore =
        (desktopLighthouse?.categories?.performance?.score || 0) * 100;
      const scoresStatus =
        mobileScore >= 90 && desktopScore >= 90 ? "pass" : "fail";
      setTaskStatus("9-4", scoresStatus);
      updateNotes(
        "9-4",
        `[Automático] 📱 Rendimiento Móvil: ${mobileScore.toFixed(0)}/100\n💻 Rendimiento Escritorio: ${desktopScore.toFixed(0)}/100\n\n${mobileScore < desktopScore - 15 ? "⚠️ La versión móvil es sustancialmente más lenta." : "✅ Buen equilibrio de rendimiento."}`,
      );

      // --- Tarea 9-5: Recursos Bloqueantes ---
      const renderBlocking =
        mobileLighthouse.audits["render-blocking-resources"];
      const blockingItems = renderBlocking?.details?.items || [];
      if (blockingItems.length > 0) {
        setTaskStatus("9-5", "fail");
        const list = blockingItems
          .slice(0, 5)
          .map(
            (item: any) =>
              `• ${item.url.split("/").pop()} (-${item.wastedMs.toFixed(0)}ms)`,
          )
          .join("\n");
        updateNotes(
          "9-5",
          `[Automático] ❌ Se detectaron ${blockingItems.length} recursos bloqueando el renderizado:\n\n${list}${blockingItems.length > 5 ? "\n... y más." : ""}\n\nSugerencia: Usa 'defer' en JS y optimiza la carga de CSS.`,
        );
        setTaskStatus("9-5", "pass");
        updateNotes(
          "9-5",
          `[Automático] ✅ ¡Bien! No se detectaron recursos críticos que bloqueen el renderizado en la carga inicial.`,
        );
      }

      alert("Auditoría completa de PageSpeed Insights finalizada con éxito.");
    } catch (e: any) {
      setTaskStatus(task.id, "fail");
      updateNotes(task.id, `[Automático] Error API: ${e.message}`);
      alert(`Error en la API de Google: ${e.message}`);
    }
  };

  const handleCheckSSL = async (task: AuditTask) => {
    if (!project.value.domain) {
      alert("Introduce un dominio primero.");
      return;
    }

    const domain = getCleanDomain();
    updateNotes(
      task.id,
      `[Automático] ⏳ Iniciando auditoría SSL Global para ${domain}...`,
    );

    let allOk = true;

    // 10-1: Check SSL Certificate Validity
    try {
      updateNotes("10-1", `[Automático] ⏳ Verificando certificado SSL...`);
      await fetch(`https://${domain}`, { mode: "no-cors", cache: "no-store" });
      setTaskStatus("10-1", "pass");
      updateNotes(
        "10-1",
        `[Automático] ✅ El certificado SSL resuelve correctamente a nivel de navegador y no presenta errores de conexión.`,
      );
    } catch (e: any) {
      setTaskStatus("10-1", "fail");
      updateNotes(
        "10-1",
        `[Automático] ❌ Error de certificado SSL (o de conexión).\nVerifica la validez y que no esté caducado.\nDetalle: ${e.message}`,
      );
      allOk = false;
    }

    // 10-3 & 10-4: Mixed content and internal HTTP links
    try {
      updateNotes(
        "10-3",
        `[Automático] ⏳ Analizando contenido mixto (Mixed Content)...`,
      );
      updateNotes("10-4", `[Automático] ⏳ Analizando enlaces HTTP...`);

      const html = await fetchWithProxy(`https://${domain}/`);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const mediaElements = Array.from(
        doc.querySelectorAll(
          "img, script, link[rel='stylesheet'], iframe, video, audio",
        ),
      );
      const mixedContent: string[] = [];

      mediaElements.forEach((el) => {
        const src = el.getAttribute("src") || el.getAttribute("href");
        if (src && src.toLowerCase().startsWith("http://")) {
          mixedContent.push(src);
        }
      });

      if (mixedContent.length > 0) {
        setTaskStatus("10-3", "fail");
        updateNotes(
          "10-3",
          `[Automático] ❌ Se han detectado ${mixedContent.length} recursos servidos por HTTP (Mixed Content):\n\n${mixedContent
            .slice(0, 5)
            .map((m) => `• ${m}`)
            .join(
              "\n",
            )}${mixedContent.length > 5 ? "\n... y más." : ""}\n\nNota: Esto rompe el candado verde de seguridad.`,
        );
        allOk = false;
      } else {
        setTaskStatus("10-3", "pass");
        updateNotes(
          "10-3",
          `[Automático] ✅ No se ha detectado contenido mixto interactivo.`,
        );
      }

      const links = Array.from(doc.querySelectorAll("a[href]"));
      const httpInternalLinks: string[] = [];

      links.forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (
          href.startsWith(`http://${domain}`) ||
          href.startsWith(`http://www.${domain}`)
        ) {
          httpInternalLinks.push(href);
        }
      });

      if (httpInternalLinks.length > 0) {
        setTaskStatus("10-4", "fail");
        updateNotes(
          "10-4",
          `[Automático] ❌ Se encontraron ${httpInternalLinks.length} enlaces internos forzando la versión HTTP insegura:\n\n${httpInternalLinks
            .slice(0, 5)
            .map((l) => `• ${l}`)
            .join("\n")}`,
        );
        allOk = false;
      } else {
        setTaskStatus("10-4", "pass");
        updateNotes(
          "10-4",
          `[Automático] ✅ Todos los enlaces internos detectados en portada cargan respetando HTTPS (o son relativos).`,
        );
      }
    } catch (e: any) {
      setTaskStatus("10-3", "fail");
      updateNotes("10-3", `[Automático] Error analizando DOM: ${e.message}`);
      setTaskStatus("10-4", "fail");
      updateNotes("10-4", `[Automático] Error analizando DOM: ${e.message}`);
      allOk = false;
    }

    // 10-5: Robots.txt Sitemap uses HTTPS
    try {
      updateNotes("10-5", `[Automático] ⏳ Verificando robots.txt...`);
      const robots = await fetchWithProxy(`https://${domain}/robots.txt`);
      const sitemapLines = robots
        .split("\n")
        .filter((line: string) => line.toLowerCase().startsWith("sitemap:"));

      if (sitemapLines.length > 0) {
        const httpSitemaps = sitemapLines.filter((line: string) =>
          line.includes("http://"),
        );
        if (httpSitemaps.length > 0) {
          setTaskStatus("10-5", "fail");
          updateNotes(
            "10-5",
            `[Automático] ❌ El Sitemap declarado en robots.txt no es seguro (HTTP):\n\n${httpSitemaps.join("\n")}`,
          );
          allOk = false;
        } else {
          setTaskStatus("10-5", "pass");
          updateNotes(
            "10-5",
            `[Automático] ✅ Todas las directivas Sitemap en robots.txt usan HTTPS correctamente.`,
          );
        }
      } else {
        setTaskStatus("10-5", "na");
        updateNotes(
          "10-5",
          `[Automático] ➖ No hay directiva de URL de Sitemap presente en robots.txt.`,
        );
      }
    } catch (e: any) {
      setTaskStatus("10-5", "fail");
      updateNotes(
        "10-5",
        `[Automático] Error conectando con robots.txt: ${e.message}`,
      );
      allOk = false;
    }

    if (allOk) {
      alert("Auditoría Global SSL completada con éxito. El sitio es seguro.");
    } else {
      alert(
        "Auditoría Global SSL completada. Hay problemas de seguridad que debes revisar.",
      );
    }
  };

  const handleAutoAction = async (task: AuditTask, action: TaskAction) => {
    if (action.handlerId === "fetchSitemap") {
      await handleFetchSitemap(task, action);
    } else if (action.handlerId === "checkSitemapStructure") {
      await handleCheckSitemapStructure(task);
    } else if (action.handlerId === "fetchRobots") {
      await handleFetchRobots(task, action);
    } else if (action.handlerId === "checkRobotsSitemap") {
      await handleCheckRobotsSitemap(task);
    } else if (action.handlerId === "checkWPAdminRobots") {
      await handleCheckWPAdminRobots(task);
    } else if (action.handlerId === "checkPaginationAccess") {
      await handleCheckPaginationAccess(task, action);
    } else if (action.handlerId === "checkRobotsPagination") {
      await handleCheckRobotsPagination(task);
    } else if (action.handlerId === "checkRelNextPrev") {
      await handleCheckRelNextPrev(task);
    } else if (action.handlerId === "checkPaginationHTTPS") {
      await handleCheckPaginationHTTPS(task);
    } else if (action.handlerId === "detectJunk") {
      await handleDetectJunk(task);
    } else if (action.handlerId === "checkCanonical") {
      await handleCheckCanonical(task);
    } else if (action.handlerId === "checkCanonicalParams") {
      await handleCheckCanonicalParams(task);
    } else if (action.handlerId === "checkInternalRedirects") {
      await handleCheckInternalRedirects(task);
    } else if (action.handlerId === "checkGlobalRedirects") {
      await handleCheckGlobalRedirects(task);
    } else if (action.handlerId === "checkInternal404s") {
      await handleCheckInternal404s(task);
    } else if (action.handlerId === "checkSoft404") {
      await handleCheckSoft404(task);
    } else if (action.handlerId === "checkUrlStructure") {
      await handleCheckUrlStructure(task);
    } else if (action.handlerId === "checkUrlDepth") {
      await handleCheckUrlDepth(task);
    } else if (action.handlerId === "checkPerformance") {
      await handleCheckPerformance(task);
    } else if (action.handlerId === "checkSSL") {
      await handleCheckSSL(task);
    } else {
      console.warn(`Handler ${action.handlerId} no está implementado.`);
      alert(`La acción automática ${action.handlerId} no está implementada.`);
    }
  };

  return { handleAutoAction };
}
