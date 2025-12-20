<script setup lang="ts">
import { MLPrediction, TabMemoryInfo } from '@/types';
import { tabPredictor } from '@/utils/mlModel';
import { ref, watch } from 'vue';


    interface Props {
        tabs: TabMemoryInfo[];
    }

    const props = defineProps<Props>();

    const emit = defineEmits<{
        close: [tabId: number];
        hibernate: [tabId: number];
    }>();

    const predictions = ref<MLPrediction[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    watch(() => props.tabs, async () => {
        await generatePredictions();
    }, { immediate: true });

    async function generatePredictions() {
        loading.value = true;
        error.value = null;

        try {
            predictions.value = await tabPredictor.getPredictions(props.tabs);

            predictions.value.sort((a, b) => b.probability - a.probability);
        } catch (e) {
            console.error('Error generating ML predictions:', e);
            error.value = 'Failed to generate predictions.';
        } finally {
            loading.value = false;
        }
    }

    function getConfidenceColor(confidence: string): string {
        switch(confidence) {
            case 'high': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    }

    function getProbabilityColor(probability: number): string {
        if (probability > 0.7) return 'bg-green-500';
        if (probability > 0.4) return 'bg-yellow-500';
        return 'bg-red-500';
    }
</script>

<template>
    <div class="ml-predictions space-y-3">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="font-semibold text-gray-800">AI Suggestions</h3>
                <p class="text-xs text-gray-500">Based on your usage patterns</p>
            </div>
            <button
                @click="generatePredictions"
                :disabled="loading"
                class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
                <svg 
                    class="w-5 h-5" 
                    :class="{ 'animate-spin': loading }"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
            </button>
        </div>
    
    <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="flex items-center gap-2 text-gray-400">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Analyzing usage patterns...</span>
        </div>
    </div>

    <div v-else-if="error" class="text-center py-4">
        <p class="text-red-600 text-sm">{{ error }}</p>
    </div>

    <div v-else-if="predictions.length > 0" class="space-y-2">
        <div class="bg-green-50 rounded-lg p-3 border border-green-200">
            <h4 class="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Keep These (Likely to use soon)
            </h4>
            <div class="space-y-2">
                <div
                    v-for="pred in predictions.filter(p => p.suggestKeep)"
                    :key="pred.tabId"
                    class="bg-white rounded-lg p-2 border border-green-200"
                >
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">{{ pred.title }}</p>
                            <p class="text-xs text-gray-500 mt-1">{{ pred.reasoning }}</p>
                        </div>
                        <div class="shrink-0 text-right">
                            <span
                                class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
                                :class="getConfidenceColor(pred.confidence)"
                            >
                                {{ (pred.probability * 100).toFixed(0) }}%
                            </span>
                        </div>
                    </div>
                    <div class="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            class="h-full rounded-full transition-all"
                            :class="getProbabilityColor(pred.probability)"
                            :style="{ width: `${pred.probability * 100}%` }"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <h4 class="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                Consider Closing (Unlikely to use)
            </h4>
            <div class="space-y-2">
                <div
                    v-for="pred in predictions.filter(p => !p.suggestKeep).slice(0, 5)"
                    :key="pred.tabId"
                    class="bg-white rounded-lg p-2 border border-orange-200"
                >
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">{{ pred.title }}</p>
                            <p class="text-xs text-gray-500 mt-1">{{ pred.reasoning }}</p>
                        </div>
                        <div class="shrink-0 text-right">
                            <span
                                class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
                                :class="getConfidenceColor(pred.confidence)"
                            >
                                {{ (pred.probability * 100).toFixed(0) }}%
                            </span>
                        </div>
                    </div>
                    <div class="mt-2 flex gap-2">
                        <button
                            @click="emit('hibernate', pred.tabId)"
                            class="flex-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                        >
                            Hibernate
                        </button>
                        <button
                            @click="emit('close', pred.tabId)"
                            class="flex-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="text-center py-8">
        <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        <p class="text-gray-500 font-medium">Not enough data yet</p>
        <p class="text-xs text-gray-400 mt-1">Use tabs normally to train the AI</p>
    </div>
    </div>
</template>
