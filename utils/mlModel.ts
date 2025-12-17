import { MLPrediction, TabMemoryInfo, UsagePattern } from "@/types";
import { getUsagePatterns } from "./storage";

export class TabUsagePredictor {
    private _patterns: UsagePattern[] = [];
    private _isInitialized = false;

    private readonly WEIGHTS = {
        recency: 0.35,
        frequency: 0.30,
        timePattern: 0.20,
        dayPattern: 0.15
    };

    async initialize(): Promise<void> {
        try {
            this._patterns = await getUsagePatterns();
            this._isInitialized = true;
            console.log('TabUsagePredictor initialized with', this._patterns.length, 'patterns');
        } catch (error) {
            console.warn('Failed to initialize TabUsagePredictor:', error);
            this._patterns = [];
            this._isInitialized = false;
        }
    }

    /**
     * Generate predictions for a list of tabs
     * 
     * @param tabs - Tabs to predict usage to analyze
     * @returns
     */
    async getPredictions(tabs: TabMemoryInfo[]): Promise<MLPrediction[]> {
        if (!this._isInitialized) {
            await this.initialize();
        }

        const now = Date.now();
        const currentHour = new Date().getHours();
        const currentDay = new Date().getDay();

        const predictions: MLPrediction[] = tabs.map(tab => {
            const recencyScore = this.calculateRecencyScore(tab, now);

        })
    }

    private calculateRecencyScore(tab: TabMemoryInfo, now: number): number {
        const hoursSinceAccess = (now - tab.lastAccessed) / (1000 * 60 * 60);

        if (tab.isActive) return 1.0;

        // After 6 hours, score is about 0.5
        // After 12 hours, score is about 0.25
        const decayRate = 0.115; 
        return Math.exp(-decayRate * hoursSinceAccess);
    }

    private calculateFrequencyScore(domain: string): number {
        const domainPatterns = this._patterns.filter(
            p => p.domain === domain
        );

        if (this._patterns.length === 0) return 0.5;

        // Calculate percentage of all visitis
        const frequency = domainPatterns.length / this._patterns.length;

        // Normalize to 0-1 rane
        return Math.min(1, Math.sqrt(frequency * 10));
    }

    private calculateTimePatternScore(domain: string, currentHour: number): number {
        const domainPatterns = this._patterns.filter(
            p => p.domain === domain
        )

        if (domainPatterns.length < 5) return 0.5;

        const nearbyHourPatterns = domainPatterns.filter(p => {
            const hourDiff = Math.abs(p.hourOfDay - currentHour);
            const adjustedDiff = Math.min(hourDiff, 24 - hourDiff);
            return adjustedDiff <= 2;
        });

        // Percentage of visits to this domain that occur around the current hour
        const timeMatchRatio = nearbyHourPatterns.length / domainPatterns.length;

        return Math.min(1, timeMatchRatio * 2);
    }
}

export const tabPredictor = new TabUsagePredictor();