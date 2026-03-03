<script setup lang="ts">
import { computed } from "vue";
import { useAuditStore } from "../composables/useAuditStore";
import { useAutoAudit } from "../composables/useAutoAudit";
import type { AuditTask, TaskStatus } from "../data/checklist";
import {
  ChevronDown,
  Wrench,
  Eye,
  StickyNote,
  ExternalLink,
  Search,
  Zap,
  Layout,
  Globe,
  ImageIcon,
  X,
  UploadCloud,
  Loader2,
  ShieldCheck,
  BookOpen,
} from "lucide-vue-next";
import { ref } from "vue";

const props = defineProps<{
  task: AuditTask;
}>();

const {
  setTaskStatus,
  updateNotes,
  updateTaskInput,
  addImageToTask,
  removeImageFromTask,
  project,
} = useAuditStore();

const { handleAutoAction } = useAutoAudit();

const expanded = ref(false);
const showNotes = ref(!!props.task.notes || !!props.task.images?.length);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isProcessing = ref(false);

async function runAutoAction(task: any, action: any) {
  isProcessing.value = true;
  try {
    await handleAutoAction(task, action);
  } finally {
    isProcessing.value = false;
  }
}

function onInputUpdate(inputId: string, e: Event) {
  const target = e.target as HTMLInputElement;
  updateTaskInput(props.task.id, inputId, target.value);
}

function triggerImageUpload() {
  fileInputRef.value?.click();
}

function handleImageUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files?.length) return;
  const file = target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    if (ev.target?.result && typeof ev.target.result === "string") {
      addImageToTask(props.task.id, ev.target.result);
    }
  };
  reader.readAsDataURL(file);
}

function removeImage(idx: number) {
  removeImageFromTask(props.task.id, idx);
}

function processUrl(url: string) {
  if (!url) return "#";
  return url.replace(/{{domain}}/g, project.value.domain || "");
}

function processLabel(label: string) {
  if (!label) return "";
  return label.replace(/{{domain}}/g, project.value.domain || "");
}

function getActionIcon(iconName?: string) {
  const icons: Record<string, any> = {
    ExternalLink,
    Search,
    Zap,
    Layout,
    Globe,
    ShieldCheck,
  };
  return icons[iconName || "ExternalLink"] || ExternalLink;
}

const statusOptions: {
  value: TaskStatus;
  label: string;
  emoji: string;
  color: string;
}[] = [
  {
    value: "pending",
    label: "Pendiente",
    emoji: "⏳",
    color: "text-[var(--color-muted)]",
  },
  {
    value: "pass",
    label: "OK",
    emoji: "✅",
    color: "text-[var(--color-success-400)]",
  },
  {
    value: "fail",
    label: "Fallo",
    emoji: "❌",
    color: "text-[var(--color-danger-400)]",
  },
  {
    value: "na",
    label: "N/A",
    emoji: "➖",
    color: "text-[var(--color-muted)]",
  },
];

const currentStatus = computed(() => {
  const found = statusOptions.find((s) => s.value === props.task.status);
  return found || statusOptions[0];
});

function cycleStatus() {
  const idx = statusOptions.findIndex((s) => s.value === props.task.status);
  if (idx === -1) return;
  const next = statusOptions[(idx + 1) % statusOptions.length];
  if (next) {
    setTaskStatus(props.task.id, next.value);
  }
}

function onNotesInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  updateNotes(props.task.id, target.value);
}
</script>

<template>
  <div
    class="glass-card p-4 transition-all duration-200"
    :class="{
      'border-l-2 border-l-[var(--color-success-400)]/40':
        task.status === 'pass',
      'border-l-2 border-l-[var(--color-danger-400)]/40':
        task.status === 'fail',
      'border-l-2 border-l-[var(--color-muted)]/20': task.status === 'na',
    }"
  >
    <!-- Main row -->
    <div class="flex items-start gap-3">
      <!-- Status button -->
      <button
        @click="cycleStatus"
        class="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer"
        :class="{
          'bg-[var(--color-success-400)]/10': task.status === 'pass',
          'bg-[var(--color-danger-400)]/10': task.status === 'fail',
          'bg-[var(--color-surface-400)]/50':
            task.status === 'pending' || task.status === 'na',
        }"
        :title="`Estado: ${currentStatus?.label || ''}. Click para cambiar.`"
      >
        {{ currentStatus?.emoji || "" }}
      </button>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h4
          class="text-sm font-semibold leading-snug cursor-pointer select-none transition-colors"
          :class="{
            'text-[var(--color-text-primary)]': task.status === 'pending',
            'text-[var(--color-success-500)]': task.status === 'pass',
            'text-[var(--color-danger-500)]': task.status === 'fail',
            'text-[var(--color-text-muted)] line-through opacity-50':
              task.status === 'na',
          }"
          @click="expanded = !expanded"
        >
          {{ task.title }}
        </h4>

        <!-- Tool badge & Actions -->
        <div class="space-y-2 mt-2">
          <div class="flex items-center gap-1.5">
            <Wrench class="w-3 h-3 text-[var(--color-accent-400)]/50" />
            <span
              class="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)]"
              >{{ task.tool }}</span
            >
          </div>

          <!-- Functional Links / Actions -->
          <div v-if="task.actions?.length" class="flex flex-wrap gap-2 pt-1">
            <template v-for="action in task.actions" :key="action.label">
              <a
                v-if="action.type !== 'auto'"
                :href="processUrl(action.url || '')"
                target="_blank"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-accent-400)]/5 border border-[var(--color-accent-400)]/10 text-[10px] font-bold text-[var(--color-accent-500)] hover:bg-[var(--color-accent-400)]/10 hover:border-[var(--color-accent-400)]/20 transition-all group/action"
              >
                <component
                  :is="getActionIcon(action.icon)"
                  class="w-3 h-3 transition-transform group-hover/action:scale-110"
                />
                {{ processLabel(action.label) }}
              </a>
              <button
                v-else
                @click="() => runAutoAction(task, action)"
                :disabled="isProcessing"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-success-400)]/10 border border-[var(--color-success-400)]/20 text-[10px] font-bold text-[var(--color-success-500)] hover:bg-[var(--color-success-400)]/20 hover:border-[var(--color-success-400)]/30 transition-all group/action cursor-pointer disabled:opacity-50 disabled:cursor-wait"
              >
                <Loader2 v-if="isProcessing" class="w-3 h-3 animate-spin" />
                <component
                  v-else
                  :is="getActionIcon(action.icon)"
                  class="w-3 h-3 transition-transform group-hover/action:scale-110"
                />
                {{
                  isProcessing ? "Procesando..." : processLabel(action.label)
                }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Actions (Sidebar buttons) -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          @click="showNotes = !showNotes"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-[var(--color-surface-400)]/50 cursor-pointer"
          :class="{
            'text-[var(--color-accent-400)] bg-[var(--color-accent-400)]/10':
              showNotes || task.notes,
            'text-[var(--color-text-muted)]/50': !showNotes && !task.notes,
          }"
          title="Notas"
        >
          <StickyNote class="w-3.5 h-3.5" />
        </button>
        <button
          @click="expanded = !expanded"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-[var(--color-surface-400)]/50 text-[var(--color-text-muted)]/50 cursor-pointer"
          title="Detalles"
        >
          <ChevronDown
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': expanded }"
          />
        </button>
      </div>
    </div>

    <!-- Expanded: What to check & Guide -->
    <Transition name="slide">
      <div
        v-if="expanded"
        class="mt-3 ml-12 pl-4 border-l-2 border-[var(--color-glass-border)] space-y-3 pb-1"
      >
        <div class="flex items-start gap-2">
          <Eye
            class="w-3.5 h-3.5 text-[var(--color-accent-400)]/40 mt-0.5 flex-shrink-0"
          />
          <p
            class="text-xs text-[var(--color-text-secondary)] leading-relaxed italic"
          >
            {{ task.whatToCheck }}
          </p>
        </div>

        <!-- Step by Step Guide -->
        <div
          v-if="task.guide"
          class="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-background)]/40 border border-[var(--color-glass-border)] shadow-sm"
        >
          <BookOpen
            class="w-4 h-4 text-[var(--color-accent-400)] flex-shrink-0 opacity-80 mt-0.5"
          />
          <div
            class="text-[11px] text-[var(--color-text-secondary)] leading-relaxed flex-1"
          >
            <h5
              class="font-bold text-[var(--color-text-primary)] uppercase tracking-widest text-[9px] mb-1.5 opacity-70"
            >
              Cómo hacerlo paso a paso
            </h5>
            <div class="space-y-1" v-html="task.guide"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Notes / Inputs / Images -->
    <Transition name="slide">
      <div v-if="showNotes" class="mt-3 ml-12 space-y-3">
        <!-- Custom Inputs -->
        <div
          v-if="task.inputs?.length"
          class="grid grid-cols-2 gap-3 pb-1 border-b border-[var(--color-glass-border)]"
        >
          <div
            v-for="input in task.inputs"
            :key="input.id"
            class="flex flex-col gap-1.5"
          >
            <div class="flex items-center justify-between">
              <label
                class="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider"
                >{{ input.label }}</label
              >
              <a
                v-if="input.helperLink"
                :href="input.helperLink"
                target="_blank"
                class="text-[9px] font-semibold text-[var(--color-accent-400)] hover:underline flex items-center gap-1 opacity-70 hover:opacity-100 transition-all"
              >
                <ExternalLink class="w-2.5 h-2.5" />
                {{ input.helperText || "Ayuda" }}
              </a>
            </div>
            <input
              :type="input.type"
              :value="input.value"
              @input="(e) => onInputUpdate(input.id, e)"
              :placeholder="input.placeholder"
              class="w-full bg-[var(--color-surface-100)] border border-[var(--color-glass-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-400)]/30 transition-all font-mono shadow-inner"
            />
          </div>
        </div>

        <textarea
          :value="task.notes"
          @input="onNotesInput"
          placeholder="Añade observaciones sobre esta tarea..."
          rows="2"
          class="w-full bg-[var(--color-surface-100)] border border-[var(--color-glass-border)] rounded-xl px-4 py-3 text-xs text-[var(--color-text-secondary)] placeholder-[var(--color-text-muted)]/50 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-400)]/20 transition-all shadow-inner"
        />

        <!-- Images section -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span
              class="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5"
            >
              <ImageIcon class="w-3.5 h-3.5" />
              Capturas ({{ task.images?.length || 0 }})
            </span>
            <button
              @click="triggerImageUpload"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-accent-400)]/10 text-[var(--color-accent-500)] text-[10px] font-bold hover:bg-[var(--color-accent-400)]/20 transition-colors"
            >
              <UploadCloud class="w-3.5 h-3.5" />
              Añadir
            </button>
            <input
              type="file"
              ref="fileInputRef"
              accept="image/*"
              class="hidden"
              @change="handleImageUpload"
            />
          </div>

          <div
            v-if="task.images?.length"
            class="flex gap-2 overflow-x-auto pb-2 snap-x"
          >
            <div
              v-for="(img, idx) in task.images"
              :key="idx"
              class="relative w-[120px] h-[80px] rounded-lg bg-[var(--color-surface-100)] border border-[var(--color-glass-border)] flex-shrink-0 snap-start overflow-hidden group shadow-sm hover:shadow-md transition-shadow cursor-default"
            >
              <img :src="img" class="w-full h-full object-cover" />
              <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]"
              >
                <button
                  @click="removeImage(idx)"
                  class="w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 hover:scale-110 transition-all"
                  title="Eliminar captura"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}
.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
