<script setup lang="ts">
import SectionSidebar from "./components/SectionSidebar.vue";
import AuditHeader from "./components/AuditHeader.vue";
import ChecklistSection from "./components/ChecklistSection.vue";
import { useAuditStore } from "./composables/useAuditStore";

const { project } = useAuditStore();
</script>

<template>
  <div
    class="flex min-h-screen bg-[var(--color-surface-50)] transition-colors duration-300"
  >
    <!-- Sidebar -->
    <SectionSidebar />

    <!-- Main content -->
    <main class="flex-1 flex flex-col min-h-screen">
      <AuditHeader />

      <div class="flex-1 p-6 space-y-6 w-full">
        <ChecklistSection
          v-for="section in project.sections"
          :key="section.id"
          :section="section"
        />

        <!-- Footer -->
        <div class="text-center py-12 text-xs text-[var(--color-text-muted)]">
          <p class="font-medium">
            SEO On-Page Auditor — Auditoría técnica completa
          </p>
          <p class="mt-1 opacity-50">
            Los datos se guardan automáticamente en tu navegador
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
