"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFetchingService = void 0;
const RiotApi_1 = require("../api/RiotApi");
const OpggMcpClient_1 = require("./OpggMcpClient");
const loggerService_1 = __importDefault(require("../utils/loggerService"));
const errorHandler_1 = require("../utils/errorHandler");
class DataFetchingService {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.MAX_CACHE_SIZE = 100; // Maximum number of cached entries
        this.riotApi = new RiotApi_1.RiotApi(process.env.RIOT_API_KEY || 'demo-key');
        this.opggMcpClient = new OpggMcpClient_1.OpggMcpClient();
        // Configuration based on environment variables  
        this.config = {
            useOpggMcp: false,
            useRiotApi: true,
            fallbackToMock: false // Disable mock data to get real error messages
        };
        loggerService_1.default.info('DataFetchingService initialized with config:', this.config);
    }
    async fetchPlayerAnalysis(summonerName) {
        try {
            // Check cache first
            const cachedData = this.getFromCache(summonerName);
            if (cachedData) {
                loggerService_1.default.info(`Cache hit for player: ${summonerName}`);
                return cachedData;
            }
            loggerService_1.default.info(`Fetching fresh data for player: ${summonerName}`);
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
            loggerService_1.default.error('Error fetching player analysis:', error);
            throw (0, errorHandler_1.createError)(500, 'Failed to fetch player analysis');
        }
    }
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
    clearCache() {
        this.cache.clear();
    }
    getCacheSize() {
        return this.cache.size;
    }
    getCacheStats() {
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
    /**
     * Get enhanced player analysis using the best available data source
     */
    async getEnhancedPlayerAnalysis(summonerName, region = 'na1') {
        loggerService_1.default.info(`Fetching enhanced analysis for ${summonerName} in ${region}`);
        // Try OP.GG MCP first if enabled
        if (this.config.useOpggMcp) {
            try {
                loggerService_1.default.info('Attempting OP.GG MCP analysis...');
                const opggResult = await this.opggMcpClient.getEnhancedPlayerAnalysis(summonerName, region);
                loggerService_1.default.info('✅ OP.GG MCP analysis successful');
                return opggResult;
            }
            catch (error) {
                loggerService_1.default.warn('⚠️ OP.GG MCP analysis failed:', error);
                // Continue to fallback options
            }
        }
        // Fallback to Riot API + enhanced processing
        if (this.config.useRiotApi) {
            try {
                loggerService_1.default.info('Attempting Riot API + enhanced analysis...');
                const riotResult = await this.getRiotApiEnhancedAnalysis(summonerName, region);
                loggerService_1.default.info('✅ Riot API enhanced analysis successful');
                return riotResult;
            }
            catch (error) {
                loggerService_1.default.warn('⚠️ Riot API enhanced analysis failed:', error);
            }
        }
        throw new Error('All data sources failed');
    }
    /**
     * Enhanced analysis using Riot API data
     */
    async getRiotApiEnhancedAnalysis(summonerName, region) {
        loggerService_1.default.info('Creating enhanced analysis from Riot API data...');
        try {
            // Parse Riot ID if provided in format GameName#TAG
            const riotIdParts = RiotApi_1.RiotApi.parseRiotId(summonerName);
            let summonerData;
            if (riotIdParts) {
                // Use modern Riot ID approach
                summonerData = await this.riotApi.getSummonerByRiotId(riotIdParts.gameName, riotIdParts.tagLine);
            }
            else {
                // Fallback to legacy summoner name
                summonerData = await this.riotApi.getSummonerByName(summonerName);
            }
            // Use SmurfDetectionService for real analysis instead of mock data
            const { SmurfDetectionService } = await Promise.resolve().then(() => __importStar(require('./SmurfDetectionService')));
            const smurfDetectionService = new SmurfDetectionService(this.riotApi);
            const analysis = await smurfDetectionService.analyzeSmurf(summonerData.puuid, region);
            // Convert to EnhancedPlayerAnalysis format
            const enhancedAnalysis = {
                summoner: {
                    name: summonerData.name || summonerData.gameName,
                    level: summonerData.summonerLevel,
                    profileIconId: summonerData.profileIconId,
                    region: region
                },
                currentRank: {
                    currentRank: {
                        tier: 'UNRANKED',
                        division: 'I',
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
                    overallProbability: analysis.smurfProbability,
                    confidenceLevel: 85,
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
                            score: 0,
                            weight: 0.15,
                            indicators: {
                                suspiciousGaps: false,
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
                    keyFindings: [],
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
                        missingDataPoints: [],
                        reliabilityScore: 75
                    },
                    analysisTimestamp: new Date(),
                    apiLimitations: [],
                    recommendedActions: []
                }
            };
            return enhancedAnalysis;
        }
        catch (error) {
            loggerService_1.default.error('Riot API enhanced analysis failed:', error);
            throw error;
        }
    }
    /**
     * Get integration status
     */
    async getIntegrationStatus() {
        let opggStatus = { enabled: false, connected: false, tools: [] };
        if (this.config.useOpggMcp) {
            try {
                const status = await this.opggMcpClient.getIntegrationStatus();
                opggStatus = {
                    enabled: true,
                    connected: status.connected,
                    tools: status.availableTools
                };
            }
            catch (error) {
                loggerService_1.default.error('Error checking OP.GG MCP status:', error);
            }
        }
        return {
            opggMcp: opggStatus,
            riotApi: {
                enabled: this.config.useRiotApi,
                connected: true // Assume Riot API is available
            },
            fallbackMode: this.config.fallbackToMock
        };
    }
    /**
     * Health check for all data sources
     */
    async healthCheck() {
        try {
            if (this.config.useOpggMcp) {
                const opggHealth = await this.opggMcpClient.healthCheck();
                if (opggHealth)
                    return true;
            }
            if (this.config.useRiotApi) {
                // Assume Riot API is healthy for now
                return true;
            }
            return this.config.fallbackToMock;
        }
        catch (error) {
            loggerService_1.default.error('Health check failed:', error);
            return false;
        }
    }
    /**
     * Cleanup connections
     */
    async cleanup() {
        try {
            await this.opggMcpClient.disconnect();
            loggerService_1.default.info('DataFetchingService cleanup completed');
        }
        catch (error) {
            loggerService_1.default.error('Error during cleanup:', error);
        }
    }
}
exports.DataFetchingService = DataFetchingService;
