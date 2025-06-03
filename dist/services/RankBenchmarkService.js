"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankBenchmarkService = void 0;
class RankBenchmarkService {
    constructor() {
        this.benchmarks = new Map();
        this.initializeBenchmarks();
    }
    initializeBenchmarks() {
        // Based on research data - can be updated with more comprehensive datasets
        const benchmarkData = [
            // Top Lane
            { rank: 'IRON', role: 'TOP', csPerMin: 4.2, kda: 1.8, killParticipation: 55, visionScore: 18, damageShare: 22, goldPerMin: 340, wardsPerMin: 0.18 },
            { rank: 'BRONZE', role: 'TOP', csPerMin: 4.7, kda: 2.0, killParticipation: 57, visionScore: 20, damageShare: 23, goldPerMin: 345, wardsPerMin: 0.20 },
            { rank: 'SILVER', role: 'TOP', csPerMin: 5.12, kda: 2.2, killParticipation: 59, visionScore: 22, damageShare: 24, goldPerMin: 351, wardsPerMin: 0.21 },
            { rank: 'GOLD', role: 'TOP', csPerMin: 5.46, kda: 2.4, killParticipation: 61, visionScore: 24, damageShare: 25, goldPerMin: 357, wardsPerMin: 0.22 },
            { rank: 'PLATINUM', role: 'TOP', csPerMin: 5.69, kda: 2.6, killParticipation: 63, visionScore: 26, damageShare: 26, goldPerMin: 361, wardsPerMin: 0.23 },
            { rank: 'EMERALD', role: 'TOP', csPerMin: 5.78, kda: 2.7, killParticipation: 64, visionScore: 27, damageShare: 26, goldPerMin: 363, wardsPerMin: 0.24 },
            { rank: 'DIAMOND', role: 'TOP', csPerMin: 5.86, kda: 2.8, killParticipation: 65, visionScore: 28, damageShare: 27, goldPerMin: 365, wardsPerMin: 0.24 },
            { rank: 'MASTER', role: 'TOP', csPerMin: 5.99, kda: 3.0, killParticipation: 67, visionScore: 30, damageShare: 28, goldPerMin: 368, wardsPerMin: 0.27 },
            { rank: 'GRANDMASTER', role: 'TOP', csPerMin: 6.02, kda: 3.1, killParticipation: 68, visionScore: 31, damageShare: 28, goldPerMin: 369, wardsPerMin: 0.27 },
            { rank: 'CHALLENGER', role: 'TOP', csPerMin: 6.05, kda: 3.2, killParticipation: 69, visionScore: 32, damageShare: 29, goldPerMin: 369, wardsPerMin: 0.27 },
            // Middle Lane
            { rank: 'IRON', role: 'MIDDLE', csPerMin: 3.8, kda: 2.0, killParticipation: 62, visionScore: 16, damageShare: 28, goldPerMin: 340, wardsPerMin: 0.19 },
            { rank: 'BRONZE', role: 'MIDDLE', csPerMin: 4.22, kda: 2.2, killParticipation: 64, visionScore: 18, damageShare: 29, goldPerMin: 346, wardsPerMin: 0.21 },
            { rank: 'SILVER', role: 'MIDDLE', csPerMin: 4.61, kda: 2.4, killParticipation: 66, visionScore: 20, damageShare: 30, goldPerMin: 353, wardsPerMin: 0.22 },
            { rank: 'GOLD', role: 'MIDDLE', csPerMin: 4.96, kda: 2.6, killParticipation: 68, visionScore: 22, damageShare: 31, goldPerMin: 358, wardsPerMin: 0.24 },
            { rank: 'PLATINUM', role: 'MIDDLE', csPerMin: 5.22, kda: 2.8, killParticipation: 70, visionScore: 24, damageShare: 32, goldPerMin: 363, wardsPerMin: 0.24 },
            { rank: 'EMERALD', role: 'MIDDLE', csPerMin: 5.34, kda: 2.9, killParticipation: 71, visionScore: 25, damageShare: 32, goldPerMin: 366, wardsPerMin: 0.24 },
            { rank: 'DIAMOND', role: 'MIDDLE', csPerMin: 5.45, kda: 3.0, killParticipation: 72, visionScore: 26, damageShare: 33, goldPerMin: 369, wardsPerMin: 0.24 },
            { rank: 'MASTER', role: 'MIDDLE', csPerMin: 5.73, kda: 3.2, killParticipation: 74, visionScore: 28, damageShare: 34, goldPerMin: 375, wardsPerMin: 0.23 },
            { rank: 'GRANDMASTER', role: 'MIDDLE', csPerMin: 5.81, kda: 3.3, killParticipation: 75, visionScore: 29, damageShare: 34, goldPerMin: 377, wardsPerMin: 0.23 },
            { rank: 'CHALLENGER', role: 'MIDDLE', csPerMin: 5.88, kda: 3.4, killParticipation: 76, visionScore: 30, damageShare: 35, goldPerMin: 379, wardsPerMin: 0.23 },
            // ADC/Bottom
            { rank: 'IRON', role: 'BOTTOM', csPerMin: 4.6, kda: 2.2, killParticipation: 68, visionScore: 14, damageShare: 32, goldPerMin: 370, wardsPerMin: 0.16 },
            { rank: 'BRONZE', role: 'BOTTOM', csPerMin: 5.11, kda: 2.4, killParticipation: 70, visionScore: 16, damageShare: 33, goldPerMin: 375, wardsPerMin: 0.18 },
            { rank: 'SILVER', role: 'BOTTOM', csPerMin: 5.55, kda: 2.6, killParticipation: 72, visionScore: 18, damageShare: 34, goldPerMin: 382, wardsPerMin: 0.18 },
            { rank: 'GOLD', role: 'BOTTOM', csPerMin: 5.88, kda: 2.8, killParticipation: 74, visionScore: 20, damageShare: 35, goldPerMin: 387, wardsPerMin: 0.18 },
            { rank: 'PLATINUM', role: 'BOTTOM', csPerMin: 6.09, kda: 3.0, killParticipation: 76, visionScore: 22, damageShare: 36, goldPerMin: 391, wardsPerMin: 0.17 },
            { rank: 'EMERALD', role: 'BOTTOM', csPerMin: 6.18, kda: 3.1, killParticipation: 77, visionScore: 23, damageShare: 36, goldPerMin: 393, wardsPerMin: 0.17 },
            { rank: 'DIAMOND', role: 'BOTTOM', csPerMin: 6.27, kda: 3.2, killParticipation: 78, visionScore: 24, damageShare: 37, goldPerMin: 396, wardsPerMin: 0.16 },
            { rank: 'MASTER', role: 'BOTTOM', csPerMin: 6.43, kda: 3.4, killParticipation: 80, visionScore: 26, damageShare: 38, goldPerMin: 402, wardsPerMin: 0.14 },
            { rank: 'GRANDMASTER', role: 'BOTTOM', csPerMin: 6.46, kda: 3.5, killParticipation: 81, visionScore: 27, damageShare: 38, goldPerMin: 403, wardsPerMin: 0.14 },
            { rank: 'CHALLENGER', role: 'BOTTOM', csPerMin: 6.49, kda: 3.6, killParticipation: 82, visionScore: 28, damageShare: 39, goldPerMin: 404, wardsPerMin: 0.14 },
            // Support
            { rank: 'IRON', role: 'UTILITY', csPerMin: 1.1, kda: 2.8, killParticipation: 75, visionScore: 28, damageShare: 8, goldPerMin: 275, wardsPerMin: 0.45 },
            { rank: 'BRONZE', role: 'UTILITY', csPerMin: 1.0, kda: 3.0, killParticipation: 77, visionScore: 30, damageShare: 8, goldPerMin: 279, wardsPerMin: 0.51 },
            { rank: 'SILVER', role: 'UTILITY', csPerMin: 0.95, kda: 3.2, killParticipation: 79, visionScore: 32, damageShare: 9, goldPerMin: 278, wardsPerMin: 0.61 },
            { rank: 'GOLD', role: 'UTILITY', csPerMin: 0.93, kda: 3.4, killParticipation: 81, visionScore: 34, damageShare: 9, goldPerMin: 276, wardsPerMin: 0.69 },
            { rank: 'PLATINUM', role: 'UTILITY', csPerMin: 0.91, kda: 3.6, killParticipation: 83, visionScore: 36, damageShare: 10, goldPerMin: 277, wardsPerMin: 0.76 },
            { rank: 'EMERALD', role: 'UTILITY', csPerMin: 0.90, kda: 3.7, killParticipation: 84, visionScore: 37, damageShare: 10, goldPerMin: 277, wardsPerMin: 0.79 },
            { rank: 'DIAMOND', role: 'UTILITY', csPerMin: 0.89, kda: 3.8, killParticipation: 85, visionScore: 38, damageShare: 10, goldPerMin: 278, wardsPerMin: 0.82 },
            { rank: 'MASTER', role: 'UTILITY', csPerMin: 0.88, kda: 4.0, killParticipation: 87, visionScore: 40, damageShare: 11, goldPerMin: 280, wardsPerMin: 0.92 },
            { rank: 'GRANDMASTER', role: 'UTILITY', csPerMin: 0.86, kda: 4.1, killParticipation: 88, visionScore: 41, damageShare: 11, goldPerMin: 280, wardsPerMin: 0.93 },
            { rank: 'CHALLENGER', role: 'UTILITY', csPerMin: 0.83, kda: 4.2, killParticipation: 89, visionScore: 42, damageShare: 12, goldPerMin: 279, wardsPerMin: 0.94 },
            // Jungle
            { rank: 'IRON', role: 'JUNGLE', csPerMin: 1.8, kda: 2.5, killParticipation: 70, visionScore: 20, damageShare: 18, goldPerMin: 340, wardsPerMin: 0.19 },
            { rank: 'BRONZE', role: 'JUNGLE', csPerMin: 1.72, kda: 2.7, killParticipation: 72, visionScore: 22, damageShare: 19, goldPerMin: 347, wardsPerMin: 0.21 },
            { rank: 'SILVER', role: 'JUNGLE', csPerMin: 1.64, kda: 2.9, killParticipation: 74, visionScore: 24, damageShare: 20, goldPerMin: 349, wardsPerMin: 0.23 },
            { rank: 'GOLD', role: 'JUNGLE', csPerMin: 1.58, kda: 3.1, killParticipation: 76, visionScore: 26, damageShare: 21, goldPerMin: 350, wardsPerMin: 0.26 },
            { rank: 'PLATINUM', role: 'JUNGLE', csPerMin: 1.57, kda: 3.3, killParticipation: 78, visionScore: 28, damageShare: 22, goldPerMin: 352, wardsPerMin: 0.28 },
            { rank: 'EMERALD', role: 'JUNGLE', csPerMin: 1.58, kda: 3.4, killParticipation: 79, visionScore: 29, damageShare: 22, goldPerMin: 354, wardsPerMin: 0.29 },
            { rank: 'DIAMOND', role: 'JUNGLE', csPerMin: 1.58, kda: 3.5, killParticipation: 80, visionScore: 30, damageShare: 23, goldPerMin: 356, wardsPerMin: 0.29 },
            { rank: 'MASTER', role: 'JUNGLE', csPerMin: 1.59, kda: 3.7, killParticipation: 82, visionScore: 32, damageShare: 24, goldPerMin: 362, wardsPerMin: 0.33 },
            { rank: 'GRANDMASTER', role: 'JUNGLE', csPerMin: 1.59, kda: 3.8, killParticipation: 83, visionScore: 33, damageShare: 24, goldPerMin: 363, wardsPerMin: 0.36 },
            { rank: 'CHALLENGER', role: 'JUNGLE', csPerMin: 1.58, kda: 3.9, killParticipation: 84, visionScore: 34, damageShare: 25, goldPerMin: 363, wardsPerMin: 0.38 },
        ];
        // Group benchmarks by role
        benchmarkData.forEach(benchmark => {
            if (!this.benchmarks.has(benchmark.role)) {
                this.benchmarks.set(benchmark.role, []);
            }
            this.benchmarks.get(benchmark.role).push(benchmark);
        });
    }
    getBenchmarkForRank(role, rank) {
        const roleBenchmarks = this.benchmarks.get(role);
        if (!roleBenchmarks)
            return null;
        return roleBenchmarks.find(benchmark => benchmark.rank === rank) || null;
    }
    comparePlayerToRank(playerMetrics, role, rank) {
        const benchmark = this.getBenchmarkForRank(role, rank);
        if (!benchmark)
            return [];
        const comparisons = [];
        // CS per minute comparison
        if (playerMetrics.csPerMin !== undefined) {
            comparisons.push(this.createComparison('CS per Minute', playerMetrics.csPerMin, benchmark.csPerMin, this.calculatePercentile(playerMetrics.csPerMin, benchmark.csPerMin, 0.8) // Standard deviation estimate
            ));
        }
        // KDA comparison
        if (playerMetrics.kda !== undefined) {
            comparisons.push(this.createComparison('KDA', playerMetrics.kda, benchmark.kda, this.calculatePercentile(playerMetrics.kda, benchmark.kda, 0.6)));
        }
        // Kill participation comparison
        if (playerMetrics.killParticipation !== undefined) {
            comparisons.push(this.createComparison('Kill Participation', playerMetrics.killParticipation, benchmark.killParticipation, this.calculatePercentile(playerMetrics.killParticipation, benchmark.killParticipation, 8)));
        }
        // Vision score comparison
        if (playerMetrics.visionScore !== undefined) {
            comparisons.push(this.createComparison('Vision Score', playerMetrics.visionScore, benchmark.visionScore, this.calculatePercentile(playerMetrics.visionScore, benchmark.visionScore, 5)));
        }
        return comparisons;
    }
    createComparison(metric, playerValue, rankAverage, percentile) {
        const deviation = (playerValue - rankAverage) / rankAverage;
        let status;
        let suspiciousLevel = 0;
        if (percentile >= 95) {
            status = 'exceptional';
            suspiciousLevel = Math.min(90, (percentile - 95) * 18); // Higher percentiles = more suspicious
        }
        else if (percentile >= 75) {
            status = 'above_average';
            suspiciousLevel = Math.min(30, (percentile - 75) * 1.5);
        }
        else if (percentile >= 25) {
            status = 'average';
            suspiciousLevel = 0;
        }
        else if (percentile >= 10) {
            status = 'below_average';
            suspiciousLevel = 0;
        }
        else {
            status = 'far_below';
            suspiciousLevel = 0;
        }
        return {
            metric,
            playerValue,
            rankAverage,
            percentile,
            deviation,
            status,
            suspiciousLevel
        };
    }
    calculatePercentile(value, average, stdDev) {
        // Simplified normal distribution percentile calculation
        const zScore = (value - average) / stdDev;
        // Convert z-score to percentile (simplified)
        if (zScore <= -3)
            return 0.1;
        if (zScore <= -2)
            return 2.3;
        if (zScore <= -1)
            return 15.9;
        if (zScore <= 0)
            return 50;
        if (zScore <= 1)
            return 84.1;
        if (zScore <= 2)
            return 97.7;
        if (zScore <= 3)
            return 99.9;
        return 99.9;
    }
    // Calculate overall suspicion score based on multiple metrics
    calculateOverallSuspicion(comparisons) {
        if (comparisons.length === 0)
            return 0;
        const weights = {
            'CS per Minute': 0.25,
            'KDA': 0.20,
            'Kill Participation': 0.20,
            'Vision Score': 0.15,
            'Damage Share': 0.20
        };
        let totalSuspicion = 0;
        let totalWeight = 0;
        comparisons.forEach(comparison => {
            const weight = weights[comparison.metric] || 0.1;
            totalSuspicion += comparison.suspiciousLevel * weight;
            totalWeight += weight;
        });
        return totalWeight > 0 ? totalSuspicion / totalWeight : 0;
    }
}
exports.RankBenchmarkService = RankBenchmarkService;
