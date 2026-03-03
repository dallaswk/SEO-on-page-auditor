import { ref, computed, watch } from "vue";
import localforage from "localforage";
import {
  defaultChecklist,
  type AuditProject,
  type AuditSection,
  type TaskStatus,
} from "../data/checklist";

const STORAGE_KEY = "seo-audit-project-db";
const THEME_KEY = "seo-audit-theme";

// Configure localforage
localforage.config({
  name: "SEO-Auditor",
  storeName: "audit_data",
});

function createDefaultProject(): AuditProject {
  const today = new Date().toISOString().split("T")[0] || "";
  return {
    domain: "",
    auditor: "",
    startDate: today,
    endDate: "",
    psiApiKey: "",
    scrapedData: {},
    sections: JSON.parse(JSON.stringify(defaultChecklist)),
  };
}

// Singleton reactive state
const project = ref<AuditProject>(createDefaultProject());
const isLoaded = ref(false);
const theme = ref<"dark" | "light">(
  (localStorage.getItem(THEME_KEY) as any) || "dark",
);

// Async load function
async function initStore() {
  try {
    let stored = await localforage.getItem<AuditProject>(STORAGE_KEY);

    // One-time migration from localStorage
    if (!stored) {
      const legacyData = localStorage.getItem("seo-audit-project");
      if (legacyData) {
        console.log("Migrando datos de localStorage a IndexedDB...");
        stored = JSON.parse(legacyData);
        await localforage.setItem(STORAGE_KEY, stored);
        // We keep localstorage for a bit just in case, or we could remove it:
        // localStorage.removeItem("seo-audit-project");
      }
    }

    if (stored) {
      // Merge logic to preserve data while receiving updates from defaultChecklist
      const mergedSections = defaultChecklist.map((defaultSection) => {
        const storedSection = stored.sections?.find(
          (s) => s.id === defaultSection.id,
        );

        return {
          ...JSON.parse(JSON.stringify(defaultSection)),
          tasks: defaultSection.tasks.map((defaultTask) => {
            const storedTask = storedSection?.tasks?.find(
              (t) => t.id === defaultTask.id,
            );

            return {
              ...JSON.parse(JSON.stringify(defaultTask)),
              status: storedTask?.status ?? defaultTask.status,
              notes: storedTask?.notes ?? defaultTask.notes,
              inputs: defaultTask.inputs?.map((defI) => {
                const storedInput = storedTask?.inputs?.find(
                  (i) => i.id === defI.id,
                );
                return {
                  ...defI,
                  value: storedInput?.value ?? defI.value,
                };
              }),
              images: storedTask?.images ?? [],
            };
          }),
        };
      });

      project.value = {
        ...stored,
        sections: mergedSections,
      };
    }
  } catch (e) {
    console.error("Failed to load audit data from IndexedDB:", e);
  } finally {
    isLoaded.value = true;
  }
}

// Initialize immediately
initStore();

export function useAuditStore() {
  // Sync theme with document and storage (Theme stays in localStorage as it's small and needs to be sync for flashing)
  watch(
    theme,
    (val) => {
      localStorage.setItem(THEME_KEY, val);
      if (val === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    },
    { immediate: true },
  );

  // Auto-save on changes (Debounced save to IndexedDB)
  let saveTimeout: any = null;
  watch(
    project,
    (val) => {
      if (!isLoaded.value) return; // Don't save while initial loading is happening

      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        try {
          await localforage.setItem(
            STORAGE_KEY,
            JSON.parse(JSON.stringify(val)),
          );
        } catch (e) {
          console.error("Failed to save audit data to IndexedDB:", e);
        }
      }, 500); // 500ms debounce
    },
    { deep: true },
  );

  const totalTasks = computed(() =>
    project.value.sections.reduce((acc, s) => acc + s.tasks.length, 0),
  );

  const completedTasks = computed(() =>
    project.value.sections.reduce(
      (acc, s) => acc + s.tasks.filter((t) => t.status !== "pending").length,
      0,
    ),
  );

  const globalProgress = computed(() =>
    totalTasks.value > 0
      ? Math.round((completedTasks.value / totalTasks.value) * 100)
      : 0,
  );

  function sectionProgress(section: AuditSection) {
    const total = section.tasks.length;
    const done = section.tasks.filter((t) => t.status !== "pending").length;
    return {
      total,
      done,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }

  function setTaskStatus(taskId: string, status: TaskStatus) {
    for (const section of project.value.sections) {
      const task = section.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = status;
        break;
      }
    }
  }

  function updateNotes(taskId: string, notes: string) {
    for (const section of project.value.sections) {
      const task = section.tasks.find((t) => t.id === taskId);
      if (task) {
        task.notes = notes;
        break;
      }
    }
  }

  function updateTaskInput(
    taskId: string,
    inputId: string,
    value: string | number,
  ) {
    for (const section of project.value.sections) {
      const task = section.tasks.find((t) => t.id === taskId);
      if (task?.inputs) {
        const input = task.inputs.find((i) => i.id === inputId);
        if (input) {
          input.value = value;
          break;
        }
      }
    }
  }

  function addImageToTask(taskId: string, base64Image: string) {
    for (const section of project.value.sections) {
      const task = section.tasks.find((t) => t.id === taskId);
      if (task) {
        if (!task.images) task.images = [];
        task.images.push(base64Image);
        break;
      }
    }
  }

  function removeImageFromTask(taskId: string, index: number) {
    for (const section of project.value.sections) {
      const task = section.tasks.find((t) => t.id === taskId);
      if (task?.images) {
        task.images.splice(index, 1);
        break;
      }
    }
  }

  function resetAudit() {
    project.value = createDefaultProject();
  }

  function exportToMarkdown(): string {
    const p = project.value;
    const statusEmoji: Record<TaskStatus, string> = {
      pass: "✅",
      fail: "❌",
      na: "➖",
      pending: "⏳",
    };

    let md = `# Informe Auditoría SEO Técnica\n\n`;
    md += `> **Dominio:** ${p.domain || "(no especificado)"}\n`;
    md += `> **Auditor:** ${p.auditor || "(no especificado)"}\n`;
    md += `> **Fecha inicio:** ${p.startDate || "—"}\n`;
    md += `> **Fecha fin:** ${p.endDate || "—"}\n`;
    md += `> **Progreso:** ${completedTasks.value}/${totalTasks.value} tareas (${globalProgress.value}%)\n\n`;
    md += `---\n\n`;

    for (const section of p.sections) {
      const sp = sectionProgress(section);
      md += `## ${section.number}. ${section.title} (${sp.done}/${sp.total})\n\n`;
      md += `| Estado | Tarea | Herramienta | Observaciones |\n`;
      md += `| :----: | ----- | ----------- | ------------- |\n`;

      for (const task of section.tasks) {
        const emoji = statusEmoji[task.status];
        const notes = task.notes
          ? task.notes.replace(/\n/g, " ").replace(/\|/g, "\\|")
          : "—";
        md += `| ${emoji} | ${task.title} | ${task.tool} | ${notes} |\n`;
      }
      md += `\n---\n\n`;
    }

    md += `*Generado con SEO On-Page Auditor — ${new Date().toLocaleDateString("es-ES")}*\n`;
    return md;
  }

  function exportToJson(): string {
    return JSON.stringify(project.value, null, 2);
  }

  function importFromJson(jsonString: string): boolean {
    try {
      const parsedData = JSON.parse(jsonString);
      if (
        parsedData &&
        typeof parsedData === "object" &&
        Array.isArray(parsedData.sections)
      ) {
        // Asignación directa actualizará el estado reactivo y forzará guardado
        project.value = parsedData;
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error al importar JSON:", e);
      return false;
    }
  }

  return {
    project,
    theme,
    toggleTheme: () =>
      (theme.value = theme.value === "dark" ? "light" : "dark"),
    totalTasks,
    completedTasks,
    globalProgress,
    sectionProgress,
    setTaskStatus,
    updateNotes,
    updateTaskInput,
    addImageToTask,
    removeImageFromTask,
    resetAudit,
    exportToMarkdown,
    exportToJson,
    importFromJson,
  };
}
