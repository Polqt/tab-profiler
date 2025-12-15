import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Tab Memory Profiler',
    description: 'Monitor tab memory usage and optimize browser performance',
    permissions: [
      'tabs',
      'processes',
      'storage',
      'system.memory',
      'alarms'
    ],
    host_permissions: [
      '<all_urls>'
    ],
    action: {
      default_title: 'Tab Memory Profiler',
    }
  }
});
