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
    isDiscarded?: boolean;
    healthScore?: number;
}

export interface DomainGroup {
    domain: string;
    tabs: TabMemoryInfo[];
    totalMemoryUsageMB: number;
    tabCount: number;
    healthScore?: number;
}

export interface MemoryLeak {
    tabId: number;
    title: string;
    url: string;
    growthRate: number;
    memoryHistory: number[];
    detectedAt: number;
    isConfirmed: boolean;
}

export interface MLPrediction {
    tabId: number;
    title: string;
    probability: number;
    suggestKeep: boolean;
    reasoning: string;
    confidence: 'high' | 'medium' | 'low';
}

export interface MemorySnapshot {
    timestamp: number;
    tabs: TabMemoryInfo[];
    totalMemoryUsageMB: number;
    tabCount: number;
}

export interface TabSession {
    id: string;
    name: string;
    createdAt: number;
    tabs: SavedTab[];
    tabCount: number;
}

export interface SavedTab {
    url: string;
    title: string;
    favicon?: string;
    pinned?: boolean;
}

export interface UsagePattern {
    tabId: number;
    domain: string;
    accessedAt: number;
    daysOfWeek: number;
    hourOfDay: number;
    duration: number;
}

export interface QuickAction {
    id: string;
    name: string;
    description: string;
    icon: string;
    action: 'hibernate' | 'close' | 'group';
    filter: TabFilter;
}

export interface TabFilter {
    domain?: string;
    olderThanMinutes?: number;
    memoryAboveMB?: number;
    excludeActive?: boolean;
    excludePinned?: boolean;
}

export interface NotificationConfig {
    enabled: boolean;
    leakAlerts: boolean;
    highMemoryThreshold: number;
    soundEnable: boolean;
}

export interface AppSettings {
    refreshInterval: number;
    theme: 'light' | 'dark' | 'system';
    notifications: NotificationConfig;
    autoHibernateIdleMinutes: number;
    showHealthScores: boolean;
}