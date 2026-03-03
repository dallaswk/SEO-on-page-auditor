# Checklist Auditoría SEO Técnica

> Basado en la estructura del informe técnico SEO On-Page

---

## 1. Páginas Indexadas

| Tarea                                       | Herramienta                                | Qué mirar                                                       | ✅  |
| ------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- | --- |
| Comprobar nº de URLs indexadas              | Google Search Console / `site:dominio.com` | ¿El número es coherente con el tamaño real del sitio?           | ☐   |
| Rastrear el dominio con herramienta técnica | Screaming Frog / Ahrefs / Sitebulb         | ¿Cuántas URLs válidas (2xx) hay? ¿Hay ruido de indexación?      | ☐   |
| Detectar páginas indexadas no deseadas      | Google Search Console → Cobertura          | Buscar 404s, páginas staging, duplicados, thin content indexado | ☐   |

---

## 2. Sitemap XML

| Tarea                                            | Herramienta                            | Qué mirar                                                      | ✅  |
| ------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------- | --- |
| Verificar existencia y accesibilidad del sitemap | Browser / Google Search Console        | ¿Está en `/sitemap.xml` o `/sitemap_index.xml`? ¿Responde 200? | ☐   |
| Revisar estructura del sitemap index             | Screaming Frog → Sitemaps / XML Viewer | ¿Hay sitemaps por tipo de contenido? ¿Están todos activos?     | ☐   |
| Comprobar URLs dentro de cada sitemap            | Screaming Frog / Ahrefs Site Audit     | ¿Contienen URLs 301, 404 o noindex? Eliminarlas.               | ☐   |
| Añadir sitemap de imágenes/vídeos si procede     | Yoast SEO / RankMath / Plugin CMS      | ¿Hay contenido multimedia relevante sin sitemap específico?    | ☐   |
| Enviar sitemaps a Search Console                 | Google Search Console → Sitemaps       | ¿Están enviados y sin errores? ¿Fecha de última lectura?       | ☐   |

---

## 3. Robots.txt y Meta Robots

| Tarea                                                  | Herramienta                              | Qué mirar                                                         | ✅  |
| ------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------- | --- |
| Verificar robots.txt accesible y sin bloqueos críticos | Browser (`/robots.txt`) / Screaming Frog | ¿Bloquea CSS, JS, imágenes o páginas necesarias?                  | ☐   |
| Comprobar que el Sitemap apunta a HTTPS                | Editar robots.txt manualmente            | La directiva `Sitemap:` debe usar `https://`                      | ☐   |
| Revisar reglas Disallow para admin WordPress           | robots.txt manual                        | Añadir `/wp-admin/`, `/wp-login.php`, `/cgi-bin/`                 | ☐   |
| Auditar meta robots por página                         | Screaming Frog → Directivas / noindex    | ¿Hay páginas importantes con `noindex` o `nofollow` accidentales? | ☐   |

---

## 4. Paginadores

| Tarea                                                  | Herramienta                      | Qué mirar                                                         | ✅  |
| ------------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------- | --- |
| Comprobar funcionamiento de paginación                 | Browser / Screaming Frog         | ¿Los enlaces `/page/2/`, `/page/3/` son rastreables y accesibles? | ☐   |
| Revisar si la paginación está bloqueada en robots.txt  | robots.txt + Screaming Frog      | ¿Alguna regla `Disallow` afecta a `/page/`?                       | ☐   |
| Implementar `rel=next` / `rel=prev` en listados largos | Código fuente / Yoast / RankMath | Listados con >3 páginas deberían tener estas etiquetas            | ☐   |
| Consistencia de URLs de paginación en HTTPS            | Screaming Frog → Filtro por URL  | ¿Todas las páginas paginadas usan HTTPS y estructura uniforme?    | ☐   |

---

## 5. Etiquetas Canonical

| Tarea                                                    | Herramienta                            | Qué mirar                                                      | ✅  |
| -------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------- | --- |
| Verificar canonical autodeclarado en todas las páginas   | Screaming Frog → Canonical / Ahrefs    | ¿Todas las páginas indexables tienen su canonical correcto?    | ☐   |
| Detectar canonicals apuntando a HTTP o dominio distinto  | Screaming Frog → Filtro Canonical      | Deben apuntar siempre a la versión HTTPS del mismo dominio     | ☐   |
| Revisar páginas con 301 que tienen canonical activo      | Screaming Frog → Status + Canonical    | Las páginas redirigidas no deben tener canonical propio        | ☐   |
| Gestionar duplicados con canonical (filtros, parámetros) | Google Search Console / Screaming Frog | ¿Hay variantes de URL por parámetros? Consolidar con canonical | ☐   |

---

## 6. Redirecciones Internas

| Tarea                                                        | Herramienta                         | Qué mirar                                                  | ✅  |
| ------------------------------------------------------------ | ----------------------------------- | ---------------------------------------------------------- | --- |
| Rastrear todas las redirecciones 3xx internas                | Screaming Frog → Filtro 3xx         | ¿Cuántas hay? ¿Son 301 o 302?                              | ☐   |
| Identificar cadenas y bucles de redirección                  | Screaming Frog → Redirect Chains    | Cada salto adicional consume crawl budget                  | ☐   |
| Actualizar enlaces internos que apuntan a URLs redirigidas   | Screaming Frog → Inlinks sobre 301s | Sustituirlos por la URL final directa                      | ☐   |
| Revisar plantillas generadoras de redirecciones sistemáticas | CMS / Dev                           | ¿Alguna categoría o tipo de contenido genera 301s masivos? | ☐   |

---

## 7. Errores de Rastreo (4xx / 5xx)

| Tarea                                   | Herramienta                                        | Qué mirar                                                  | ✅  |
| --------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- | --- |
| Detectar URLs con error 404             | Screaming Frog / Google Search Console → Cobertura | ¿Están enlazadas internamente? ¿Tienen backlinks externos? | ☐   |
| Revisar errores en Search Console       | Google Search Console → Cobertura / Experiencia    | Clasificar: excluidas, con advertencias, con errores       | ☐   |
| Redirigir o eliminar 404s con backlinks | Ahrefs → Broken Backlinks                          | Las 404 con enlaces entrantes deben redirigirse (301)      | ☐   |

---

## 8. URLs Amigables

| Tarea                                                | Herramienta                       | Qué mirar                                                     | ✅  |
| ---------------------------------------------------- | --------------------------------- | ------------------------------------------------------------- | --- |
| Auditar estructura general de URLs                   | Screaming Frog → URL column       | ¿Son cortas, descriptivas, con guiones y sin parámetros?      | ☐   |
| Detectar URLs con doble barra o caracteres raros     | Screaming Frog → Filtro URL       | Buscar `//`, mayúsculas, caracteres codificados (`%20`, etc.) | ☐   |
| Verificar profundidad máxima de URL (máx. 3 niveles) | Screaming Frog → URL Depth        | URLs con profundidad >4 pierden relevancia en rastreo         | ☐   |
| Homogeneizar minúsculas y separadores                | CMS / `.htaccess` / redirecciones | ¿Todo en minúsculas? ¿Solo guiones, sin guiones bajos?        | ☐   |

---

## 9. Core Web Vitals

| Tarea                                               | Herramienta                               | Qué mirar                                                   | ✅  |
| --------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------- | --- |
| Medir LCP (Largest Contentful Paint)                | PageSpeed Insights / Search Console → CWV | Objetivo: <2,5s. Identificar el elemento LCP (imagen/texto) | ☐   |
| Medir INP (Interaction to Next Paint)               | PageSpeed Insights / CrUX                 | Objetivo: <200ms. Revisar JS que bloquea el hilo principal  | ☐   |
| Medir CLS (Cumulative Layout Shift)                 | PageSpeed Insights / Lighthouse           | Objetivo: <0,1. Buscar imágenes sin dimensiones, banners    | ☐   |
| Revisar métricas en móvil Y escritorio por separado | PageSpeed Insights / Search Console       | Móvil suele ser más crítico; priorizar mejoras ahí          | ☐   |
| Identificar recursos bloqueantes (CSS/JS)           | PageSpeed Insights → Oportunidades        | Defer JS, Critical CSS, lazy load imágenes                  | ☐   |

---

## 10. HTTPS / Seguridad SSL

| Tarea                                             | Herramienta                                | Qué mirar                                                       | ✅  |
| ------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- | --- |
| Verificar certificado SSL válido y vigente        | Browser (candado) / SSL Labs (ssllabs.com) | ¿Emitido por CA reconocida? ¿Fecha de expiración?               | ☐   |
| Comprobar redirección de HTTP → HTTPS             | Browser / Screaming Frog                   | Acceder a `http://` debe redirigir automáticamente a `https://` | ☐   |
| Detectar contenido mixto (mixed content)          | Browser DevTools / Screaming Frog → Mixed  | ¿Hay recursos (img, scripts, CSS) servidos por HTTP?            | ☐   |
| Actualizar enlaces internos de HTTP a HTTPS       | Screaming Frog + CMS / DB                  | Especialmente en `/wp-content/uploads/` y recursos incrustados  | ☐   |
| Verificar que `robots.txt` Sitemap apunta a HTTPS | robots.txt manual                          | La URL del sitemap debe ser `https://`                          | ☐   |
| Comprobar URLs HTTP accesibles sin redirección    | Screaming Frog / curl                      | Todas las versiones HTTP deben redirigir 301 a HTTPS            | ☐   |

---

## Herramientas de referencia

| Herramienta                     | Uso principal                                                             |
| ------------------------------- | ------------------------------------------------------------------------- |
| **Google Search Console**       | Indexación, cobertura, Core Web Vitals, sitemaps                          |
| **Screaming Frog**              | Rastreo técnico completo (errores, redirects, canonicals, meta robots...) |
| **Ahrefs / Semrush / Sitebulb** | Auditoría avanzada, backlinks, broken links                               |
| **PageSpeed Insights**          | Core Web Vitals, rendimiento móvil y escritorio                           |
| **SSL Labs** (ssllabs.com)      | Análisis del certificado SSL                                              |
| **Browser DevTools**            | Contenido mixto, errores de consola, rendimiento                          |
| **Yoast SEO / RankMath**        | Configuración de canonical, meta robots, sitemaps en WordPress            |
