<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MemoryLeak, TabMemoryInfo } from '@/types';
import { getIdleTabs, getTopMemoryConsumers } from '@/utils/tabGrouper';
import TabCard from './TabCard.vue';


    interface Props {
        tabs: TabMemoryInfo[];
        leaks: MemoryLeak[];
    }

    const props = defineProps<Props>();

    const emit = defineEmits<{
        close: [tabId: number];
        hibernate: [tabId: number];
        refresh: [];
    }>();

    const searchQuery = ref('');

    const sortBy = ref<'memory' | 'name' | 'lastAccessed'>('memory');

    const sortDescending = ref(true);

    const viewMode = ref<'all' | 'idle' | 'heavy'>('all');

    const filteredTabs = computed(() => {
        let result = [...props.tabs];

        if (searchQuery.value.trim()) {
            const query = searchQuery.value.toLowerCase();
            result = result.filter(tab => 
                tab.title.toLowerCase().includes(query) ||
                tab.url.toLowerCase().includes(query) ||
                tab.domain.toLowerCase().includes(query)
            )
        }

        if (viewMode.value === 'idle') {
            result = getIdleTabs(result, 30);
        } else if (viewMode.value === 'heavy') {
            result = getTopMemoryConsumers(result, 10);
        }

        return result
    });

    const sortedTabs = computed(() => {
        const tabs = [...filteredTabs.value];

        tabs.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy.value) {
                case 'memory':
                    comparison = a.memoryUsageMB - b.memoryUsageMB;
                    break;
                case 'name':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'lastAccessed':
                    comparison = a.lastAccessed - b.lastAccessed;
                    break;
                default:
                    break;
            }
            return sortDescending.value ? -comparison : comparison;
        })
        return tabs;
    })

    const leakingTabIds = computed(() => {
        return new Set(props.leaks.map(leak => leak.tabId));
    })

    const summary = computed(() => {
        const total = props.tabs.length;
        const filtered = sortedTabs.value.length;
        const idle = getIdleTabs(props.tabs, 30).length;
        const heavy = props.tabs.filter(t => t.memoryUsageMB > 200).length;

        return { total, filtered, idle, heavy}
    })

    function handleSort(field: 'memory' | 'name' | 'lastAccessed') {
        if (sortBy.value === field) {
            sortDescending.value = !sortDescending.value;
        } else {
            sortBy.value = field;
            sortDescending.value = field === 'memory' || field === 'lastAccessed';
        }
    }

    function isLeaking(tabId: number): boolean {
        return leakingTabIds.value.has(tabId);
    }

    async function hibernateAllIdle() {
        const idleTabs = getIdleTabs(props.tabs, 30);
        for (const tab of idleTabs) {
            if (!tab.isActive) {
                emit('hibernate', tab.tabId);
            }
        }
    }
</script>


<template>
    <div class="tab-list space-y-3">
        <div class="flex flex-col gap-2">
            <div class="relative">
                <input 
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search tabs by title, URL, or domain..."
                    class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
            </div>

            <div class="flex gap-2 items-center">
                <select v-model="viewMode" class="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Tabs ({{ summary.total }})</option>
                    <option value="idle">Idle Tabs ({{ summary.idle }})</option>
                    <option value="heavy">Heavy Tabs ({{ summary.heavy }})</option>
                </select>

                <select
                    v-model="sortBy"
                    @change="handleSort(sortBy)"
                    class="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="memory">Sort by Memory</option>
                    <option value="name">Sort by Name</option>
                    <option value="lastAccessed">Sort by Last Accessed</option>
                </select>
                <button
                    @click="sortDescending = !sortDescending"
                    class="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    :title="sortDescending ? 'Descending' : 'Ascending'"
                >
                    <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path 
                            v-if="sortDescending"
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            stroke-width="2" 
                            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                        />
                        <path 
                            v-else
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            stroke-width="2" 
                            d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                        />
                    </svg>
                </button>
            </div>

            <div v-if="viewMode === 'idle'" class="flex gap-2">
                <button
                    @click="hibernateAllIdle"
                    class="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Hibernate All Idle Tabs
                </button>
            </div>
        </div>

        <div class="text-xs text-gray-500">
            Showing {{ sortedTabs.length }} of {{ summary.total }} tabs
        </div>

        <div v-if="sortedTabs.length" class="space-y-2">
            <TabCard 
                v-for="tab in sortedTabs"
                :key="tab.tabId"
                :tab="tab"
                :is-leaking="isLeaking(tab.tabId)"
                :is-hibernated="tab.isDiscarded"
                @close="emit('close', $event)"
                @hibernate="emit('hibernate', $event)"
            />
        </div>

        <div v-else class="text-center py-8">
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <p class="text-gray-500 font-medium">No tabs found</p>
            <p class="text-xs text-gray-400 mt-1">Try adjusting your filter</p>
        </div>
    </div>
</template>