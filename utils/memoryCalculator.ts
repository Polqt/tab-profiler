import { TabMemoryInfo } from "@/types";

export function getDomain(url: string): string {
    if (!url.trim()) return 'unknown';

    try {
        const urlObj = new URL(url);

        return urlObj.hostname.replace(/^www\./, '');
    } catch {
        return 'Unknown'
    }
}

export function estimateMemoryFromTab(tab: chrome.tabs.Tab): number {
    let estimate = 50;


    const url = tab.url || '';

    const heavySites = ['youtube.com', 'netflix.com', 'twitch.tv', 'kick.com'];

    if (heavySites.some(site => url.includes(site))) {
        estimate += 150
    }

    const mediumSites = ['facebook.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'x.com']

    if (mediumSites.some(site => url.includes(site))) {
        estimate += 80
    }

    const devSites = ['github.com', 'stackoverflow.com', 'gitlab.com', 'codepen.io']

    if (devSites.some(site => url.includes(site))) {
        estimate += 60
    }

    if (tab.active) {
        estimate += 30
    }

    if (tab.pinned) {
        estimate += 20
    }

    return estimate
}

async function getProcessMemory(tabId: number): Promise<number | null> {
    if (!(chrome as any).processes) return null;

    try {
        const processes = await (chrome as any).processes.getProcessInfo([], true)

        for (const process of Object.values(processes)) {
            if ((process as any).tasks) {
                for (const task of (process as any).tasks) {
                    if (task.tabId === tabId) {
                        const memoryMB = ((process as any).privateMemory || 0 ) / 1024 / 1024;

                        return Math.round(memoryMB * 100) / 100;
                    }
                }
            }
        }

        return null;
    } catch (error) {
        console.warn('Failed to et process memory: ', error)
        return null;
    }
}

export async function getAllTabsMemory(): Promise<TabMemoryInfo[]> {
    const tabs = await chrome.tabs.query({});

    const results : TabMemoryInfo[] = [];

    for (const tab of tabs) {
        if (!tab.id) continue;

        let memoryMB = await getProcessMemory(tab.id);

        if (memoryMB === null) {
            memoryMB = estimateMemoryFromTab(tab);
        }

        const tabInfo: TabMemoryInfo = {
            tabId: tab.id,
            title: tab.title || 'Untitled',
            url: tab.url || '',
            favicon: tab.favIconUrl,
            domain: getDomain(tab.url || ''),
            memoryUsageMB: memoryMB,
            cpuUsage: 0,
            lastAccessed: tab.lastAccessed || Date.now(),
            isActive: tab.active || false,
        }
        results.push(tabInfo);
    }

    results.sort((a, b) => b.memoryUsageMB - a.memoryUsageMB);

    return results;
}

export function calculateHealthScore(tab: TabMemoryInfo): number {
    let score = 100;

    // Penalty for high memory usage
    // Every 50MB above 100MB costs 10 points
    if (tab.memoryUsageMB > 100) {
        const memoryPenalty = Math.floor((tab.memoryUsageMB - 100) / 50) * 10;
        score -= Math.min(memoryPenalty, 40)
    }

    // Penalty for olt abs
    // Tabs not accessed in the last hour lose points
    const hoursSinceAccess = (Date.now() - tab.lastAccessed) / (1000 * 60 * 60)

    if (hoursSinceAccess > 1) {
        const timePenalty = Math.floor(hoursSinceAccess) * 5;
        score -= Math.min(timePenalty, 30)
    }

    // Bonus for active tab
    // The tab you're currently using gets a bonus
    if (tab.isActive) {
        score += 10
    }

    return Math.max(0, Math.min(100, score))
};

export function formatMemory(memoryMB: number): string {
    if (memoryMB >= 1024) {
        return `${(memoryMB / 1024).toFixed(1)} GB`
    }

    return `${memoryMB.toFixed(1)} MB`
}
