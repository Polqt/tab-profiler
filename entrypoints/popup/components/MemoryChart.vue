<template>
    <div class="bg-white rounded-lg shadow-md p-4">
        <h3 class="text-lg font-semibold mb-4 text-gray-800">Memory Usage by Domain</h3>
        <div class="relative" style="height: 250px;">
            <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
            <div v-else class="flex items-center justify-center h-full text-gray-400">
                No data available
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DomainGroup } from '@/types';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
    domainGroups: DomainGroup[];
}

const props = defineProps<Props>();

const chartData = computed(() => {
    if (!props.domainGroups || props.domainGroups.length === 0 ) {
        return null;
    }

    const topDomains = props.domainGroups.slice(0, 10);

    return {
        labels: topDomains.map(g => g.domain || 'Unknown'),
        datasets: [
            {
                label: 'Memory Usage (MB)',
                data: topDomains.map(g => g.totalMemoryUsageMB),
                backgroundColor: topDomains.map(g => {
                    if (g.totalMemoryUsageMB > 500) return 'rgba(239, 68, 68, 0.8)';
                    if (g.totalMemoryUsageMB > 200) return 'rgba(245, 158, 11, 0.8)';
                    if (g.totalMemoryUsageMB > 100) return 'rgba(234, 179, 8, 0.8)';
                    return 'rgba(34, 197, 94, 0.8)';
                }),
                borderColor: topDomains.map(g => {
                    if (g.totalMemoryUsageMB > 500) return 'rgba(239, 68, 68, 1)';
                    if (g.totalMemoryUsageMB > 200) return 'rgba(245, 158, 11, 1)';
                    if (g.totalMemoryUsageMB > 100) return 'rgba(234, 179, 8, 1)';
                    return 'rgba(34, 197, 61, 1)';
                }),
                borderWidth: 1
            }
        ]
    }
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            callbacks: {
                label: (context: { dataIndex: number }) => {
                    const domain = props.domainGroups[context.dataIndex];
                    if (!domain) return [];
                    return [
                        `Memory: ${Math.round(domain.totalMemoryUsageMB)} MB`,
                        `Tabs: ${domain.tabCount}`,
                    ];
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Memory (MB)'
            }
        },
        x: {
            ticks: {
                maxRotation: 45,
                minRotation: 45
            }
        }
    }
};
</script>

