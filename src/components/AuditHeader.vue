<script setup lang="ts">
import { useAuditStore } from "../composables/useAuditStore";
import { useExportDocx } from "../composables/useExportDocx";
import {
  Download,
  RotateCcw,
  FileText,
  FileType,
  CheckCircle2,
  Sun,
  Moon,
  UploadCloud,
  Save,
} from "lucide-vue-next";
import { ref } from "vue";

const {
  globalProgress,
  completedTasks,
  totalTasks,
  exportToMarkdown,
  exportToJson,
  importFromJson,
  resetAudit,
  project,
  theme,
  toggleTheme,
} = useAuditStore();

const { exportToDocx } = useExportDocx();

const showExport = ref(false);
const showResetConfirm = ref(false);
const copied = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const emit = defineEmits<{
  (e: "openExport"): void;
}>();

function handleExportOpen() {
  showExport.value = true;
}

function handleCopy() {
  const md = exportToMarkdown();
  navigator.clipboard.writeText(md).then(() => {
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  });
}

function handleDownload() {
  const md = exportToMarkdown();
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const domain = project.value.domain || "auditoria";
  a.href = url;
  a.download = `seo-audit-${domain}-${new Date().toISOString().split("T")[0]}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleDownloadJson() {
  const jsonStr = exportToJson();
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const domain = project.value.domain || "auditoria";
  a.href = url;
  a.download = `seo-audit-${domain}-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerImport() {
  fileInput.value?.click();
}

function handleImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content) {
      const success = importFromJson(content);
      if (success) {
        alert("Sesión de auditoría cargada correctamente.");
      } else {
        alert("Error: El archivo JSON no es válido o está corrupto.");
      }
    }
    target.value = "";
  };
  reader.readAsText(file);
}

async function handleDownloadDocx() {
  await exportToDocx(project.value);
}

function handleReset() {
  showResetConfirm.value = true;
}

function confirmReset() {
  resetAudit();
  showResetConfirm.value = false;
}
</script>

<template>
  <header
    class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[var(--color-surface-100)]/80 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300"
  >
    <div class="flex items-center gap-4">
      <div>
        <h2 class="text-lg font-bold text-[var(--color-text-primary)]">
          {{ project.domain || "Nueva Auditoría" }}
        </h2>
        <div class="flex items-center gap-3 mt-0.5">
          <span class="text-xs text-[var(--color-text-muted)] tabular-nums">
            {{ completedTasks }}/{{ totalTasks }} tareas
          </span>
          <div class="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="{
                'bg-[var(--color-accent-400)]': globalProgress < 100,
                'bg-[var(--color-success-400)]': globalProgress === 100,
              }"
              :style="{ width: globalProgress + '%' }"
            />
          </div>
          <span
            class="text-xs font-semibold tabular-nums"
            :class="{
              'text-[var(--color-accent-500)]': globalProgress < 100,
              'text-[var(--color-success-400)]': globalProgress === 100,
            }"
            >{{ globalProgress }}%</span
          >
          <CheckCircle2
            v-if="globalProgress === 100"
            class="w-4 h-4 text-[var(--color-success-400)]"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        class="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-surface-300)]/50 text-[var(--color-text-primary)]/60 hover:bg-[var(--color-surface-300)] hover:text-[var(--color-text-primary)] transition-all duration-150 cursor-pointer border border-[var(--color-glass-border)]"
        title="Cambiar tema"
      >
        <Sun v-if="theme === 'dark'" class="w-4 h-4" />
        <Moon v-else class="w-4 h-4" />
      </button>

      <div class="w-px h-6 bg-white/10 mx-1"></div>

      <!-- Import JSON -->
      <input
        type="file"
        ref="fileInput"
        accept=".json,application/json"
        class="hidden"
        @change="handleImport"
      />
      <button
        @click="triggerImport"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-300)]/50 text-[var(--color-text-primary)] text-xs font-medium hover:bg-[var(--color-surface-400)] transition-all duration-150 cursor-pointer border border-[var(--color-glass-border)]"
        title="Importar Sesión (.json)"
      >
        <UploadCloud class="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        Importar
      </button>

      <!-- Export JSON -->
      <button
        @click="handleDownloadJson"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-accent-400)]/10 text-[var(--color-accent-400)] text-xs font-medium hover:bg-[var(--color-accent-400)]/20 transition-all duration-150 cursor-pointer border border-[var(--color-accent-400)]/20"
        title="Guardar Sesión de Trabajo (.json)"
      >
        <Save class="w-3.5 h-3.5" />
        Guardar
      </button>

      <div class="w-px h-6 bg-white/10 mx-1"></div>

      <!-- Export Markdown Report (Modal) -->
      <button
        @click="handleExportOpen"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-accent-400)] text-white text-xs font-medium hover:bg-[var(--color-accent-400)]/90 transition-all duration-150 cursor-pointer shadow-sm shadow-accent-400/20"
      >
        <FileText class="w-3.5 h-3.5" />
        Exportar
      </button>

      <!-- Reset -->
      <button
        @click="handleReset"
        class="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 text-[var(--color-text-muted)] hover:bg-[var(--color-danger-400)]/10 hover:text-[var(--color-danger-500)] transition-all duration-150 cursor-pointer border border-transparent"
        title="Reiniciar auditoría"
      >
        <RotateCcw class="w-3.5 h-3.5" />
      </button>
    </div>
  </header>

  <!-- Export Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showExport"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showExport = false"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="showExport = false"
        />
        <div
          class="relative w-full max-w-2xl max-h-[80vh] flex flex-col glass-card bg-[var(--color-surface-200)] rounded-2xl overflow-hidden animate-fade-in-up"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between p-5 border-b border-[var(--color-glass-border)]"
          >
            <h3 class="text-base font-bold text-[var(--color-text-primary)]">
              Exportar Informe
            </h3>
            <button
              @click="showExport = false"
              class="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Preview -->
          <div
            class="flex-1 overflow-y-auto p-5 bg-[var(--color-surface-50)]/50"
          >
            <pre
              class="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap font-mono leading-relaxed bg-[var(--color-surface-100)] rounded-lg p-5 border border-[var(--color-glass-border)] shadow-inner"
              >{{ exportToMarkdown() }}</pre
            >
          </div>

          <!-- Actions -->
          <div
            class="flex items-center justify-end gap-2 p-4 border-t border-[var(--color-glass-border)] bg-[var(--color-surface-100)]/50"
          >
            <button
              @click="handleCopy"
              class="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer"
              :class="
                copied
                  ? 'bg-[var(--color-success-400)]/20 text-[var(--color-success-400)]'
                  : 'bg-[var(--color-surface-300)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-400)]'
              "
            >
              {{ copied ? "✓ Copiado" : "Copiar al portapapeles" }}
            </button>
            <button
              @click="handleDownload"
              class="px-4 py-2 rounded-lg bg-[var(--color-accent-400)] text-white text-xs font-medium hover:bg-[var(--color-accent-400)]/90 transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-md shadow-accent-400/20"
            >
              <Download class="w-3.5 h-3.5" />
              Descargar .md
            </button>
            <button
              @click="handleDownloadDocx"
              class="px-4 py-2 rounded-lg bg-[#2B5797] text-white text-xs font-medium hover:bg-[#2B5797]/90 transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#2B5797]/20"
            >
              <FileType class="w-3.5 h-3.5" />
              Descargar .docx
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Reset Confirm -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showResetConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showResetConfirm = false"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="showResetConfirm = false"
        />
        <div
          class="relative w-full max-w-sm glass-card bg-[var(--color-surface-200)] rounded-2xl p-6 animate-fade-in-up shadow-2xl"
        >
          <h3 class="text-base font-bold text-[var(--color-text-primary)] mb-2">
            ¿Reiniciar auditoría?
          </h3>
          <p
            class="text-xs text-[var(--color-text-muted)] mb-6 leading-relaxed"
          >
            Se perderán todos los datos: estados, notas y configuración del
            proyecto. Esta acción no se puede deshacer.
          </p>
          <div class="flex items-center justify-end gap-3">
            <button
              @click="showResetConfirm = false"
              class="px-4 py-2 rounded-lg bg-[var(--color-surface-400)]/30 text-[var(--color-text-secondary)] text-xs font-medium hover:bg-[var(--color-surface-400)]/50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="confirmReset"
              class="px-4 py-2 rounded-lg bg-[var(--color-danger-400)] text-white text-xs font-medium hover:bg-[var(--color-danger-500)] transition-colors cursor-pointer shadow-md shadow-danger-400/20"
            >
              Sí, reiniciar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
