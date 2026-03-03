<script setup lang="ts">
import { useAuditStore } from "../composables/useAuditStore";
import {
  CheckCircle2,
  BarChart3,
  Globe,
  User,
  Calendar,
} from "lucide-vue-next";

const { project, sectionProgress, globalProgress, totalTasks, completedTasks } =
  useAuditStore();

const sectionIcons: Record<number, string> = {
  1: "📄",
  2: "🗺️",
  3: "🤖",
  4: "📑",
  5: "🏷️",
  6: "🔀",
  7: "🚨",
  8: "🔗",
  9: "⚡",
  10: "🔒",
};

function scrollToSection(id: string) {
  const el = document.getElementById(`section-${id}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
</script>

<template>
  <aside
    class="w-72 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--color-glass-border)] bg-[var(--color-surface-100)] transition-colors duration-300"
  >
    <!-- Logo / Brand -->
    <div class="p-5 border-b border-[var(--color-glass-border)]">
      <div class="flex items-center gap-2.5">
        <div
          class="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-400)] to-[var(--color-accent-500)] flex items-center justify-center shadow-lg shadow-accent-400/20"
        >
          <BarChart3 class="w-4 h-4 text-white" />
        </div>
        <div>
          <h1
            class="text-sm font-bold text-[var(--color-text-primary)] tracking-tight"
          >
            SEO Auditor
          </h1>
          <p
            class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold"
          >
            On-Page
          </p>
        </div>
      </div>
    </div>

    <!-- Project Info -->
    <div class="p-4 border-b border-[var(--color-glass-border)] space-y-2.5">
      <div class="flex items-center gap-2">
        <Globe class="w-3.5 h-3.5 text-[var(--color-accent-400)]/60" />
        <input
          v-model="project.domain"
          placeholder="dominio.com"
          class="flex-1 bg-transparent text-xs text-[var(--color-text-secondary)] placeholder-[var(--color-text-muted)]/50 focus:outline-none border-b border-transparent focus:border-[var(--color-accent-400)]/30 pb-0.5 transition-all"
        />
      </div>
      <div class="flex items-center gap-2">
        <User class="w-3.5 h-3.5 text-[var(--color-accent-400)]/60" />
        <input
          v-model="project.auditor"
          placeholder="Nombre del auditor"
          class="flex-1 bg-transparent text-xs text-[var(--color-text-secondary)] placeholder-[var(--color-text-muted)]/50 focus:outline-none border-b border-transparent focus:border-[var(--color-accent-400)]/30 pb-0.5 transition-all"
        />
      </div>
      <div class="flex items-center gap-2">
        <Calendar class="w-3.5 h-3.5 text-[var(--color-accent-400)]/60" />
        <input
          type="date"
          v-model="project.startDate"
          class="flex-1 bg-transparent text-xs text-[var(--color-text-secondary)] focus:outline-none border-b border-transparent focus:border-[var(--color-accent-400)]/30 pb-0.5 transition-all scheme-dark:text-white"
        />
      </div>
    </div>

    <!-- Global Progress -->
    <div class="p-4 border-b border-[var(--color-glass-border)]">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-[var(--color-text-muted)]"
          >Progreso global</span
        >
        <span
          class="text-xs font-semibold tabular-nums"
          :class="{
            'text-[var(--color-accent-400)]': globalProgress < 100,
            'text-[var(--color-success-400)]': globalProgress === 100,
          }"
        >
          {{ globalProgress }}%
        </span>
      </div>
      <div
        class="w-full h-2 bg-[var(--color-surface-300)] rounded-full overflow-hidden"
      >
        <div
          class="h-full rounded-full transition-all duration-700 ease-out"
          :class="{
            'bg-gradient-to-r from-[var(--color-accent-400)] to-[var(--color-accent-500)]':
              globalProgress < 100,
            'bg-gradient-to-r from-[var(--color-success-400)] to-emerald-400':
              globalProgress === 100,
          }"
          :style="{ width: globalProgress + '%' }"
        />
      </div>
      <p class="text-[10px] text-[var(--color-text-muted)] mt-1.5 tabular-nums">
        {{ completedTasks }} de {{ totalTasks }} tareas
      </p>
    </div>

    <!-- Section Nav -->
    <nav class="flex-1 overflow-y-auto p-2 space-y-0.5">
      <button
        v-for="section in project.sections"
        :key="section.id"
        @click="scrollToSection(section.id)"
        class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 hover:bg-[var(--color-accent-400)]/5 group cursor-pointer"
      >
        <span class="text-sm shadow-sm">{{
          sectionIcons[section.number] || "📋"
        }}</span>
        <div class="flex-1 min-w-0">
          <span
            class="text-xs text-[var(--color-text-secondary)]/70 group-hover:text-[var(--color-text-primary)] transition-colors block truncate"
          >
            {{ section.title }}
          </span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[10px] text-[var(--color-text-muted)] tabular-nums">
            {{ sectionProgress(section).done }}/{{
              sectionProgress(section).total
            }}
          </span>
          <CheckCircle2
            v-if="sectionProgress(section).percent === 100"
            class="w-3 h-3 text-[var(--color-success-400)]"
          />
        </div>
      </button>
    </nav>

    <!-- Footer -->
    <div class="p-3 border-t border-white/5 text-center">
      <p class="text-[10px] text-[var(--color-muted)]">
        v1.0 — SEO On-Page Auditor
      </p>
    </div>
  </aside>
</template>
