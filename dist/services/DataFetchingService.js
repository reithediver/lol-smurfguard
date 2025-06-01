"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFetchingService = void 0;
const loggerService_1 = require("../utils/loggerService");
const errorHandler_1 = require("../utils/errorHandler");
class DataFetchingService {
    constructor(riotApi) {
        this.riotApi = riotApi;
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.MAX_CACHE_SIZE = 100; // Maximum number of cached entries
    }
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
}
exports.DataFetchingService = DataFetchingService;
