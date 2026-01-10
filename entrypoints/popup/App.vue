<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTabMemory } from '@/composables/useTabMemory';
import { groupTabsByDomain } from '@/utils/tabGrouper';
import { formatMemory } from '@/utils/memoryCalculator';
import type { MemoryLeak } from '@/types';
import TabList from './components/TabList.vue';
import MemoryChart from './components/MemoryChart.vue';
import MLPredictions from './components/MLPredictions.vue';

// Use our composable for tab memory data
const { 
  tabs, 
  loading, 
  error, 
  totalMemory, 
  refreshMemory, 
  closeTab, 
  hibernateTab 
} = useTabMemory();

// Local state
const activeTab = ref<'tabs' | 'charts' | 'ai'>('tabs');
const leaks = ref<MemoryLeak[]>([]);

// Computed: Domain groups for chart
const domainGroups = computed(() => {
  return groupTabsByDomain(tabs.value);
});

// Load memory leaks from storage
async function loadLeaks() {
  try {
    const data = await chrome.storage.local.get('memoryLeaks');
    leaks.value = (data.memoryLeaks as any[] | undefined) || [];
  } catch (e) {
    console.error('Error loading leaks:', e);
  }
}

// Storage change listener
const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
  if (changes.memoryLeaks) {
    leaks.value = (changes.memoryLeaks.newValue as MemoryLeak[] | undefined) || [];
  }
};

// Lifecycle
onMounted(() => {
  loadLeaks();
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener(storageListener);
});

// Cleanup listener on unmount to prevent memory leaks
onUnmounted(() => {
  chrome.storage.onChanged.removeListener(storageListener);
});
</script>

<template>
  <div class="w-[420px] min-h-[500px] max-h-[600px] flex flex-col bg-gray-50">
    <!-- Header -->
    <header class="shrink-0 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div>
            <h1 class="font-bold text-gray-800">Tab Profiler</h1>
            <p class="text-xs text-gray-500">
              {{ tabs.length }} tabs • {{ formatMemory(totalMemory) }}
            </p>
          </div>
        </div>
        
        <!-- Refresh Button -->
        <button
          @click="refreshMemory"
          :disabled="loading"
          class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg 
            class="w-5 h-5" 
            :class="{ 'animate-spin': loading }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>
    </header>
    
    <!-- Tab Navigation -->
    <nav class="shrink-0 flex bg-white border-b border-gray-200">
      <button
        v-for="tab in [
          { id: 'tabs', label: 'Tabs', icon: 'M4 6h16M4 12h16M4 18h7' },
          { id: 'charts', label: 'Charts', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { id: 'ai', label: 'AI', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' }
        ]"
        :key="tab.id"
        @click="activeTab = tab.id as any"
        class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
        :class="activeTab === tab.id 
          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon"/>
        </svg>
        {{ tab.label }}
      </button>
    </nav>
    
    <!-- Error State -->
    <div v-if="error" class="flex-1 flex items-center justify-center p-4">
      <div class="text-center">
        <svg class="w-12 h-12 mx-auto text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-red-600 font-medium">{{ error }}</p>
        <button
          @click="refreshMemory"
          class="mt-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else-if="loading && tabs.length === 0" class="flex-1 flex items-center justify-center">
      <div class="flex items-center gap-2 text-gray-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        <span>Loading tab data...</span>
      </div>
    </div>
    
    <!-- Content Area -->
    <main v-else class="flex-1 overflow-y-auto p-4">
      <!-- Tabs View -->
      <TabList
        v-if="activeTab === 'tabs'"
        :tabs="tabs"
        :leaks="leaks"
        @close="closeTab"
        @hibernate="hibernateTab"
        @refresh="refreshMemory"
      />
      
      <!-- Charts View -->
      <div v-else-if="activeTab === 'charts'" class="space-y-4">
        <MemoryChart :domain-groups="domainGroups" />
        
        <!-- Memory Stats -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white p-3 rounded-lg border border-gray-200">
            <p class="text-xs text-gray-500">Total Memory</p>
            <p class="text-lg font-bold text-gray-800">{{ formatMemory(totalMemory) }}</p>
          </div>
          <div class="bg-white p-3 rounded-lg border border-gray-200">
            <p class="text-xs text-gray-500">Unique Domains</p>
            <p class="text-lg font-bold text-gray-800">{{ domainGroups.length }}</p>
          </div>
          <div class="bg-white p-3 rounded-lg border border-gray-200">
            <p class="text-xs text-gray-500">Avg per Tab</p>
            <p class="text-lg font-bold text-gray-800">
              {{ tabs.length > 0 ? formatMemory(totalMemory / tabs.length) : '0 MB' }}
            </p>
          </div>
          <div class="bg-white p-3 rounded-lg border border-gray-200">
            <p class="text-xs text-gray-500">Memory Leaks</p>
            <p class="text-lg font-bold" :class="leaks.length > 0 ? 'text-red-600' : 'text-green-600'">
              {{ leaks.length }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- AI Suggestions View -->
      <div v-else-if="activeTab === 'ai'" class="bg-white rounded-xl border border-gray-200 p-4">
        <MLPredictions
          :tabs="tabs"
          @close="closeTab"
          @hibernate="hibernateTab"
        />
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="shrink-0 px-4 py-2 bg-white border-t border-gray-200 text-center">
      <p class="text-xs text-gray-400">
        Tab Memory Profiler • Made with ❤️
      </p>
    </footer>
  </div>
</template>


<style scoped>
/* Custom scrollbar */
main::-webkit-scrollbar {
  width: 6px;
}

main::-webkit-scrollbar-track {
  background: transparent;
}

main::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

main::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
