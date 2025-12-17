<script lang="ts">
import { MemoryLeak, TabMemoryInfo } from '@/types';
import { getIdleTabs, getTopMemoryConsumers } from '@/utils/tabGrouper';


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
                />
            </div>
        </div>
    </div>
</template>