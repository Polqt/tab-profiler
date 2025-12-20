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
            const frequencyScore = this.calculateFrequencyScore(tab.domain);
            const timePatternScore = this.calculateTimePatternScore(tab.domain, currentHour);
            const dayPatternScore = this.calculateDayPatternScore(tab.domain, currentDay);

            // Weighted average
            const probability = 
                (recencyScore * this.WEIGHTS.recency) +
                (frequencyScore * this.WEIGHTS.frequency) +
                (timePatternScore * this.WEIGHTS.timePattern) +
                (dayPatternScore * this.WEIGHTS.dayPattern);

            // Determine confidence
            let confidence: 'high' | 'medium' | 'low';
            if (probability > 0.7) confidence = 'high';
            else if (probability > 0.4) confidence = 'medium';
            else confidence = 'low';

            // Generate reasoning
            const reasoning = this.generateReasoning(
                tab, 
                recencyScore, 
                frequencyScore, 
                timePatternScore,
                dayPatternScore
            );

            return {
                tabId: tab.tabId,
                title: tab.title,
                probability,
                suggestKeep: probability > 0.5,
                reasoning,
                confidence
            };
        });

        return predictions;
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

    private calculateDayPatternScore(domain: string, currentDay: number): number {
        const domainPatterns = this._patterns.filter(p => p.domain === domain);

        if (domainPatterns.length < 5) return 0.5;

        // Count visits on the same day of week
        const sameDayPatterns = domainPatterns.filter(p => p.daysOfWeek === currentDay);

        const dayMatchRatio = sameDayPatterns.length / domainPatterns.length;

        return Math.min(1, dayMatchRatio * 2);
    }

    private generateReasoning(
        tab: TabMemoryInfo,
        recencyScore: number,
        frequencyScore: number,
        timeScore: number,
        dayScore: number
    ): string {
        const reasons: string[] = [];

        // Check recency
        const hoursSinceAccess = (Date.now() - tab.lastAccessed) / (1000 * 60 * 60);
        
        if (tab.isActive) {
            reasons.push("Currently active");
        } else if (hoursSinceAccess < 1) {
            reasons.push("Used very recently");
        } else if (hoursSinceAccess > 24) {
            reasons.push("Not used in over 24 hours");
        }

        // Check frequency
        if (frequencyScore > 0.7) {
            reasons.push("Frequently visited site");
        } else if (frequencyScore < 0.3) {
            reasons.push("Rarely visited");
        }

        // Check time pattern
        if (timeScore > 0.7) {
            reasons.push("Usually accessed at this time");
        }

        // Check day pattern
        if (dayScore > 0.7) {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            reasons.push(`Often used on ${days[new Date().getDay()]}`);
        }

        return reasons.length > 0 ? reasons.join('. ') + '.' : 'No clear pattern yet.';
    }
}

export const tabPredictor = new TabUsagePredictor();