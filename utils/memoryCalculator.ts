import type { TabMemoryInfo } from '@/types';
import {
  SITE_MEMORY_ESTIMATES,
  HEAVY_SITES,
  MEDIUM_SITES,
  DEV_SITES,
  HEALTH_SCORE,
} from '@/constants/config';

export function getDomain(url: string): string {
  if (!url.trim()) return 'unknown';

  try {
    const urlObj = new URL(url);

    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown';
  }
}

export function estimateMemoryFromTab(tab: chrome.tabs.Tab): number {
  let estimate = SITE_MEMORY_ESTIMATES.BASE;

  const url = tab.url || '';

  if (HEAVY_SITES.some((site) => url.includes(site))) {
    estimate += SITE_MEMORY_ESTIMATES.HEAVY_SITE_BONUS;
  }

  if (MEDIUM_SITES.some((site) => url.includes(site))) {
    estimate += SITE_MEMORY_ESTIMATES.MEDIUM_SITE_BONUS;
  }

  if (DEV_SITES.some((site) => url.includes(site))) {
    estimate += SITE_MEMORY_ESTIMATES.DEV_SITE_BONUS;
  }

  if (tab.active) {
    estimate += SITE_MEMORY_ESTIMATES.ACTIVE_TAB_BONUS;
  }

  if (tab.pinned) {
    estimate += SITE_MEMORY_ESTIMATES.PINNED_TAB_BONUS;
  }

  return estimate;
}

async function getProcessMemory(tabId: number): Promise<number | null> {
  if (!(chrome as any).processes) return null;

  try {
    const processes = await (chrome as any).processes.getProcessInfo([], true);

    for (const process of Object.values(processes)) {
      if ((process as any).tasks) {
        for (const task of (process as any).tasks) {
          if (task.tabId === tabId) {
            const memoryMB = ((process as any).privateMemory || 0) / 1024 / 1024;

            return Math.round(memoryMB * 100) / 100;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.warn('Failed to get process memory:', error);
    return null;
  }
}

/**
 * Creates TabMemoryInfo for a single tab
 */
async function createTabMemoryInfo(tab: chrome.tabs.Tab): Promise<TabMemoryInfo | null> {
  if (!tab.id) return null;

  let memoryMB = await getProcessMemory(tab.id);

  if (memoryMB === null) {
    memoryMB = estimateMemoryFromTab(tab);
  }

  return {
    tabId: tab.id,
    title: tab.title || 'Untitled',
    url: tab.url || '',
    favicon: tab.favIconUrl,
    domain: getDomain(tab.url || ''),
    memoryUsageMB: memoryMB,
    cpuUsage: 0,
    lastAccessed: tab.lastAccessed || Date.now(),
    isActive: tab.active || false,
    isDiscarded: tab.discarded || false,
  };
}

/**
 * Fetches memory info for all tabs in parallel for better performance
 */
export async function getAllTabsMemory(): Promise<TabMemoryInfo[]> {
  const tabs = await chrome.tabs.query({});

  // Process all tabs in parallel instead of sequentially
  const results = await Promise.all(tabs.map((tab) => createTabMemoryInfo(tab)));

  // Filter out null results and sort by memory usage
  return results
    .filter((tab): tab is TabMemoryInfo => tab !== null)
    .sort((a, b) => b.memoryUsageMB - a.memoryUsageMB);
}

export function calculateHealthScore(tab: TabMemoryInfo): number {
  let score = HEALTH_SCORE.MAX;

  // Penalty for high memory usage
  // Every 50MB above 100MB costs 10 points
  if (tab.memoryUsageMB > HEALTH_SCORE.MEMORY_PENALTY_THRESHOLD) {
    const memoryPenalty =
      Math.floor(
        (tab.memoryUsageMB - HEALTH_SCORE.MEMORY_PENALTY_THRESHOLD) /
          HEALTH_SCORE.MEMORY_PENALTY_STEP
      ) * HEALTH_SCORE.MEMORY_PENALTY_POINTS;
    score -= Math.min(memoryPenalty, HEALTH_SCORE.MEMORY_PENALTY_MAX);
  }

  // Penalty for old tabs
  // Tabs not accessed in the last hour lose points
  const hoursSinceAccess = (Date.now() - tab.lastAccessed) / (1000 * 60 * 60);

  if (hoursSinceAccess > 1) {
    const timePenalty = Math.floor(hoursSinceAccess) * HEALTH_SCORE.TIME_PENALTY_POINTS;
    score -= Math.min(timePenalty, HEALTH_SCORE.TIME_PENALTY_MAX);
  }

  // Bonus for active tab
  // The tab you're currently using gets a bonus
  if (tab.isActive) {
    score += HEALTH_SCORE.ACTIVE_TAB_BONUS;
  }

  return Math.max(0, Math.min(HEALTH_SCORE.MAX, score));
}

export function formatMemory(memoryMB: number): string {
  if (memoryMB >= 1024) {
    return `${(memoryMB / 1024).toFixed(1)} GB`;
  }

  return `${memoryMB.toFixed(1)} MB`;
}
