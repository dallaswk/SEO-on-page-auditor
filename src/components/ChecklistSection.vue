<script setup lang="ts">
import { ref } from "vue";
import { useAuditStore } from "../composables/useAuditStore";
import type { AuditSection } from "../data/checklist";
import TaskCard from "./TaskCard.vue";
import { ChevronDown, CheckCircle2 } from "lucide-vue-next";

const props = defineProps<{
  section: AuditSection;
}>();

const { sectionProgress } = useAuditStore();
const collapsed = ref(false);

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
</script>

<template>
  <section :id="`section-${section.id}`" class="animate-fade-in-up">
    <!-- Section header -->
    <button
      @click="collapsed = !collapsed"
      class="w-full flex items-center gap-3 p-4 rounded-xl glass-card cursor-pointer group mb-3 hover:bg-[var(--color-glass-bg-hover)] transition-all"
    >
      <span class="text-xl drop-shadow-sm">{{
        sectionIcons[section.number] || "📋"
      }}</span>

      <div class="flex-1 text-left">
        <h2
          class="text-base font-semibold text-[var(--color-text-primary)] transition-colors"
        >
          {{ section.number }}. {{ section.title }}
        </h2>
        <div class="flex items-center gap-2 mt-1">
          <div
            class="flex-1 max-w-[200px] h-1.5 bg-[var(--color-surface-400)]/50 rounded-full overflow-hidden"
          >
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              :class="{
                'bg-[var(--color-accent-400)]':
                  sectionProgress(section).percent < 100,
                'bg-[var(--color-success-400)]':
                  sectionProgress(section).percent === 100,
              }"
              :style="{ width: sectionProgress(section).percent + '%' }"
            />
          </div>
          <span class="text-xs text-[var(--color-text-muted)] tabular-nums">
            {{ sectionProgress(section).done }}/{{
              sectionProgress(section).total
            }}
          </span>
          <CheckCircle2
            v-if="sectionProgress(section).percent === 100"
            class="w-4 h-4 text-[var(--color-success-400)]"
          />
        </div>
      </div>

      <ChevronDown
        class="w-5 h-5 text-[var(--color-text-muted)]/50 transition-transform duration-200"
        :class="{ 'rotate-180': !collapsed }"
      />
    </button>

    <!-- Tasks -->
    <Transition name="expand">
      <div v-if="!collapsed" class="space-y-2 pl-2 stagger-children">
        <TaskCard v-for="task in section.tasks" :key="task.id" :task="task" />
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
