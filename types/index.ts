export interface TabMemoryInfo {
    tabId: number;
    title: string;
    url: string;
    favicon?: string;
    memoryUsageMB: number;
    cpuUsage: number;
    domain: string;
    lastAccessed: number;
    isActive: boolean;
}

export interface DomainGroup {
    domain: string;
    tabs: TabMemoryInfo[];
    totalMemoryUsageMB: number;
    tabCount: number;
}

export interface MemoryLeak {
    tabId: number;
    title: string;
    growthNumber: number;
    isLeak: boolean;
}

export interface MLPrediction {
    tabId: number;
    title: string;
    probability: number;
    suggestKeep: boolean;
}

export interface MemorySnapshot {
    timestamp: number;
    tabs: TabMemoryInfo[];
    totalMemoryUsageMB: number;
}