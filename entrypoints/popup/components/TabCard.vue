<script setup lang="ts">
import { computed } from 'vue';
import { TabMemoryInfo } from '@/types';
import { calculateHealthScore, formatMemory } from '@/utils/memoryCalculator';


  interface Props {
    tab: TabMemoryInfo;
    isLeaking?: boolean;
    isHibernated?: boolean;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    close: [tabId: number];
    hibernate: [tabId: number];
  }>();

  const healthScore = computed(() => calculateHealthScore(props.tab));
  const formattedMemory = computed(() => formatMemory(props.tab.memoryUsageMB));
  const memoryColorClass = computed(() => {
    if (props.tab.memoryUsageMB > 500) return 'text-red-500 font-semibold';
    if (props.tab.memoryUsageMB > 200) return 'text-orange-500 font-semibold';
    if (props.tab.memoryUsageMB > 100) return 'text-yellow-500 font-semibold';
    return 'text-green-500 font-semibold';
  })

  async function switchToTab() {
    try {
      await chrome.tabs.update(props.tab.tabId, { active: true });

      const tab = await chrome.tabs.get(props.tab.tabId);
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    } catch (error) {
    console.error('Error switching to tab:', error);
    }
  }

  function onClose() {
    emit('close', props.tab.tabId);
  }

  function onHibernate() {
    emit('hibernate', props.tab.tabId);
  }

  function handleFaviconError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
</script>

<template>
  <div 
    class="bg-white rounded-lg border p-3 hover:shadow-md transition-all cursor-pointer"
    :class="{
      'border-red-300 bg-red-50' : isLeaking,
      'border-gray-200' : !isLeaking,
      'opacity-60' : isHibernated
    }"
    @click="switchToTab"
  >
    <div class="flex items-start gap-3">
      <div class="shrink-0 w-8 h-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
        <img 
          v-if="tab.favicon"
          :src="tab.favicon"
          :alt="tab.title"
          class="w-full h-full object-cover"
          @error="handleFaviconError"
        />
        <svg v-else class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-sm text-gray-900 truncate" :title="tab.title">
          {{ tab.title }}
        </h3>
        <p class="text-xs text-gray-500 truncate" :title="tab.url">
          {{ tab.domain }}
        </p>
      </div>

      <div class="shrink-0 text-right">
        <p class="text-sm font-bold" :class="memoryColorClass">
          {{ formattedMemory }}
        </p>
        <p class="text-xs text-gray-400">
          Health: {{ healthScore }}
        </p>
      </div>
    </div>

    <div v-if="isLeaking || isHibernated" class="mt-2 flex gap-2">
      <span v-if="isLeaking" class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        Memory Leak
      </span>
      <span v-if="isHibernated" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.5 2a3.5 3.5 0 101.665 6.58L8.585 10l-1.42 1.42a3.5 3.5 0 101.414 1.414l8.128-8.127a1 1 0 00-1.414-1.414L10 8.586 8.58 7.165A3.5 3.5 0 005.5 2zM4 5.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 9a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clip-rule="evenodd"/>
        </svg>
      </span>
    </div>

    <div class="mt-3 flex gap-2">
      <button
        @click.stop="onHibernate"
        :disabled="isHibernated || tab.isActive"
        class="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Unload tab from memory (can be restored)"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/>
        </svg>
        Hibernate
      </button>
      <button
        @click.stop="onClose"
        class="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
        title="Close this tab permanently"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Close
      </button>
    </div>
  </div>
</template>

