<script setup lang="ts">
import { TabMemoryInfo } from '@/types';
import { calculateHealthScore, formatMemory } from '@/utils/memoryCalculator';


  interface Props {
    tab: TabMemoryInfo;
    isLeaking?: boolean;
    isHibernated?: boolean;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    close: [tabId: number];
    hibernate: [tabId: number];
  }>();

  const healthScore = computed(() => calculateHealthScore(props.tab));
  const formattedMemory = computed(() => formatMemory(props.tab.memoryUsageMB));
  const memoryColorClass = computed(() => {
    if (props.tab.memoryUsageMB > 500) return 'text-red-500 font-semibold';
    if (props.tab.memoryUsageMB > 200) return 'text-orange-500 font-semibold';
    if (props.tab.memoryUsageMB > 100) return 'text-yellow-500 font-semibold';
    return 'text-green-500 font-semibold';
  })

  async function switchToTab() {
    try {
      await chrome.tabs.update(props.tab.tabId, { active: true });

      const tab = await chrome.tabs.get(props.tab.tabId);
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    } catch (error) {
    console.error('Error switching to tab:', error);
    }
  }

  function onClose() {
    emit('close', props.tab.tabId);
  }

  function onHibernate() {
    emit('hibernate', props.tab.tabId);
  }

  function handleFaviconError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
</script>
