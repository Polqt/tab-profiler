import { MemoryLeak, TabMemoryInfo } from "@/types";
import { getSettings } from "./storage";

/**
 * Show a browser notification.
 * 
 * @param title - The title of the notification.
 * @param message - The message body of the notification.
 * @param priority - The priority level of the notification.
 */
async function showNotification(
    title: string,
    message: string,
    priority: 0 | 1 | 2 = 1
): Promise<void> {
    try {
        await chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL("icon/48.png"),
            title,
            message,
            priority,
            requireInteraction: priority === 2, // Keep high priority notifications until dismissed
        })
    } catch (error) {
        console.error("Failed to show notification:", error);
    }
}

/**
 * Notify about a detected memory leak in a tab.
 * 
 * @param leak - Information about the memory leak.
 */
export async function notifyMemoryLeak(leak: MemoryLeak): Promise<void> {
    const settings = await getSettings();
    
    if (!settings.notifications.enabled || !settings.notifications.leakAlerts) {
        return;
    }

    await showNotification(
        '⚠️ Memory Leak Detected',
        `"${leak.title}" is consuming ${leak.memoryHistory[leak.memoryHistory.length - 1].toFixed(1)} MB and growing.`,
        2
    )
}

/**
 * Notify about high memory usage
 * 
 * @param tab - The tab information.
 * @param memoryMB - The current memory usage in MB.
 */
export async function notifyHighMemory(tab: TabMemoryInfo, memoryMB: number): Promise<void> {
    const settings = await getSettings();

    if (!settings.notifications.enabled) {
        return;
    }

    if (memoryMB < settings.notifications.highMemoryThreshold) {
        return;
    }

    await showNotification(
        'High Memory Usage Alert',
        `"${tab.title}" is using ${memoryMB.toFixed(1)} MB of memory.`,
        1
    )
}

/**
 * Notify about total browser memory usage exceeding threshold.
 * 
 * @param totalMemoryMB - The total memory usage in MB.
 * @param tabCount - The number of open tabs.
 */
export async function notifyTotalMemory(totalMemoryMB: number, tabCount: number): Promise<void> {
    const settings = await getSettings();

    if (!settings.notifications.enabled) {
        return;
    }

    if (totalMemoryMB < 2048) {
        return;
    }

    await showNotification(
        'Total Browser Memory Usage High',
        `${tabCount} tabs are using a total of ${(totalMemoryMB / 1024).toFixed(1)} GB total memory. Consider closing some tabs.`,
        1
    )
}

/**
 * Notify about successful bulk hibernation
 * 
 * @param count - The number of tabs hibernated.
 * @param memorySavedMB - The total memory saved in MB.
 */
export async function notifyHibernateSuccess(count: number, memorySavedMB: number): Promise<void> {
    await showNotification(
        'Tabs Hibernated Successfully',
        `${count} tabs hibernated, freeing up ${memorySavedMB.toFixed(1)} MB of memory.`,
        0
    )
}