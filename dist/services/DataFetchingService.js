"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFetchingService = void 0;
const OpggDataAdapter_1 = require("./OpggDataAdapter");
const loggerService_1 = require("../utils/loggerService");
const errorHandler_1 = require("../utils/errorHandler");
class DataFetchingService {
    constructor(riotApi) {
        this.riotApi = riotApi;
        this.cache = new Map();
        this.enhancedCache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.MAX_CACHE_SIZE = 100; // Maximum number of cached entries
        this.USE_OPGG = process.env.USE_OPGG_DATA === 'true'; // Toggle for OP.GG integration
        this.opggAdapter = new OpggDataAdapter_1.OpggDataAdapter();
        loggerService_1.logger.info(`DataFetchingService initialized with OP.GG integration: ${this.USE_OPGG}`);
    }
    /**
     * Enhanced method to fetch comprehensive player analysis using OP.GG data
     * Falls back to Riot API if OP.GG is unavailable
     */
    async fetchEnhancedPlayerAnalysis(summonerName, region = 'na1') {
        try {
            // Check enhanced cache first
            const cacheKey = `enhanced_${summonerName}_${region}`;
            const cachedData = this.getFromEnhancedCache(cacheKey);
            if (cachedData) {
                loggerService_1.logger.info(`Enhanced cache hit for player: ${summonerName}`);
                return cachedData;
            }
            let enhancedAnalysis;
            if (this.USE_OPGG) {
                try {
                    loggerService_1.logger.info(`Fetching enhanced data via OP.GG for player: ${summonerName}`);
                    enhancedAnalysis = await this.opggAdapter.getEnhancedPlayerAnalysis(summonerName, region);
                    loggerService_1.logger.info(`Successfully fetched OP.GG data for ${summonerName}`);
                }
                catch (opggError) {
                    loggerService_1.logger.warn(`OP.GG fetch failed for ${summonerName}, falling back to Riot API:`, opggError);
                    enhancedAnalysis = await this.fallbackToRiotApi(summonerName, region);
                }
            }
            else {
                loggerService_1.logger.info(`Using Riot API fallback for player: ${summonerName}`);
                enhancedAnalysis = await this.fallbackToRiotApi(summonerName, region);
            }
            // Store in enhanced cache
            this.addToEnhancedCache(cacheKey, enhancedAnalysis);
            return enhancedAnalysis;
        }
        catch (error) {
            loggerService_1.logger.error('Error fetching enhanced player analysis:', error);
            throw (0, errorHandler_1.createError)(500, `Failed to fetch enhanced analysis for ${summonerName}`);
        }
    }
    /**
     * Original method maintained for backward compatibility
     */
    async fetchPlayerAnalysis(summonerName) {
        try {
            // Check cache first
            const cachedData = this.getFromCache(summonerName);
            if (cachedData) {
                loggerService_1.logger.info(`Cache hit for player: ${summonerName}`);
                return cachedData;
            }
            loggerService_1.logger.info(`Fetching fresh data for player: ${summonerName}`);
            const summoner = await this.riotApi.getSummonerByName(summonerName);
            const matchHistory = await this.riotApi.getMatchHistory(summoner.puuid);
            const matchDetails = await Promise.all(matchHistory.map(matchId => this.riotApi.getMatchDetails(matchId)));
            const analysis = {
                summonerId: summoner.id,
                accountId: summoner.accountId,
                puuid: summoner.puuid,
                name: summoner.name,
                level: summoner.summonerLevel,
                smurfProbability: 0,
                analysisFactors: {
                    playtimeGaps: {
                        averageGapHours: 0,
                        suspiciousGaps: [],
                        totalGapScore: 0
                    },
                    championPerformance: {
                        firstTimeChampions: [],
                        overallPerformanceScore: 0
                    },
                    summonerSpellUsage: {
                        spellPlacementChanges: [],
                        patternChangeScore: 0
                    },
                    playerAssociations: {
                        highEloAssociations: [],
                        associationScore: 0
                    }
                },
                lastUpdated: new Date()
            };
            // Store in cache
            this.addToCache(summonerName, analysis);
            return analysis;
        }
        catch (error) {
            loggerService_1.logger.error('Error fetching player analysis:', error);
            throw (0, errorHandler_1.createError)(500, 'Failed to fetch player analysis');
        }
    }
    /**
     * Fallback method to create EnhancedPlayerAnalysis from Riot API data
     * Used when OP.GG is unavailable or disabled
     */
    async fallbackToRiotApi(summonerName, region) {
        try {
            // Get basic player analysis first
            const basicAnalysis = await this.fetchPlayerAnalysis(summonerName);
            // Create a minimal enhanced analysis structure using available Riot API data
            const enhancedAnalysis = {
                summoner: {
                    name: basicAnalysis.name,
                    level: basicAnalysis.level,
                    profileIconId: 0, // Not available in basic analysis
                    region: region
                },
                currentRank: {
                    currentRank: {
                        tier: 'UNRANKED',
                        division: '',
                        lp: 0
                    },
                    rankHistory: [],
                    climbAnalysis: {
                        winStreak: 0,
                        currentWinRate: 0,
                        climbSpeed: 0,
                        skipDivisions: false,
                        newAccountRapidClimb: false,
                        mmrDiscrepancy: false
                    }
                },
                historicalTimeline: {
                    seasonData: [],
                    activityAnalysis: {
                        totalDaysActive: 0,
                        averageGamesPerDay: 0,
                        playTimeDistribution: {
                            hourOfDay: {},
                            dayOfWeek: {},
                            monthOfYear: {}
                        },
                        inactivityGaps: []
                    }
                },
                recentGames: [],
                championMastery: [],
                behavioralPatterns: {
                    communicationPatterns: {
                        chatFrequency: 0,
                        gameKnowledgeTerminology: false,
                        strategicCallouts: false,
                        flamePatterns: false,
                        coachingBehavior: false
                    },
                    gameplayPatterns: {
                        riskTaking: 0,
                        adaptability: 0,
                        teamFightPositioning: 0,
                        objectivePrioritization: 0,
                        mapAwareness: 0
                    },
                    duoAnalysis: {
                        duoPartners: [],
                        soloVsDuoPerformance: {
                            soloWinRate: 0,
                            duoWinRate: 0,
                            performanceDifference: 0
                        }
                    }
                },
                smurfDetection: {
                    overallProbability: basicAnalysis.smurfProbability,
                    confidenceLevel: 50, // Medium confidence for Riot API data
                    categoryBreakdown: {
                        performanceMetrics: {
                            score: 0,
                            weight: 0.35,
                            indicators: {
                                unusuallyHighKDA: false,
                                perfectCSEfficiency: false,
                                expertDamageDealing: false,
                                advancedVisionControl: false,
                                objectiveControl: false
                            }
                        },
                        historicalAnalysis: {
                            score: 0,
                            weight: 0.25,
                            indicators: {
                                newAccountHighPerformance: false,
                                rapidRankProgression: false,
                                mmrDiscrepancy: false,
                                skipDivisions: false
                            }
                        },
                        championMastery: {
                            score: 0,
                            weight: 0.20,
                            indicators: {
                                immediateChampionExpertise: false,
                                perfectBuildPaths: false,
                                advancedMechanics: false,
                                unusualChampionPool: false
                            }
                        },
                        gapAnalysis: {
                            score: basicAnalysis.analysisFactors.playtimeGaps.totalGapScore,
                            weight: 0.15,
                            indicators: {
                                suspiciousGaps: basicAnalysis.analysisFactors.playtimeGaps.suspiciousGaps.length > 0,
                                performanceJumpsAfterGaps: false,
                                roleShiftsAfterGaps: false,
                                championPoolChanges: false
                            }
                        },
                        behavioralPatterns: {
                            score: 0,
                            weight: 0.05,
                            indicators: {
                                advancedGameKnowledge: false,
                                strategicCommunication: false,
                                unusualDuoPartners: false,
                                coachingBehavior: false
                            }
                        }
                    },
                    evidenceLevel: 'weak',
                    keyFindings: ['Limited to Riot API data - using fallback analysis'],
                    redFlags: [],
                    comparisonToLegitPlayers: {
                        percentileRanking: {},
                        statisticalOutliers: []
                    }
                },
                analysisMetadata: {
                    dataQuality: {
                        gamesAnalyzed: 0,
                        timeSpanDays: 0,
                        missingDataPoints: ['OP.GG data unavailable', 'Using Riot API fallback'],
                        reliabilityScore: 60 // Lower reliability for fallback data
                    },
                    analysisTimestamp: new Date(),
                    apiLimitations: ['Development API Key limitations', 'OP.GG data unavailable'],
                    recommendedActions: ['Enable OP.GG integration for enhanced analysis', 'Obtain Personal API Key for complete data']
                }
            };
            loggerService_1.logger.info(`Created fallback enhanced analysis for ${summonerName}`);
            return enhancedAnalysis;
        }
        catch (error) {
            loggerService_1.logger.error(`Error creating fallback analysis for ${summonerName}:`, error);
            throw (0, errorHandler_1.createError)(500, 'Failed to create fallback analysis');
        }
    }
    /**
     * Refresh summoner data (OP.GG specific feature)
     */
    async refreshSummonerData(summonerName, region = 'na1') {
        if (this.USE_OPGG) {
            try {
                await this.opggAdapter.refreshSummonerData(summonerName, region);
                // Clear local caches for this summoner
                const keysToDelete = Array.from(this.enhancedCache.keys()).filter(key => key.includes(summonerName) && key.includes(region));
                keysToDelete.forEach(key => this.enhancedCache.delete(key));
                loggerService_1.logger.info(`Refreshed data and cleared cache for ${summonerName}`);
            }
            catch (error) {
                loggerService_1.logger.error(`Error refreshing summoner data: ${error}`);
                throw (0, errorHandler_1.createError)(500, 'Failed to refresh summoner data');
            }
        }
        else {
            loggerService_1.logger.warn('OP.GG refresh requested but OP.GG integration is disabled');
            throw (0, errorHandler_1.createError)(400, 'OP.GG integration is not enabled');
        }
    }
    // Original cache methods
    getFromCache(summonerName) {
        const entry = this.cache.get(summonerName);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > this.CACHE_DURATION) {
            this.cache.delete(summonerName);
            return null;
        }
        return entry.data;
    }
    addToCache(summonerName, data) {
        // If cache is full, remove oldest entry
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const oldestKey = Array.from(this.cache.entries())
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            this.cache.delete(oldestKey);
        }
        this.cache.set(summonerName, {
            data,
            timestamp: Date.now()
        });
    }
    // Enhanced cache methods
    getFromEnhancedCache(key) {
        const entry = this.enhancedCache.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > this.CACHE_DURATION) {
            this.enhancedCache.delete(key);
            return null;
        }
        return entry.data;
    }
    addToEnhancedCache(key, data) {
        if (this.enhancedCache.size >= this.MAX_CACHE_SIZE) {
            const oldestKey = Array.from(this.enhancedCache.entries())
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            this.enhancedCache.delete(oldestKey);
        }
        this.enhancedCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    clearCache() {
        this.cache.clear();
        this.enhancedCache.clear();
        if (this.USE_OPGG) {
            this.opggAdapter.clearCache();
        }
        loggerService_1.logger.info('All caches cleared');
    }
    getCacheSize() {
        return this.cache.size;
    }
    getCacheStats() {
        const basicStats = this.getBasicCacheStats();
        const enhancedStats = this.getEnhancedCacheStats();
        const stats = {
            basic: basicStats,
            enhanced: enhancedStats
        };
        if (this.USE_OPGG) {
            stats.opgg = this.opggAdapter.getCacheStats();
        }
        return stats;
    }
    getBasicCacheStats() {
        if (this.cache.size === 0) {
            return { size: 0, oldestEntry: 0, newestEntry: 0 };
        }
        const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);
        return {
            size: this.cache.size,
            oldestEntry: Math.min(...timestamps),
            newestEntry: Math.max(...timestamps)
        };
    }
    getEnhancedCacheStats() {
        if (this.enhancedCache.size === 0) {
            return { size: 0, oldestEntry: 0, newestEntry: 0 };
        }
        const timestamps = Array.from(this.enhancedCache.values()).map(entry => entry.timestamp);
        return {
            size: this.enhancedCache.size,
            oldestEntry: Math.min(...timestamps),
            newestEntry: Math.max(...timestamps)
        };
    }
    // Status and configuration methods
    getIntegrationStatus() {
        return {
            opggEnabled: this.USE_OPGG,
            serviceName: this.USE_OPGG ? 'OP.GG MCP + Riot API Fallback' : 'Riot API Only',
            features: this.USE_OPGG
                ? ['Enhanced Player Analysis', 'Real Summoner Data', 'Champion Analysis', 'Position Data', 'Data Refresh']
                : ['Basic Player Analysis', 'Limited Match Data'],
            limitations: this.USE_OPGG
                ? ['Rate limiting via OP.GG', 'Cache dependent']
                : ['Development API Key restrictions', 'Mock data for demos']
        };
    }
}
exports.DataFetchingService = DataFetchingService;
