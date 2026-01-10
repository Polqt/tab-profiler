import type { AppSettings, MemoryLeak, MemorySnapshot, TabSession, UsagePattern } from '@/types';
import { STORAGE_LIMITS } from '@/constants/config';

const KEYS = {
  SESSIONS: 'tabSessions',
  PATTERNS: 'usagePatterns',
  SETTINGS: 'appSettings',
  SNAPSHOTS: 'memorySnapshots',
  LEAKS: 'memoryLeaks',
  LAST_SNAPSHOT: 'lastSnapshotTime',
} as const; // readonly

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

const DEFAULT_SETTINGS: AppSettings = {
  refreshInterval: 5000,
  theme: 'system',
  notifications: {
    enabled: true,
    leakAlerts: true,
    highMemoryThreshold: 500,
    soundEnable: false,
  },
  autoHibernateIdleMinutes: 60,
  showHealthScores: true,
};

/**
 * Get data from Chrome local storage
 *
 * @param key - Storage key to retrieve
 * @param defaultValue - Value to return if key doesn't exist
 * @returns The stored value or defaultValue
 *
 * Example usage:
 *   const sessions = await getStorage<TabSession[]>('sessions', []);
 */

async function getStorage<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const result = await chrome.storage.local.get(key);

    return (result[key] as T) ?? defaultValue;
  } catch (error) {
    console.error(`Error getting storage key ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Save data to Chrome local storage
 *
 * @param key - Storage key to set
 * @param value - Value to store
 */
async function setStorage<T>(key: string, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error(`Error setting storage key ${key}:`, error);
    throw error;
  }
}

export async function getSessions(): Promise<TabSession[]> {
  return getStorage<TabSession[]>(KEYS.SESSIONS, []);
}

/**
 * Save a new session
 *
 * @param session - Session to save
 */
export async function saveSession(session: TabSession): Promise<void> {
  const sessions = await getSessions();
  sessions.push(session);
  await setStorage(KEYS.SESSIONS, sessions);
}

/**
 * Delete a session by ID
 *
 * @param sessionId - ID of the session to delete
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await getSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  await setStorage(KEYS.SESSIONS, filtered);
}

export async function updateSession(session: TabSession): Promise<void> {
  const sessions = await getSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index !== -1) {
    sessions[index] = session;
    await setStorage(KEYS.SESSIONS, sessions);
  }
}

/**
 * Get usage patterns for ML training
 *
 * @param limit - Maximum number of patterns to retrieve
 */
export async function getUsagePatterns(limit = 1000): Promise<UsagePattern[]> {
  const patterns = await getStorage<UsagePattern[]>(KEYS.PATTERNS, []);
  return patterns.slice(-limit);
}

export async function addUsagePattern(pattern: UsagePattern): Promise<void> {
  const patterns = await getStorage<UsagePattern[]>(KEYS.PATTERNS, []);
  patterns.push(pattern);

  if (patterns.length > STORAGE_LIMITS.MAX_PATTERNS) {
    patterns.splice(0, patterns.length - STORAGE_LIMITS.MAX_PATTERNS);
  }

  await setStorage(KEYS.PATTERNS, patterns);
}

export async function getSettings(): Promise<AppSettings> {
  const stored = await getStorage<Partial<AppSettings>>(KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

/**
 * Update settings
 *
 * @param updates - Settings to update
 */
export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  const merged = { ...current, ...updates };
  await setStorage(KEYS.SETTINGS, merged);
}

/**
 * Get recent memory snapshots
 *
 * @param count - Number of snapshots to retrieve
 */
export async function getSnapshots(count = 100): Promise<MemorySnapshot[]> {
  const snapshots = await getStorage<MemorySnapshot[]>(KEYS.SNAPSHOTS, []);
  return snapshots.slice(-count);
}

export async function saveSnapshot(snapshot: MemorySnapshot): Promise<void> {
  const snapshots = await getStorage<MemorySnapshot[]>(KEYS.SNAPSHOTS, []);
  snapshots.push(snapshot);

  if (snapshots.length > STORAGE_LIMITS.MAX_SNAPSHOTS) {
    snapshots.splice(0, snapshots.length - STORAGE_LIMITS.MAX_SNAPSHOTS);
  }

  await setStorage(KEYS.SNAPSHOTS, snapshots);
}

export async function getMemoryLeaks(): Promise<MemoryLeak[]> {
  return getStorage<MemoryLeak[]>(KEYS.LEAKS, []);
}

export async function saveMemoryLeak(leak: MemoryLeak): Promise<void> {
  const leaks = await getMemoryLeaks();
  const index = leaks.findIndex((l) => l.tabId === leak.tabId);

  if (index !== -1) {
    leaks[index] = leak;
  } else {
    leaks.push(leak);
  }

  await setStorage(KEYS.LEAKS, leaks);
}

export async function removeMemoryLeak(tabId: number): Promise<void> {
  const leaks = await getMemoryLeaks();
  const filter = leaks.filter((l) => l.tabId !== tabId);
  await setStorage(KEYS.LEAKS, filter);
}

export async function clearAllStorage(): Promise<void> {
  await chrome.storage.local.clear();
}
