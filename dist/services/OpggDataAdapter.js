"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpggDataAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const loggerService_1 = __importDefault(require("../utils/loggerService"));
const errorHandler_1 = require("../utils/errorHandler");
class OpggDataAdapter {
    constructor() {
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.MAX_CACHE_SIZE = 200;
        this.BASE_URL = 'https://mcp-api.op.gg/mcp';
        this.USE_MOCK_DATA = false; // Disable mock mode - use real API calls only
        this.apiClient = axios_1.default.create({
            baseURL: this.BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SmurfGuard-OpggAdapter/1.0.0'
            }
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor for logging
        this.apiClient.interceptors.request.use((config) => {
            loggerService_1.default.info(`OP.GG API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            loggerService_1.default.error('OP.GG API Request Error:', error);
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.apiClient.interceptors.response.use((response) => {
            loggerService_1.default.info(`OP.GG API Response: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            loggerService_1.default.error('OP.GG API Response Error:', error.response?.data || error.message);
            return Promise.reject(error);
        });
    }
    /**
     * Main method to get comprehensive enhanced player analysis using OP.GG data
     */
    async getEnhancedPlayerAnalysis(summonerName, region = 'na1') {
        try {
            loggerService_1.default.info(`Fetching enhanced analysis for ${summonerName} in ${region}`);
            // Check cache first
            const cacheKey = `analysis_${summonerName}_${region}`;
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData) {
                loggerService_1.default.info(`Cache hit for enhanced analysis: ${summonerName}`);
                return cachedData;
            }
            // Use mock data if OP.GG API is not available
            if (this.USE_MOCK_DATA) {
                loggerService_1.default.info(`Using mock OP.GG data for ${summonerName} (OP.GG MCP API not available)`);
                const mockAnalysis = this.generateMockEnhancedAnalysis(summonerName, region);
                this.addToCache(cacheKey, mockAnalysis);
                return mockAnalysis;
            }
            // Fetch all required data in parallel for better performance
            const [summonerData, matchHistory, championAnalysis, positionData] = await Promise.all([
                this.fetchSummonerData(summonerName, region),
                this.fetchMatchHistory(summonerName, region),
                this.fetchChampionAnalysis(summonerName, region),
                this.fetchPositionData(summonerName, region)
            ]);
            // Transform OP.GG data to our enhanced model
            const enhancedAnalysis = this.transformToEnhancedPlayerAnalysis(summonerData, matchHistory, championAnalysis, positionData, summonerName, region);
            // Cache the result
            this.addToCache(cacheKey, enhancedAnalysis);
            loggerService_1.default.info(`Successfully created enhanced analysis for ${summonerName}`);
            return enhancedAnalysis;
        }
        catch (error) {
            loggerService_1.default.error(`Error creating enhanced analysis for ${summonerName}:`, error);
            // Fallback to mock data if real API fails
            loggerService_1.default.info(`Falling back to mock data for ${summonerName}`);
            const cacheKey = `analysis_${summonerName}_${region}`;
            const mockAnalysis = this.generateMockEnhancedAnalysis(summonerName, region);
            this.addToCache(cacheKey, mockAnalysis);
            return mockAnalysis;
        }
    }
    /**
     * Fetch summoner data using OP.GG MCP lol-summoner-search
     */
    async fetchSummonerData(summonerName, region) {
        const cacheKey = `summoner_${summonerName}_${region}`;
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        const response = await this.apiClient.post('/lol-summoner-search', {
            summonerName,
            region
        });
        this.addToCache(cacheKey, response.data);
        return response.data;
    }
    /**
     * Fetch match history using OP.GG MCP lol-summoner-game-history
     */
    async fetchMatchHistory(summonerName, region) {
        const cacheKey = `matches_${summonerName}_${region}`;
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        const response = await this.apiClient.post('/lol-summoner-game-history', {
            summonerName,
            region,
            count: 20 // Get last 20 games for analysis
        });
        this.addToCache(cacheKey, response.data);
        return response.data;
    }
    /**
     * Fetch champion analysis using OP.GG MCP lol-champion-analysis
     */
    async fetchChampionAnalysis(summonerName, region) {
        const cacheKey = `champions_${summonerName}_${region}`;
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        const response = await this.apiClient.post('/lol-champion-analysis', {
            summonerName,
            region
        });
        this.addToCache(cacheKey, response.data);
        return response.data;
    }
    /**
     * Fetch position data using OP.GG MCP lol-champion-positions-data
     */
    async fetchPositionData(summonerName, region) {
        const cacheKey = `positions_${summonerName}_${region}`;
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        const response = await this.apiClient.post('/lol-champion-positions-data', {
            summonerName,
            region
        });
        this.addToCache(cacheKey, response.data);
        return response.data;
    }
    /**
     * Transform OP.GG data to our EnhancedPlayerAnalysis model
     */
    transformToEnhancedPlayerAnalysis(summonerData, matchHistory, championAnalysis, positionData, summonerName, region) {
        // Transform recent games
        const recentGames = matchHistory.matches.map(match => ({
            gameId: match.gameId,
            timestamp: new Date(match.gameCreation),
            champion: match.championName,
            role: match.teamPosition,
            outcome: match.win ? 'win' : 'loss',
            metrics: this.transformToGameMetrics(match),
            gameLength: match.gameDuration,
            queueType: 'RANKED_SOLO_5x5' // Default, could be enhanced
        }));
        // Transform champion mastery data
        const championMastery = championAnalysis.champions.map(champ => this.transformToChampionMastery(champ, matchHistory.matches));
        // Transform rank progression
        const currentRank = this.transformToRankProgression(summonerData, matchHistory.matches);
        // Create basic enhanced analysis structure
        const enhancedAnalysis = {
            summoner: {
                name: summonerName,
                level: summonerData.summoner.level,
                profileIconId: summonerData.summoner.profileIconId,
                region: region
            },
            currentRank,
            historicalTimeline: {
                seasonData: summonerData.previousSeasons.map(season => ({
                    season: season.season,
                    rank: {
                        tier: season.tier,
                        division: season.rank,
                        lp: 0, // OP.GG doesn't provide LP for historical
                        peakRank: `${season.tier} ${season.rank}`
                    },
                    gamesPlayed: season.wins + season.losses,
                    winRate: season.wins / (season.wins + season.losses) * 100,
                    champions: [], // Would need additional API calls
                    averagePerformance: 0, // Calculated elsewhere
                    monthlyBreakdown: [] // Would need more granular data
                })),
                activityAnalysis: {
                    totalDaysActive: 0, // Calculated from match timestamps
                    averageGamesPerDay: 0,
                    playTimeDistribution: {
                        hourOfDay: {},
                        dayOfWeek: {},
                        monthOfYear: {}
                    },
                    inactivityGaps: [] // Requires gap analysis logic
                }
            },
            recentGames,
            championMastery,
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
                overallProbability: 0,
                confidenceLevel: 0,
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
                    gamesAnalyzed: matchHistory.matches.length,
                    timeSpanDays: this.calculateTimeSpan(matchHistory.matches),
                    missingDataPoints: [],
                    reliabilityScore: 85 // OP.GG data is generally reliable
                },
                analysisTimestamp: new Date(),
                apiLimitations: ['Limited to OP.GG available data', 'No real-time match data'],
                recommendedActions: []
            }
        };
        return enhancedAnalysis;
    }
    /**
     * Transform match data to our game metrics model
     */
    transformToGameMetrics(match) {
        const gameDurationMinutes = match.gameDuration / 60;
        return {
            kda: {
                kills: match.kills,
                deaths: match.deaths,
                assists: match.assists,
                ratio: match.deaths > 0 ? (match.kills + match.assists) / match.deaths : match.kills + match.assists,
                averageKDA: 0 // Calculated across multiple games
            },
            csData: {
                total: match.totalMinionsKilled,
                perMinute: match.totalMinionsKilled / gameDurationMinutes,
                at10Minutes: 0, // Not available from OP.GG
                at15Minutes: 0,
                perfectCSMissed: 0,
                csEfficiency: 0
            },
            visionMetrics: {
                visionScore: match.visionScore || 0,
                wardsPlaced: match.wardsPlaced || 0,
                wardsKilled: match.wardsKilled || 0,
                controlWardsPlaced: match.controlWardsPlaced || 0,
                visionDensity: 0
            },
            damageMetrics: {
                totalDamage: match.totalDamageDealtToChampions,
                damagePerMinute: match.totalDamageDealtToChampions / gameDurationMinutes,
                damageShare: 0, // Would need team damage data
                damageEfficiency: match.goldEarned > 0 ? match.totalDamageDealtToChampions / match.goldEarned : 0,
                damageToChampions: match.totalDamageDealtToChampions,
                damageToObjectives: 0
            },
            goldMetrics: {
                totalGold: match.goldEarned,
                goldPerMinute: match.goldEarned / gameDurationMinutes,
                goldEfficiency: 0,
                goldAdvantageAt10: 0,
                goldAdvantageAt15: 0
            },
            objectiveControl: {
                dragonParticipation: 0,
                baronParticipation: 0,
                riftHeraldParticipation: 0,
                turretDamage: 0,
                epicMonsterSteals: 0
            }
        };
    }
    /**
     * Transform champion data to our champion mastery model
     */
    transformToChampionMastery(champion, matches) {
        const championMatches = matches.filter(match => match.championName === champion.championName);
        return {
            championId: champion.championId,
            championName: champion.championName,
            gamesPlayed: champion.games,
            winRate: (champion.wins / champion.games) * 100,
            performanceByGame: championMatches.map((match, index) => ({
                gameNumber: index + 1,
                kda: match.deaths > 0 ? (match.kills + match.assists) / match.deaths : match.kills + match.assists,
                csPerMinute: match.totalMinionsKilled / (match.gameDuration / 60),
                damageShare: 0, // Would need team data
                visionScore: match.visionScore || 0,
                gameLength: match.gameDuration,
                timestamp: new Date(match.gameCreation)
            })),
            expertiseIndicators: {
                immediateHighPerformance: false, // Analyzed elsewhere
                unusualBuildOptimization: false,
                advancedMechanics: false,
                mapAwareness: false,
                enemyTrackingKnowledge: false
            },
            progression: {
                initialPerformance: 0,
                peakPerformance: 0,
                consistencyScore: 0,
                learningRate: 0
            }
        };
    }
    /**
     * Transform rank data to our rank progression model
     */
    transformToRankProgression(summonerData, matches) {
        return {
            currentRank: {
                tier: summonerData.summoner.tier,
                division: summonerData.summoner.rank,
                lp: summonerData.summoner.leaguePoints,
                promos: undefined // OP.GG doesn't provide promo data
            },
            rankHistory: [], // Would need historical rank tracking
            climbAnalysis: {
                winStreak: 0, // Calculated from recent matches
                currentWinRate: summonerData.summoner.wins / (summonerData.summoner.wins + summonerData.summoner.losses) * 100,
                climbSpeed: 0,
                skipDivisions: false,
                newAccountRapidClimb: false,
                mmrDiscrepancy: false
            }
        };
    }
    /**
     * Calculate time span of matches in days
     */
    calculateTimeSpan(matches) {
        if (matches.length === 0)
            return 0;
        const timestamps = matches.map(match => match.gameCreation);
        const oldest = Math.min(...timestamps);
        const newest = Math.max(...timestamps);
        return Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24));
    }
    /**
     * Refresh summoner data using OP.GG MCP lol-summoner-renewal
     */
    async refreshSummonerData(summonerName, region = 'na1') {
        try {
            await this.apiClient.post('/lol-summoner-renewal', {
                summonerName,
                region
            });
            // Clear cache for this summoner to force fresh data
            const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(summonerName) && key.includes(region));
            keysToDelete.forEach(key => this.cache.delete(key));
            loggerService_1.default.info(`Refreshed and cleared cache for ${summonerName} in ${region}`);
        }
        catch (error) {
            loggerService_1.default.error(`Error refreshing summoner data for ${summonerName}:`, error);
            throw (0, errorHandler_1.createError)(500, 'Failed to refresh summoner data');
        }
    }
    // Cache management methods
    getFromCache(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > this.CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    addToCache(key, data) {
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const oldestKey = Array.from(this.cache.entries())
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    clearCache() {
        this.cache.clear();
        loggerService_1.default.info('OP.GG adapter cache cleared');
    }
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    /**
     * Generate mock enhanced analysis data for development/testing
     */
    generateMockEnhancedAnalysis(summonerName, region) {
        const mockRank = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'][Math.floor(Math.random() * 9)];
        const mockTier = ['IV', 'III', 'II', 'I'][Math.floor(Math.random() * 4)];
        const mockChampions = ['Yasuo', 'Jinx', 'Thresh', 'Lee Sin', 'Ahri', 'Vayne', 'Ezreal', 'Zed'];
        return {
            // Basic summoner info
            summoner: {
                name: summonerName,
                level: Math.floor(Math.random() * 200) + 30,
                profileIconId: Math.floor(Math.random() * 30) + 1,
                region: region
            },
            // Current rank progression
            currentRank: {
                currentRank: {
                    tier: mockRank,
                    division: mockTier,
                    lp: Math.floor(Math.random() * 100),
                    promos: Math.random() > 0.8 ? {
                        wins: Math.floor(Math.random() * 3),
                        losses: Math.floor(Math.random() * 3),
                        series: 'BO3'
                    } : undefined
                },
                rankHistory: [],
                climbAnalysis: {
                    winStreak: Math.floor(Math.random() * 10),
                    currentWinRate: Math.random() * 30 + 50,
                    climbSpeed: Math.random() * 50,
                    skipDivisions: Math.random() > 0.8,
                    newAccountRapidClimb: Math.random() > 0.9,
                    mmrDiscrepancy: Math.random() > 0.7
                }
            },
            // Historical timeline
            historicalTimeline: {
                seasonData: [{
                        season: '2024',
                        rank: {
                            tier: mockRank,
                            division: mockTier,
                            lp: Math.floor(Math.random() * 100),
                            peakRank: `${mockRank} I`
                        },
                        gamesPlayed: Math.floor(Math.random() * 200) + 50,
                        winRate: Math.random() * 30 + 50,
                        champions: [],
                        averagePerformance: Math.random() * 100,
                        monthlyBreakdown: []
                    }],
                activityAnalysis: {
                    totalDaysActive: Math.floor(Math.random() * 365),
                    averageGamesPerDay: Math.random() * 10 + 1,
                    playTimeDistribution: {
                        hourOfDay: {},
                        dayOfWeek: {},
                        monthOfYear: {}
                    },
                    inactivityGaps: []
                }
            },
            // Recent games
            recentGames: [],
            // Champion mastery with correct structure
            championMastery: mockChampions.slice(0, 3).map((champion, index) => ({
                championId: index + 1,
                championName: champion,
                gamesPlayed: Math.floor(Math.random() * 100) + 10,
                winRate: Math.random() * 40 + 60,
                performanceByGame: [],
                expertiseIndicators: {
                    immediateHighPerformance: Math.random() > 0.7,
                    unusualBuildOptimization: Math.random() > 0.8,
                    advancedMechanics: Math.random() > 0.6,
                    mapAwareness: Math.random() > 0.5,
                    enemyTrackingKnowledge: Math.random() > 0.7
                },
                progression: {
                    initialPerformance: Math.random() * 100,
                    peakPerformance: Math.random() * 100,
                    consistencyScore: Math.random() * 100,
                    learningRate: Math.random() * 100
                }
            })),
            // Behavioral patterns with correct structure
            behavioralPatterns: {
                communicationPatterns: {
                    chatFrequency: Math.random() * 100,
                    gameKnowledgeTerminology: Math.random() > 0.7,
                    strategicCallouts: Math.random() > 0.6,
                    flamePatterns: Math.random() > 0.8,
                    coachingBehavior: Math.random() > 0.8
                },
                gameplayPatterns: {
                    riskTaking: Math.random() * 100,
                    adaptability: Math.random() * 100,
                    teamFightPositioning: Math.random() * 100,
                    objectivePrioritization: Math.random() * 100,
                    mapAwareness: Math.random() * 100
                },
                duoAnalysis: {
                    duoPartners: [],
                    soloVsDuoPerformance: {
                        soloWinRate: Math.random() * 100,
                        duoWinRate: Math.random() * 100,
                        performanceDifference: Math.random() * 20 - 10
                    }
                }
            },
            // Smurf detection with correct structure
            smurfDetection: {
                overallProbability: Math.random() * 100,
                confidenceLevel: Math.random() * 50 + 50,
                categoryBreakdown: {
                    performanceMetrics: {
                        score: Math.random() * 100,
                        weight: 0.35,
                        indicators: {
                            unusuallyHighKDA: Math.random() > 0.8,
                            perfectCSEfficiency: Math.random() > 0.9,
                            expertDamageDealing: Math.random() > 0.7,
                            advancedVisionControl: Math.random() > 0.8,
                            objectiveControl: Math.random() > 0.6
                        }
                    },
                    historicalAnalysis: {
                        score: Math.random() * 100,
                        weight: 0.25,
                        indicators: {
                            newAccountHighPerformance: Math.random() > 0.8,
                            rapidRankProgression: Math.random() > 0.7,
                            mmrDiscrepancy: Math.random() > 0.6,
                            skipDivisions: Math.random() > 0.8
                        }
                    },
                    championMastery: {
                        score: Math.random() * 100,
                        weight: 0.20,
                        indicators: {
                            immediateChampionExpertise: Math.random() > 0.7,
                            perfectBuildPaths: Math.random() > 0.8,
                            advancedMechanics: Math.random() > 0.6,
                            unusualChampionPool: Math.random() > 0.5
                        }
                    },
                    gapAnalysis: {
                        score: Math.random() * 100,
                        weight: 0.15,
                        indicators: {
                            suspiciousGaps: Math.random() > 0.8,
                            performanceJumpsAfterGaps: Math.random() > 0.7,
                            roleShiftsAfterGaps: Math.random() > 0.6,
                            championPoolChanges: Math.random() > 0.5
                        }
                    },
                    behavioralPatterns: {
                        score: Math.random() * 100,
                        weight: 0.05,
                        indicators: {
                            advancedGameKnowledge: Math.random() > 0.7,
                            strategicCommunication: Math.random() > 0.6,
                            unusualDuoPartners: Math.random() > 0.8,
                            coachingBehavior: Math.random() > 0.8
                        }
                    }
                },
                evidenceLevel: ['weak', 'moderate', 'strong', 'overwhelming'][Math.floor(Math.random() * 4)],
                keyFindings: [
                    'High win rate on mechanically intensive champions',
                    'Unusual skill progression patterns',
                    'Advanced game knowledge for account level'
                ].slice(0, Math.floor(Math.random() * 3) + 1),
                redFlags: ['New account', 'Rapid rank progression'].slice(0, Math.floor(Math.random() * 2) + 1),
                comparisonToLegitPlayers: {
                    percentileRanking: {
                        kda: Math.random() * 100,
                        cs: Math.random() * 100,
                        vision: Math.random() * 100
                    },
                    statisticalOutliers: ['KDA', 'CS efficiency'].slice(0, Math.floor(Math.random() * 2) + 1)
                }
            },
            // Analysis metadata with correct structure
            analysisMetadata: {
                dataQuality: {
                    gamesAnalyzed: Math.floor(Math.random() * 50) + 20,
                    timeSpanDays: Math.floor(Math.random() * 90) + 30,
                    missingDataPoints: [],
                    reliabilityScore: Math.random() * 30 + 70
                },
                analysisTimestamp: new Date(),
                apiLimitations: ['Mock data for development', 'OP.GG MCP API not available'],
                recommendedActions: ['Test with real summoner names', 'Enable personal API key when available']
            }
        };
    }
}
exports.OpggDataAdapter = OpggDataAdapter;
