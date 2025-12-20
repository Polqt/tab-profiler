import type { TabMemoryInfo } from "@/types";
import { getAllTabsMemory } from "@/utils/memoryCalculator";

export function useTabMemory() {
    // Reactive state
    const tabs = ref<TabMemoryInfo[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const totalMemory = ref(0);

    // Interval ID for cleanup
    let intervalId: number | null = null;

    /**
     * Fetch fresh memory data for all tabs
     */
    async function refreshMemory() {
        try {
            loading.value = true;
            error.value = null;

            // Get memory info for all tabs
            tabs.value = await getAllTabsMemory();
            
            // Calculate total memory
            totalMemory.value = tabs.value.reduce(
                (sum, tab) => sum + tab.memoryUsageMB, 
                0
            );
            
        } catch (e) {
            error.value = 'Failed to fetch tab memory data.';
            console.error('Error fetching tab memory:', e);
        } finally {
            loading.value = false;
        }
    }

    /**
     * Close a specific tab
     */
    async function closeTab(tabId: number) {
        try {
            await chrome.tabs.remove(tabId);
            // Refresh to update the list
            await refreshMemory();
        } catch (e) {
            console.error(`Failed to close tab ${tabId}:`, e);
        }
    }

    /**
     * Hibernate (discard) a tab to free memory
     * 
     * chrome.tabs.discard() unloads the tab from memory
     * but keeps it in the tab bar. When user clicks it,
     * it reloads automatically.
     * 
     * Note: Cannot discard the active tab!
     */
    async function hibernateTab(tabId: number) {
        try {
            await chrome.tabs.discard(tabId);
            // Refresh to show updated memory
            await refreshMemory();
        } catch (e) {
            console.error(`Failed to hibernate tab ${tabId}:`, e);
            // Tab might be active or already discarded
        }
    }

    /**
     * Hibernate multiple tabs at once
     */
    async function hibernateTabs(tabIds: number[]) {
        for (const tabId of tabIds) {
            try {
                await chrome.tabs.discard(tabId);
            } catch (e) {
                // Continue with other tabs even if one fails
            }
        }
        await refreshMemory();
    }

    /**
     * Focus on a specific tab
     */
    async function focusTab(tabId: number) {
        try {
            const tab = await chrome.tabs.get(tabId);
            if (tab.windowId) {
                await chrome.windows.update(tab.windowId, { focused: true });
            }
            await chrome.tabs.update(tabId, { active: true });
        } catch (e) {
            console.error(`Failed to focus tab ${tabId}:`, e);
        }
    }

    // Setup: Run when component mounts
    onMounted(() => {
        // Initial data fetch
        refreshMemory();
        
        // Set up auto-refresh every 5 seconds
        intervalId = window.setInterval(refreshMemory, 5000);
    });

    // Cleanup: Run when component unmounts
    onUnmounted(() => {
        // Clear the interval to prevent memory leaks
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    });

    // Return everything the component needs
    return {
        // Reactive data
        tabs,
        loading,
        error,
        totalMemory,
        
        // Actions
        refreshMemory,
        closeTab,
        hibernateTab,
        hibernateTabs,
        focusTab,
    };
}