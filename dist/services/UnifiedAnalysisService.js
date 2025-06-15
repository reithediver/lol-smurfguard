"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedAnalysisService = void 0;
const RiotApi_1 = require("../api/RiotApi");
const ChampionStatsService_1 = require("./ChampionStatsService");
const SmurfDetectionService_1 = require("./SmurfDetectionService");
const RankBenchmarkService_1 = require("./RankBenchmarkService");
const loggerService_1 = require("../utils/loggerService");
class UnifiedAnalysisService {
    constructor(riotApi) {
        this.riotApi = riotApi;
        // Cache for analysis results (in production, this would be Redis or similar)
        this.analysisCache = new Map();
        this.championStatsService = new ChampionStatsService_1.ChampionStatsService(riotApi);
        this.smurfDetectionService = new SmurfDetectionService_1.SmurfDetectionService(riotApi);
        this.rankBenchmarkService = new RankBenchmarkService_1.RankBenchmarkService();
    }
    async getUnifiedAnalysis(puuid, options = {}) {
        const cacheKey = `${puuid}_${options.matchCount || 200}`;
        const cached = this.analysisCache.get(cacheKey);
        // Check cache first (unless force refresh)
        if (!options.forceRefresh && cached && this.isCacheValid(cached)) {
            loggerService_1.logger.info(`🚀 Returning cached analysis for PUUID: ${puuid}`);
            return cached.data;
        }
        loggerService_1.logger.info(`🔍 Generating unified analysis for PUUID: ${puuid}`);
        try {
            // Get basic summoner info
            const region = options.region || 'na1';
            // Parse Riot ID if provided (required for summoner lookup)
            let gameName = 'Unknown';
            let tagLine = 'NA1';
            let summoner;
            if (options.riotId) {
                const parsed = RiotApi_1.RiotApi.parseRiotId(options.riotId);
                if (parsed) {
                    gameName = parsed.gameName;
                    tagLine = parsed.tagLine;
                    // Get summoner using Riot ID
                    summoner = await this.riotApi.getSummonerByRiotId(gameName, tagLine);
                }
                else {
                    throw new Error('Invalid Riot ID format provided');
                }
            }
            else {
                throw new Error('Riot ID is required for unified analysis');
            }
            // Get extensive match history (500+ matches minimum for deep analysis)
            const matchCount = options.matchCount || 500; // Default to 500+ matches for comprehensive analysis
            loggerService_1.logger.info(`🔍 Fetching ${matchCount} matches for comprehensive analysis`);
            // Run comprehensive analysis in parallel
            const [comprehensiveStats, smurfAnalysis] = await Promise.all([
                this.championStatsService.getComprehensiveStats(puuid, matchCount),
                this.smurfDetectionService.analyzeSmurf(puuid, region)
            ]);
            // Enhance champion stats with suspicion analysis
            const enhancedChampions = await this.analyzeChampionSuspicion(comprehensiveStats.mostPlayedChampions, smurfAnalysis);
            // Calculate unified suspicion score
            const unifiedSuspicion = this.calculateUnifiedSuspicion(enhancedChampions, smurfAnalysis, comprehensiveStats);
            // Build unified response
            const unifiedAnalysis = {
                summoner: {
                    gameName,
                    tagLine,
                    summonerLevel: summoner.summonerLevel || 1,
                    profileIconId: summoner.profileIconId || 1,
                    region,
                    puuid: summoner.puuid || puuid
                },
                overallStats: comprehensiveStats,
                championAnalysis: enhancedChampions,
                smurfAnalysis,
                unifiedSuspicion,
                metadata: {
                    analysisDate: new Date(),
                    matchesAnalyzed: comprehensiveStats.totalGames,
                    dataFreshness: 'FRESH',
                    cacheExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                    analysisVersion: '2.0.0'
                }
            };
            // Cache the result
            this.cacheAnalysis(cacheKey, unifiedAnalysis, 30); // 30 minutes
            loggerService_1.logger.info(`✅ Unified analysis complete - Suspicion: ${unifiedSuspicion.overallScore}%`);
            return unifiedAnalysis;
        }
        catch (error) {
            loggerService_1.logger.error('Error in unified analysis:', error);
            throw error;
        }
    }
    async analyzeChampionSuspicion(champions, smurfAnalysis) {
        const enhanced = [];
        for (const champion of champions) {
            const suspiciousIndicators = [];
            let suspicionScore = 0;
            // 1. First-time performance analysis
            const firstGamePerf = this.analyzeFirstGamePerformance(champion);
            if (firstGamePerf.isSuspiciouslyGood) {
                suspiciousIndicators.push({
                    type: 'CHAMPION_MASTERY',
                    severity: 'HIGH',
                    description: `Unusually strong first-time performance on ${champion.championName}`,
                    confidence: 85,
                    evidence: [
                        `${firstGamePerf.kda.toFixed(1)} KDA in first game (above average)`,
                        `${firstGamePerf.csPerMin.toFixed(1)} CS/min in first game`,
                        `${(firstGamePerf.winRate * 100).toFixed(0)}% win rate on new champion`
                    ],
                    affectedChampions: [champion.championName]
                });
                suspicionScore += 25;
            }
            // 2. Performance outlier analysis
            const benchmarks = this.rankBenchmarkService.comparePlayerToRank({
                csPerMin: champion.avgCSPerMin,
                kda: champion.avgKDA,
                killParticipation: 65, // Estimate
                visionScore: champion.avgVisionScore,
                damageShare: champion.damageShare,
                goldPerMin: champion.avgGoldPerMin,
                wardsPerMin: champion.avgWardsPlaced / 25 // Estimate
            }, champion.mostPlayedPosition, 'GOLD' // Default rank for comparison
            );
            // Extract benchmark data for easier access
            const csPerMinBenchmark = benchmarks.find(b => b.metric === 'CS per Minute');
            const kdaBenchmark = benchmarks.find(b => b.metric === 'KDA');
            const damageShareBenchmark = benchmarks.find(b => b.metric === 'Damage Share');
            // Flag statistical outliers
            if ((csPerMinBenchmark && csPerMinBenchmark.percentile > 95 && kdaBenchmark && kdaBenchmark.percentile > 95) ||
                (damageShareBenchmark && damageShareBenchmark.percentile > 98)) {
                suspiciousIndicators.push({
                    type: 'PERFORMANCE_OUTLIER',
                    severity: 'MEDIUM',
                    description: `Statistical outlier performance on ${champion.championName}`,
                    confidence: 75,
                    evidence: [
                        `CS/min: ${csPerMinBenchmark?.percentile || 'N/A'}th percentile`,
                        `KDA: ${kdaBenchmark?.percentile || 'N/A'}th percentile`,
                        `Damage share: ${damageShareBenchmark?.percentile || 'N/A'}th percentile`
                    ],
                    affectedChampions: [champion.championName]
                });
                suspicionScore += 15;
            }
            // 3. Win rate consistency check
            if (champion.winRate > 0.75 && champion.gamesPlayed > 10) {
                suspiciousIndicators.push({
                    type: 'PERFORMANCE_OUTLIER',
                    severity: 'MEDIUM',
                    description: `Unusually high win rate on ${champion.championName}`,
                    confidence: 70,
                    evidence: [
                        `${(champion.winRate * 100).toFixed(1)}% win rate over ${champion.gamesPlayed} games`,
                        `Recent performance: ${(champion.recentWinRate * 100).toFixed(1)}% (last 10 games)`
                    ],
                    affectedChampions: [champion.championName]
                });
                suspicionScore += 10;
            }
            // Calculate OP Rating (OP.GG style performance rating)
            const opRating = this.calculateOPRating(champion, benchmarks);
            // Calculate lane performance if this is a laning role
            const lanePerformance = this.calculateLanePerformance(champion);
            // Calculate algorithmic metrics
            const algorithmicMetrics = this.calculateAlgorithmicMetrics(champion);
            enhanced.push({
                ...champion,
                suspiciousIndicators,
                suspicionScore: Math.min(suspicionScore, 100),
                benchmarkComparison: {
                    csPerMinPercentile: csPerMinBenchmark?.percentile || 50,
                    kdaPercentile: kdaBenchmark?.percentile || 50,
                    winRatePercentile: 50, // Would need more data
                    damageSharePercentile: damageShareBenchmark?.percentile || 50,
                    isOutlier: (csPerMinBenchmark?.percentile || 0) > 90 || (kdaBenchmark?.percentile || 0) > 90
                },
                firstGamePerformance: firstGamePerf,
                opRating,
                lanePerformance,
                algorithmicMetrics
            });
        }
        return enhanced.sort((a, b) => b.suspicionScore - a.suspicionScore);
    }
    calculateOPRating(champion, benchmarks) {
        // Calculate OP.GG style rating based on multiple performance factors
        const csPerMinBenchmark = benchmarks.find(b => b.metric === 'CS per Minute');
        const kdaBenchmark = benchmarks.find(b => b.metric === 'KDA');
        const damageShareBenchmark = benchmarks.find(b => b.metric === 'Damage Share');
        // Performance factors (0-100 scale)
        const laning = Math.min(100, (csPerMinBenchmark?.percentile || 50));
        const teamfighting = Math.min(100, (kdaBenchmark?.percentile || 50) * 0.7 + (champion.avgAssists * 2) * 0.3);
        const carrying = Math.min(100, (damageShareBenchmark?.percentile || 50) * 0.6 + champion.winRate * 40);
        const consistency = Math.min(100, 100 - (Math.abs(champion.winRate - champion.recentWinRate) * 200));
        // Overall rating (weighted average)
        const overall = Math.round(laning * 0.25 +
            teamfighting * 0.3 +
            carrying * 0.3 +
            consistency * 0.15);
        // Recent games rating (based on last 10 games performance)
        const recent = Math.min(100, champion.recentWinRate * 60 + (champion.avgKDA - 1) * 15);
        // Determine trend
        let trend;
        const trendDiff = champion.recentWinRate - champion.winRate;
        if (trendDiff > 0.1)
            trend = 'IMPROVING';
        else if (trendDiff < -0.1)
            trend = 'DECLINING';
        else
            trend = 'STABLE';
        return {
            overall: Math.max(0, Math.min(100, overall)),
            recent: Math.max(0, Math.min(100, Math.round(recent))),
            trend,
            breakdown: {
                laning: Math.max(0, Math.min(100, Math.round(laning))),
                teamfighting: Math.max(0, Math.min(100, Math.round(teamfighting))),
                carrying: Math.max(0, Math.min(100, Math.round(carrying))),
                consistency: Math.max(0, Math.min(100, Math.round(consistency)))
            }
        };
    }
    calculateLanePerformance(champion) {
        // Only calculate for roles that lane (not jungle)
        if (champion.mostPlayedPosition === 'JUNGLE') {
            return undefined;
        }
        // Estimate lane performance metrics (in real implementation, would use detailed match data)
        const csAdvantage = champion.avgCSPerMin > 7 ? (champion.avgCSPerMin - 7) * 10 :
            champion.avgCSPerMin < 5 ? (champion.avgCSPerMin - 5) * 10 : 0;
        const killPressure = Math.min(100, (champion.avgKills + champion.avgAssists * 0.5) * 20);
        const vsOpponentRating = Math.min(100, (champion.avgKDA - 1) * 25 +
            champion.winRate * 30 +
            (champion.avgCSPerMin - 5) * 8);
        const roamingImpact = Math.min(100, champion.avgAssists * 15);
        const laneWinRate = Math.min(1, champion.winRate + (champion.avgKDA > 2 ? 0.1 : 0));
        return {
            vsOpponentRating: Math.max(0, Math.min(100, Math.round(vsOpponentRating))),
            csAdvantage: Math.round(csAdvantage * 10) / 10,
            killPressure: Math.max(0, Math.min(100, Math.round(killPressure))),
            roamingImpact: Math.max(0, Math.min(100, Math.round(roamingImpact))),
            laneWinRate: Math.max(0, Math.min(1, Math.round(laneWinRate * 1000) / 1000))
        };
    }
    calculateAlgorithmicMetrics(champion) {
        // Advanced algorithmic calculations for deeper analysis
        // Consistency Score: How consistent performance is across games
        const consistencyScore = Math.max(0, Math.min(100, 100 - (Math.abs(champion.winRate - champion.recentWinRate) * 200) -
            (champion.avgDeaths > 5 ? (champion.avgDeaths - 5) * 10 : 0)));
        // Improvement Rate: Performance trend over time
        const improvementRate = Math.max(0, Math.min(100, 50 + (champion.recentWinRate - champion.winRate) * 100));
        // Clutch Factor: Performance in high-pressure situations (estimated)
        const clutchFactor = Math.max(0, Math.min(100, champion.avgKDA * 20 + (champion.winRate > 0.5 ? 20 : 0) +
            (champion.avgAssists > 8 ? 15 : 0)));
        // Adaptability Score: Build and playstyle adaptation
        const adaptabilityScore = Math.max(0, Math.min(100, (champion.gamesPlayed > 20 ? 70 : champion.gamesPlayed * 3) +
            (champion.avgVisionScore > 20 ? 15 : 0) +
            (champion.avgCSPerMin > 6 ? 15 : 0)));
        // Teamplay Rating: Team coordination and support
        const teamplayRating = Math.max(0, Math.min(100, champion.avgAssists * 8 +
            (champion.avgVisionScore > 15 ? 20 : champion.avgVisionScore) +
            (champion.avgDeaths < 4 ? 20 : Math.max(0, 20 - (champion.avgDeaths - 4) * 5))));
        // Mechanical Skill: Execution and precision
        const mechanicalSkill = Math.max(0, Math.min(100, (champion.avgKDA - 1) * 30 +
            (champion.avgCSPerMin - 4) * 10 +
            (champion.avgKills > 8 ? 20 : champion.avgKills * 2.5)));
        // Game Knowledge: Strategic decision making
        const gameKnowledge = Math.max(0, Math.min(100, champion.winRate * 60 +
            (champion.avgVisionScore > 25 ? 25 : champion.avgVisionScore) +
            (champion.avgGoldPerMin > 400 ? 15 : 0)));
        // Pressure Handling: Performance consistency under stress
        const pressureHandling = Math.max(0, Math.min(100, consistencyScore * 0.6 + clutchFactor * 0.4));
        // Learning Curve: How quickly they master new champions
        const learningCurve = Math.max(0, Math.min(100, (champion.gamesPlayed < 10 ?
            champion.winRate * 120 : // High performance on few games = fast learning
            Math.max(30, 80 - (champion.gamesPlayed - 10) * 0.5) // Diminishing returns
        )));
        // Meta Adaptation: Adapting to game changes
        const metaAdaptation = Math.max(0, Math.min(100, improvementRate * 0.7 + adaptabilityScore * 0.3));
        return {
            consistencyScore: Math.round(consistencyScore),
            improvementRate: Math.round(improvementRate),
            clutchFactor: Math.round(clutchFactor),
            adaptabilityScore: Math.round(adaptabilityScore),
            teamplayRating: Math.round(teamplayRating),
            mechanicalSkill: Math.round(mechanicalSkill),
            gameKnowledge: Math.round(gameKnowledge),
            pressureHandling: Math.round(pressureHandling),
            learningCurve: Math.round(learningCurve),
            metaAdaptation: Math.round(metaAdaptation)
        };
    }
    analyzeFirstGamePerformance(champion) {
        // Estimate first game performance based on overall stats
        // In a real implementation, this would analyze actual first game data
        const estimatedFirstGame = {
            kda: champion.avgKDA * 0.7, // Usually lower on first game
            csPerMin: champion.avgCSPerMin * 0.8,
            winRate: champion.gamesPlayed > 0 ? 1 / champion.gamesPlayed : 0 // Rough estimate
        };
        // Flag as suspicious if first game performance is too good
        const isSuspiciouslyGood = (estimatedFirstGame.kda > 3.0 &&
            estimatedFirstGame.csPerMin > 7.0 &&
            champion.gamesPlayed <= 5);
        return {
            ...estimatedFirstGame,
            isSuspiciouslyGood
        };
    }
    calculateUnifiedSuspicion(champions, smurfAnalysis, overallStats) {
        // Combine multiple suspicion sources
        const smurfProbability = smurfAnalysis.smurfProbability || 0;
        const championSuspicion = champions.reduce((sum, champ) => sum + champ.suspicionScore, 0) /
            Math.max(champions.length, 1);
        // Weight the scores
        const overallScore = Math.min((smurfProbability * 100 * 0.4) + // 40% from smurf detection
            (championSuspicion * 0.6), // 60% from champion analysis
        100);
        // Determine risk level
        let riskLevel;
        if (overallScore >= 80)
            riskLevel = 'CRITICAL';
        else if (overallScore >= 60)
            riskLevel = 'HIGH';
        else if (overallScore >= 40)
            riskLevel = 'MEDIUM';
        else
            riskLevel = 'LOW';
        // Collect primary indicators
        const primaryIndicators = [];
        champions.forEach(champ => {
            primaryIndicators.push(...champ.suspiciousIndicators.filter(ind => ind.severity === 'HIGH' || ind.severity === 'CRITICAL'));
        });
        // Generate suspicious games list (mock for now)
        const suspiciousGames = overallStats.last10Games
            .filter(game => !game.win || Math.random() > 0.7) // Mock suspicious game detection
            .map(game => ({
            matchId: `match_${Date.now()}_${Math.random()}`,
            championName: game.championName,
            performance: game.kda * 20, // Simple performance score
            suspicionReasons: ['High KDA for rank', 'Perfect CS efficiency'],
            date: game.gameDate
        }));
        return {
            overallScore: Math.round(overallScore),
            confidenceLevel: Math.min(85, Math.max(60, overallScore * 0.8)), // Confidence based on score
            riskLevel,
            primaryIndicators: primaryIndicators.slice(0, 5), // Top 5 indicators
            suspiciousGames: suspiciousGames.slice(0, 10) // Top 10 suspicious games
        };
    }
    isCacheValid(cached) {
        const expiryTime = new Date(cached.timestamp.getTime() + cached.expiryMinutes * 60 * 1000);
        return new Date() < expiryTime;
    }
    cacheAnalysis(key, data, expiryMinutes) {
        this.analysisCache.set(key, {
            data,
            timestamp: new Date(),
            expiryMinutes
        });
        // Simple cache cleanup - remove expired entries
        if (this.analysisCache.size > 100) { // Keep cache size reasonable
            const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
            for (const [k, v] of this.analysisCache.entries()) {
                if (v.timestamp < cutoff) {
                    this.analysisCache.delete(k);
                }
            }
        }
    }
    // Utility method to clear cache for a specific player
    clearPlayerCache(puuid) {
        const keysToDelete = Array.from(this.analysisCache.keys())
            .filter(key => key.startsWith(puuid));
        keysToDelete.forEach(key => this.analysisCache.delete(key));
        loggerService_1.logger.info(`🗑️ Cleared cache for player: ${puuid}`);
    }
    // Get cache statistics
    getCacheStats() {
        return {
            totalEntries: this.analysisCache.size,
            oldestEntry: Math.min(...Array.from(this.analysisCache.values())
                .map(v => v.timestamp.getTime())),
            newestEntry: Math.max(...Array.from(this.analysisCache.values())
                .map(v => v.timestamp.getTime()))
        };
    }
}
exports.UnifiedAnalysisService = UnifiedAnalysisService;
