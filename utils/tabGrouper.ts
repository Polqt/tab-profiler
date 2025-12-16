import { DomainGroup, TabMemoryInfo } from "@/types";

export function groupTabsByDomain(tabs: TabMemoryInfo[]): DomainGroup[] {
    const domainMap = new Map<string, TabMemoryInfo[]>();

    for (const tab of tabs) {
        const domain = tab.domain

        if (domainMap.has(domain)) {
            domainMap.get(domain)!.push(tab);
        } else {
            domainMap.set(domain, [tab])
        }
    }

    const groups: DomainGroup[] = [];

    for (const [domain, domainTabs] of domainMap.entries()) {
        const totalMemory = domainTabs.reduce(
            (sum, tab) => sum + tab.memoryUsageMB,
            0
        );

        groups.push({
            domain: domain,
            tabs: domainTabs,
            totalMemoryUsageMB: Math.round(totalMemory * 100) / 100,
            tabCount: domainTabs.length,
        })
    }

    return groups;
}

export function findDuplicateTabs(tabs: TabMemoryInfo[]): Map<string, TabMemoryInfo[]> {
    const urlMap = new Map<string, TabMemoryInfo[]>();

    for (const tab of tabs) {
        if (!tab.url) continue

        const normalizedUrl = tab.url.replace(/\/$/, '')

        if (urlMap.has(normalizedUrl)) {
            urlMap.get(normalizedUrl)!.push(tab)
        } else {
            urlMap.set(normalizedUrl, [tab])
        }
    }

    const duplicates = new Map<string, TabMemoryInfo[]>();

    for (const [url, urlTabs] of urlMap.entries()) {
        if (urlTabs.length > 1) {
            duplicates.set(url, urlTabs)
        }
    }

    return duplicates
}

export function getTopMemoryConsumers(tabs: TabMemoryInfo[], count: number = 5): TabMemoryInfo[] {
    return [...tabs]
        .sort((a, b) => b.memoryUsageMB - a.memoryUsageMB)
        .slice(0, count)
}

export function getIdleTabs(tabs: TabMemoryInfo[], idleMinutes: number = 30): TabMemoryInfo[] {
    const cutoffTime = Date.now() - (idleMinutes * 60 * 1000)

    return tabs.filter(tab => {
        if (tab.isActive) return false;

        return tab.lastAccessed < cutoffTime;
    })
}

export function calculateDomainHealthScore(group: DomainGroup): number {
    let score = 100;

    if (group.totalMemoryUsageMB > 500) {
        score -= 30
    } else if (group.totalMemoryUsageMB > 300) {
        score -= 20
    } else if (group.totalMemoryUsageMB > 150) {
        score -= 10
    }

    if (group.tabCount > 10) {
        score -=20 
    } else if (group.tabCount > 5) {
        score -= 10
    }

    const avgMemory = group.totalMemoryUsageMB / group.tabCount;
    if (avgMemory > 200) {
        score -= 15
    }

    return Math.max(0, Math.min(100, score));
}

