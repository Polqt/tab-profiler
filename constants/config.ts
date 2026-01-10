export const MEMORY_CHECK_INTERVAL_MINUTES = 0.5;
export const MEMORY_HISTORY_SIZE = 10;
export const MEMORY_HISTORY_MIN_SIZE = 5;

// Leak Detection
export const LEAK_GROWTH_THRESHOLD = 0.7; // 70% of checks must show growth

// Memory Thresholds (MB)
export const MEMORY_THRESHOLDS = {
  CRITICAL: 500,
  HIGH: 300,
  MEDIUM: 200,
  LOW: 100,
} as const;

// Site Memory Estimates (MB)
export const SITE_MEMORY_ESTIMATES = {
  BASE: 50,
  HEAVY_SITE_BONUS: 150,
  MEDIUM_SITE_BONUS: 80,
  DEV_SITE_BONUS: 60,
  ACTIVE_TAB_BONUS: 30,
  PINNED_TAB_BONUS: 20,
} as const;

// Site Categories for Memory Estimation
export const HEAVY_SITES = ['youtube.com', 'netflix.com', 'twitch.tv', 'kick.com'];
export const MEDIUM_SITES = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'reddit.com',
  'x.com',
];
export const DEV_SITES = ['github.com', 'stackoverflow.com', 'gitlab.com', 'codepen.io'];

// Health Score Configuration
export const HEALTH_SCORE = {
  MAX: 100,
  MEMORY_PENALTY_THRESHOLD: 100,
  MEMORY_PENALTY_STEP: 50,
  MEMORY_PENALTY_POINTS: 10,
  MEMORY_PENALTY_MAX: 40,
  TIME_PENALTY_POINTS: 5,
  TIME_PENALTY_MAX: 30,
  ACTIVE_TAB_BONUS: 10,
} as const;

// ML Prediction Weights
export const ML_WEIGHTS = {
  RECENCY: 0.35,
  FREQUENCY: 0.3,
  TIME_PATTERN: 0.2,
  DAY_PATTERN: 0.15,
} as const;

// ML Thresholds
export const ML_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.7,
  MEDIUM_CONFIDENCE: 0.4,
  KEEP_THRESHOLD: 0.5,
  DECAY_RATE: 0.115,
} as const;

// Storage Limits
export const STORAGE_LIMITS = {
  MAX_PATTERNS: 2000,
  MAX_SNAPSHOTS: 500,
  MAX_ACCESS_PATTERNS: 500,
} as const;

// UI Configuration
export const UI_CONFIG = {
  REFRESH_INTERVAL_MS: 5000,
  DEFAULT_IDLE_MINUTES: 30,
  TOP_MEMORY_CONSUMERS_COUNT: 10,
} as const;

// Domain Health Thresholds
export const DOMAIN_HEALTH = {
  CRITICAL_MEMORY: 500,
  HIGH_MEMORY: 300,
  MEDIUM_MEMORY: 150,
  HIGH_TAB_COUNT: 10,
  MEDIUM_TAB_COUNT: 5,
  HIGH_AVG_MEMORY: 200,
} as const;
