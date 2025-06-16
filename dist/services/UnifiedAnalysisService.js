"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedAnalysisService = void 0;
const RiotApi_1 = require("../api/RiotApi");
const loggerService_1 = __importDefault(require("../utils/loggerService"));
const PlayerDataService_1 = require("./PlayerDataService");
class UnifiedAnalysisService {
    constructor(riotApi, smurfDetectionService, dataFetchingService, outlierGameDetectionService) {
        this.analysisCache = new Map();
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
        this.riotApi = riotApi;
        this.smurfDetectionService = smurfDetectionService;
        this.dataFetchingService = dataFetchingService;
        this.outlierGameDetectionService = outlierGameDetectionService;
        this.playerDataService = new PlayerDataService_1.PlayerDataService(riotApi);
    }
    async getUnifiedAnalysis(puuid, options = {}) {
        const cacheKey = `${puuid}_${options.matchCount || 200}`;
        // Check persistent storage first (unless force refresh)
        if (!options.forceRefresh) {
            const cachedAnalysis = await this.playerDataService.getAnalysis(puuid);
            if (cachedAnalysis) {
                loggerService_1.default.info(`🚀 Returning cached analysis for PUUID: ${puuid}`);
                return cachedAnalysis;
            }
        }
        loggerService_1.default.info(`🔍 Generating unified analysis for PUUID: ${puuid}${options.fastMode ? ' (Fast Mode)' : ''}`);
        try {
            // Get basic summoner info using persistent storage
            const region = options.region || 'na1';
            // Parse Riot ID if provided
            let gameName = '';
            let tagLine = '';
            if (options.riotId) {
                const riotIdParts = RiotApi_1.RiotApi.parseRiotId(options.riotId);
                if (riotIdParts) {
                    gameName = riotIdParts.gameName;
                    tagLine = riotIdParts.tagLine;
                }
            }
            // Get summoner data using persistent storage
            const summoner = await this.playerDataService.getSummonerByRiotId(gameName, tagLine);
            // Get match history using persistent storage with optimized count for fast mode
            const matchCount = options.fastMode
                ? Math.min(options.matchCount || 30, 50) // Fast mode: max 50 matches
                : Math.min(options.matchCount || 200, 200);
            const matchIds = await this.playerDataService.getMatchHistory(puuid, matchCount);
            if (matchIds.length === 0) {
                throw new Error('No matches found for this player');
            }
            loggerService_1.default.info(`📊 Processing ${matchIds.length} matches for analysis${options.fastMode ? ' (Fast Mode)' : ''}`);
            // Get match details with rate limiting optimization for fast mode
            let matches;
            if (options.fastMode) {
                // Fast mode: Process in smaller batches with shorter delays
                const batchSize = 5;
                const allMatches = [];
                for (let i = 0; i < Math.min(matchIds.length, matchCount); i += batchSize) {
                    const batch = matchIds.slice(i, i + batchSize);
                    const batchPromises = batch.map(matchId => this.playerDataService.getMatchDetails(matchId).catch(() => null));
                    const batchResults = await Promise.all(batchPromises);
                    allMatches.push(...batchResults.filter(Boolean));
                    // Short delay between batches to avoid rate limiting
                    if (i + batchSize < Math.min(matchIds.length, matchCount)) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
                matches = allMatches;
            }
            else {
                // Normal mode: Use existing parallel processing
                const matchPromises = matchIds.slice(0, matchCount).map(matchId => this.playerDataService.getMatchDetails(matchId));
                matches = await Promise.all(matchPromises);
            }
            const validMatches = matches.filter(match => match && match.info);
            loggerService_1.default.info(`✅ Successfully processed ${validMatches.length} valid matches${options.fastMode ? ' (Fast Mode)' : ''}`);
            // Get smurf analysis and outlier detection
            const smurfAnalysis = await this.smurfDetectionService.analyzeSmurf(puuid, region);
            const outlierAnalysis = await this.outlierGameDetectionService.analyzeOutlierGames(validMatches, puuid, 'GOLD');
            // Build unified analysis using the correct interface structure
            const analysis = {
                summoner: {
                    gameName: summoner.name || gameName,
                    tagLine: tagLine || 'NA1',
                    summonerLevel: summoner.summonerLevel || 1,
                    profileIconId: summoner.profileIconId || 1,
                    region,
                    puuid: summoner.puuid || puuid
                },
                overallStats: {
                    totalGames: validMatches.length,
                    totalWins: validMatches.filter(m => {
                        const player = m.participants?.find((p) => p.puuid === puuid);
                        return player?.stats?.win;
                    }).length,
                    overallWinRate: 0.5,
                    overallKDA: 2.0,
                    uniqueChampions: new Set(validMatches.map(m => {
                        const player = m.participants?.find((p) => p.puuid === puuid);
                        return player?.championId;
                    }).filter(Boolean)).size,
                    totalLosses: 0,
                    rankedSoloStats: {
                        games: validMatches.length,
                        wins: 0,
                        winRate: 0.5,
                        avgKDA: 2.0,
                        avgGameLength: 1800
                    },
                    rankedFlexStats: { games: 0, wins: 0, winRate: 0, avgKDA: 0, avgGameLength: 1800 },
                    normalStats: { games: 0, wins: 0, winRate: 0, avgKDA: 0, avgGameLength: 1800 },
                    aramStats: { games: 0, wins: 0, winRate: 0, avgKDA: 0, avgGameLength: 1800 },
                    last10Games: [],
                    mostPlayedRole: 'UNKNOWN'
                },
                championAnalysis: [], // Will be populated by existing service
                smurfAnalysis,
                unifiedSuspicion: {
                    overallScore: this.calculateOverallRiskScore(smurfAnalysis, outlierAnalysis),
                    confidenceLevel: options.fastMode ? 65 : 75, // Lower confidence in fast mode
                    riskLevel: this.calculateOverallRiskScore(smurfAnalysis, outlierAnalysis) > 70 ? 'HIGH' :
                        this.calculateOverallRiskScore(smurfAnalysis, outlierAnalysis) > 40 ? 'MEDIUM' : 'LOW',
                    primaryIndicators: this.generateSuspiciousIndicators(smurfAnalysis, outlierAnalysis),
                    suspiciousGames: []
                },
                outlierAnalysis,
                metadata: {
                    analysisDate: new Date(),
                    matchesAnalyzed: validMatches.length,
                    dataFreshness: 'FRESH',
                    cacheExpiry: new Date(Date.now() + (options.fastMode ? 15 : 30) * 60 * 1000), // Shorter cache in fast mode
                    analysisVersion: '2.0.0'
                }
            };
            // Store in persistent cache
            await this.playerDataService.storeAnalysis(puuid, analysis);
            loggerService_1.default.info(`✅ Unified analysis completed for ${options.riotId || puuid}${options.fastMode ? ' (Fast Mode)' : ''}`);
            return analysis;
        }
        catch (error) {
            loggerService_1.default.error(`❌ Failed to generate unified analysis for ${puuid}:`, error);
            throw error;
        }
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
    calculateUnifiedSuspicion(enhancedChampions, smurfAnalysis, overallStats) {
        // Calculate overall suspicion score
        const championSuspicionScores = enhancedChampions.map(c => c.suspicionScore);
        const avgChampionSuspicion = championSuspicionScores.length > 0
            ? championSuspicionScores.reduce((a, b) => a + b, 0) / championSuspicionScores.length
            : 0;
        const smurfSuspicionScore = smurfAnalysis.smurfProbability * 100;
        // Weighted combination
        const overallScore = Math.round((avgChampionSuspicion * 0.4) +
            (smurfSuspicionScore * 0.6));
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
        // Collect all suspicious indicators
        const allIndicators = enhancedChampions.flatMap(c => c.suspiciousIndicators);
        return {
            overallScore,
            confidenceLevel: Math.min(95, Math.max(50, overallScore + 10)),
            riskLevel,
            primaryIndicators: allIndicators.slice(0, 5), // Top 5 indicators
            suspiciousGames: [] // TODO: Implement suspicious games detection
        };
    }
    isCacheValid(cached) {
        const expiryTime = new Date(cached.timestamp + this.cacheExpiry);
        return new Date() < expiryTime;
    }
    cacheAnalysis(key, data, expiryMinutes) {
        this.analysisCache.set(key, {
            data,
            timestamp: Date.now()
        });
        // Simple cache cleanup - remove expired entries
        if (this.analysisCache.size > 100) { // Keep cache size reasonable
            const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
            for (const [k, v] of this.analysisCache.entries()) {
                if (v.timestamp < cutoff.getTime()) {
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
        loggerService_1.default.info(`🗑️ Cleared cache for player: ${puuid}`);
    }
    // Get cache statistics
    getCacheStats() {
        return {
            totalEntries: this.analysisCache.size,
            oldestEntry: Math.min(...Array.from(this.analysisCache.values())
                .map(v => v.timestamp)),
            newestEntry: Math.max(...Array.from(this.analysisCache.values())
                .map(v => v.timestamp))
        };
    }
    /**
     * Generate suspicious indicators based on analysis results
     */
    generateSuspiciousIndicators(smurfAnalysis, outlierAnalysis) {
        const indicators = [];
        // Check smurf analysis indicators
        if (smurfAnalysis.suspicionLevel === 'HIGH') {
            indicators.push({
                type: 'BEHAVIORAL_PATTERN',
                severity: 'HIGH',
                description: 'High smurf probability detected',
                confidence: smurfAnalysis.confidence || 0.8,
                evidence: ['High performance on new champions', 'Unusual gameplay patterns']
            });
        }
        // Check outlier game indicators
        if (outlierAnalysis.outlierGames && outlierAnalysis.outlierGames.length > 0) {
            indicators.push({
                type: 'PERFORMANCE_OUTLIER',
                severity: outlierAnalysis.outlierGames.length > 5 ? 'HIGH' : 'MEDIUM',
                description: `${outlierAnalysis.outlierGames.length} outlier games detected`,
                confidence: 0.7,
                evidence: [`${outlierAnalysis.outlierGames.length} games with exceptional performance`]
            });
        }
        return indicators;
    }
    /**
     * Calculate overall risk score based on all analysis components
     */
    calculateOverallRiskScore(smurfAnalysis, outlierAnalysis) {
        let score = 0;
        // Smurf analysis contribution (0-50 points)
        if (smurfAnalysis.suspicionLevel === 'HIGH') {
            score += 40;
        }
        else if (smurfAnalysis.suspicionLevel === 'MEDIUM') {
            score += 25;
        }
        else if (smurfAnalysis.suspicionLevel === 'LOW') {
            score += 10;
        }
        // Outlier analysis contribution (0-30 points)
        if (outlierAnalysis.outlierGames) {
            const outlierCount = outlierAnalysis.outlierGames.length;
            score += Math.min(outlierCount * 3, 30);
        }
        // Performance consistency (0-20 points)
        if (smurfAnalysis.performanceConsistency && smurfAnalysis.performanceConsistency < 0.3) {
            score += 20;
        }
        return Math.min(score, 100); // Cap at 100
    }
    async analyzeMatches(matches) {
        try {
            loggerService_1.default.info(`Analyzing ${matches.length} matches`);
            // Filter out null matches (failed to fetch)
            const validMatches = matches.filter(match => match !== null);
            if (validMatches.length === 0) {
                throw new Error('No valid matches to analyze');
            }
            // Calculate basic statistics
            const stats = this.calculateBasicStats(validMatches);
            // Calculate advanced metrics
            const metrics = this.calculateAdvancedMetrics(validMatches);
            // Calculate suspicion score
            const suspicionScore = this.calculateSuspicionScore(stats, metrics);
            return {
                stats,
                metrics,
                suspicionScore,
                riskLevel: this.getRiskLevel(suspicionScore),
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            loggerService_1.default.error('Error analyzing matches:', error);
            throw error;
        }
    }
    calculateBasicStats(matches) {
        // Implementation of basic statistics calculation
        return {
            totalGames: matches.length,
            // Add more basic stats as needed
        };
    }
    calculateAdvancedMetrics(matches) {
        // Implementation of advanced metrics calculation
        return {
        // Add advanced metrics as needed
        };
    }
    calculateSuspicionScore(stats, metrics) {
        // Implementation of suspicion score calculation
        return 0; // Placeholder
    }
    getRiskLevel(score) {
        if (score >= 70)
            return 'HIGH';
        if (score >= 40)
            return 'MEDIUM';
        return 'LOW';
    }
}
exports.UnifiedAnalysisService = UnifiedAnalysisService;
