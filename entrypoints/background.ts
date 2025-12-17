import { saveMemoryLeak } from '@/utils/storage';
import type { MemoryLeak } from '@/types';
import { notifyMemoryLeak } from '@/utils/notifications';

export default defineBackground(() => {
    // Store memory snapshots for leak detection
    const memoryHistory: Map<number, number[]> = new Map();

    chrome.alarms.create('memoryCheck', {
        periodInMinutes: 0.5
    })

    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'memoryCheck') {
            checkMemory();
        }
    })

    async function checkMemory() {
        try {
            const tabs = await chrome.tabs.query({})

            for (const tab of tabs) {
                if (!tab.id || !tab.url) continue;

                if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                    continue; 
                }

                // Use chrome.system.memory as chrome.processes is not available in modern Extensions API
                const memoryInfo = await chrome.system.memory.getInfo();
                const memoryMB = memoryInfo.availableCapacity / 1024 / 1024;

                if (!memoryHistory.has(tab.id)) {
                    memoryHistory.set(tab.id, [])
                }

                const history = memoryHistory.get(tab.id)!;
                history.push(memoryMB);

                if (history.length > 10) {
                    history.shift();
                }

                if (history.length >= 5) {
                    const isGrowing = checkIfGrowing(history);
                    if (isGrowing) {
                        console.warn(`Potential memory leak detected in tab ${tab.id} (${tab.url}). Memory usage history:`, history);

                        const firstValue = history[0];
                        const lastValue = history[history.length - 1];
                        const timeSpanMinutes = history.length * 0.5;
                        const growthRate = (lastValue - firstValue) / timeSpanMinutes;

                        const leak: MemoryLeak = {
                            tabId: tab.id,
                            title: tab.title || 'Untitled',
                            url: tab.url,
                            growthRate,
                            memoryHistory: [...history],
                            detectedAt: Date.now(),
                            isConfirmed: true,
                        };

                        await saveMemoryLeak(leak);
                        await notifyMemoryLeak(leak);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error checking memory:', error);
        }
    }

    function checkIfGrowing(history: number[]): boolean {
        let increase = 0;
        for (let i = 1; i < history.length; i++) {
            if (history[i] > history[i - 1]) {
                increase++;
            }
        }
        return increase >= history.length * 0.7
    }

    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        const timestamp = Date.now();

        const patterns = await chrome.storage.local.get('accessPatterns') || {
            accessPatterns: []
        }
        const accessList = (patterns.accessPatterns || []) as Array<{ tabId: number; timestamp: number }>;

        accessList.push({
            tabId: activeInfo.tabId,
            timestamp: timestamp
        })

        if (accessList.length > 500) {
            accessList.shift();
        }

        await chrome.storage.local.set({ accessPatterns: accessList });
    })
});