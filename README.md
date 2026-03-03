# 🚀 SEO On-Page Auditor

Una herramienta de auditoría interactiva para optimizar el **SEO Técnico** e **Indexación** de cualquier sitio web, priorizando la facilidad de uso y la automatización inteligente como alternativa rápida a herramientas pesadas de escritorio.

---

## 📸 Características

- **Auditoría Estructurada UX:** Un checklist minucioso segmentado en 10 niveles clave (Indexación, sitemaps, robots, paginadores, canónicas, 3xx, prevenciones 40x/500x, URLs y Core Web Vitals).
- **Auto-Corrección Activa (/auto):** Acciones automatizadas locales (con un solo clic el sistema hace el trabajo).
  - Lee el Sitemap en un milisegundo.
  - Captura tu puntuación en vivo del Lighthouse (PageSpeed).
  - Obtiene tus tiempos LCP en milímetros nativamente.
- **Instructivos de Manual Integrados:** Para checks técnicos pesados offline (como los Redirect Chains o bucles), se despliegan guías paso a paso con las técnicas sobre Google Search Console o Screaming Frog.
- **Persistencia en Bote (`.json` Export/Import):** Si se te va la luz, o trabajas media web un martes y media un miércoles, importa tu json y estarás donde lo dejaste.
- **Client-Side Export a Word `.docx` 📝:** Descarga la auditoría rellenada al 100% como un Documento Base oficial en anchos DXA para imprimirlo o entregárselo a tu cliente de agencia local.
- **Client-Side Export a `.md`:** Porque amamos nuestro markdown para pasárselo a la IA o trabajar con Notion.

## 🛠 Arquitectura Técnica (The House Way)

El desarrollo ha seguido principios estrictos de producto: **Zero-Dependencies Backend y SSR Free**.

| Core              | Librería/Tecnología                                    |
| ----------------- | ------------------------------------------------------ |
| **Framework**     | Vue 3 (Composition API / `<script setup>`)             |
| **Styling**       | Vanilla CSS + Tokens Nativos (Var / HSL) Glassmorphism |
| **Logic & State** | Store Pattern (`useAuditStore`) - No requiere Pinia.   |
| **Iconography**   | Lucide Vue Next                                        |
| **Networking**    | `fetch` (Full Client-Side browser APIs).               |
| **DOCX**          | Librería `docx`.                                       |

## 🚀 Instalación Local

Ejecutar la herramienta no requiere bases de datos (SQL, Mongo, etc). Todo vive en contexto.

1. **Clona el repositorio** o bájalo localmente.
2. Posiciónate en la carpeta raíz:

```bash
cd SeoOnPage
```

3. Instala los módulos nativos (Vue, Lucide, Docx):

```bash
npm install
```

4. Lanza el servidor en Vite:

```bash
npm run dev
```

> ⚠️ Localhost correrá habitualmente en `http://localhost:5173`. Ábrelo en tu navegador.

## 🔌 Requisitos para la Automatización (API Keys)

Esta herramienta cuenta con algunas validaciones Live, como la prueba visual y técnica de la Web, LCP, etc:

### Core Web Vitals (API Token de Googel Cloud)

Al hacer la prueba **Autoevaluar Core Web Vitals** te pedirá tu API.
Para obtener esta API de manera gratuita:

1. Asegúrate de tener una cuenta de Google activa.
2. Consigue tu Key en: [Google Cloud API - PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/get-started?hl=es-419)
3. Carga la Key cuando Auto-Audit te lo pida en un Prompt seguro y el local-server la usará para traernos los LCP en segundos.

## 🧠 ¿Cómo Usarlo? (Flujo de Agencia/Independiente)

1. **Inicia:** Dale nombre al Dominio Principal (ej: `www.tudominio.com`).
2. **Pasa los Módulos:** Ve abriendo módulos. Verás estados grises (Pending).
3. **Mágia Auto:** Aquellos que tengan la chapa mágica (Ej: Sitemap o PageSpeed API), dales clic. La herramienta los cumplimentará, o los fallará (rellenando las Notas del fallo como diagnóstico).
4. **Offline Manual:** Las tareas sin chapa se evalúan de forma remota según te indica la Guía Verde y pulsando el botón manual `✅ (Pasa)` o `❌ (Falla)`.
5. **Report:** Clic al botón Superior **"Exportar"** -> Elige entre `Descargar Markdown` o `Descargar DOCX`. Verás tu nombre, fecha, dominio y una tabla perfecta.
6. **Desconexión:** Descarga el Archivo `.JSON` antes de cerrar la ventana y lo retomaremos después.

---

Generado con ❤️ para profesionales del SEO técnico que repudian los Excels estáticos.
