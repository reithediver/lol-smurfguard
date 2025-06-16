"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerDataService = void 0;
const StorageService_1 = require("./StorageService");
const loggerService_1 = __importDefault(require("../utils/loggerService"));
// Namespaces for different types of player data
var PlayerDataNamespace;
(function (PlayerDataNamespace) {
    PlayerDataNamespace["SUMMONER"] = "summoners";
    PlayerDataNamespace["MATCH_HISTORY"] = "match_histories";
    PlayerDataNamespace["ANALYSIS"] = "analyses";
    PlayerDataNamespace["MATCH_DETAILS"] = "match_details";
})(PlayerDataNamespace || (PlayerDataNamespace = {}));
// TTL values for different types of data (in milliseconds)
const TTL = {
    SUMMONER: 24 * 60 * 60 * 1000, // 24 hours
    MATCH_HISTORY: 12 * 60 * 60 * 1000, // 12 hours
    ANALYSIS: 24 * 60 * 60 * 1000, // 24 hours
    MATCH_DETAILS: 7 * 24 * 60 * 60 * 1000 // 7 days
};
/**
 * Service for managing player data storage and retrieval
 */
class PlayerDataService {
    constructor(riotApi) {
        this.storageService = new StorageService_1.StorageService({
            baseDir: 'storage/players',
            maxMemoryCacheSize: 500 // Limit memory usage
        });
        this.riotApi = riotApi;
    }
    /**
     * Get summoner data by Riot ID, from cache or API
     * @param gameName Game name portion of Riot ID
     * @param tagLine Tag line portion of Riot ID
     * @param forceRefresh Whether to force a refresh from the API
     */
    async getSummonerByRiotId(gameName, tagLine, forceRefresh = false) {
        const key = `${gameName.toLowerCase()}_${tagLine.toLowerCase()}`;
        // Try to get from cache first unless force refresh
        if (!forceRefresh) {
            const cached = await this.storageService.get(PlayerDataNamespace.SUMMONER, key);
            if (cached) {
                loggerService_1.default.info(`Retrieved summoner data for ${gameName}#${tagLine} from cache`);
                return cached;
            }
        }
        // Get from API
        loggerService_1.default.info(`Fetching summoner data for ${gameName}#${tagLine} from API`);
        const summoner = await this.riotApi.getSummonerByRiotId(gameName, tagLine);
        // Store in cache
        await this.storageService.set(PlayerDataNamespace.SUMMONER, key, summoner, TTL.SUMMONER);
        return summoner;
    }
    /**
     * Get match history for a player, from cache or API
     * @param puuid Player UUID
     * @param count Number of matches to retrieve
     * @param forceRefresh Whether to force a refresh from the API
     */
    async getMatchHistory(puuid, count = 100, forceRefresh = false) {
        const key = `${puuid}_${count}`;
        // Try to get from cache first unless force refresh
        if (!forceRefresh) {
            const cached = await this.storageService.get(PlayerDataNamespace.MATCH_HISTORY, key);
            if (cached) {
                loggerService_1.default.info(`Retrieved match history for ${puuid} from cache`);
                return cached;
            }
        }
        // Get from API
        loggerService_1.default.info(`Fetching match history for ${puuid} from API`);
        const matchHistory = await this.riotApi.getMatchHistory(puuid, count);
        // Store in cache
        await this.storageService.set(PlayerDataNamespace.MATCH_HISTORY, key, matchHistory, TTL.MATCH_HISTORY);
        return matchHistory;
    }
    /**
     * Get match details, from cache or API
     * @param matchId Match ID
     * @param forceRefresh Whether to force a refresh from the API
     */
    async getMatchDetails(matchId, forceRefresh = false) {
        // Try to get from cache first unless force refresh
        if (!forceRefresh) {
            const cached = await this.storageService.get(PlayerDataNamespace.MATCH_DETAILS, matchId);
            if (cached) {
                loggerService_1.default.info(`Retrieved match details for ${matchId} from cache`);
                return cached;
            }
        }
        // Get from API
        loggerService_1.default.info(`Fetching match details for ${matchId} from API`);
        const matchDetails = await this.riotApi.getMatchDetails(matchId);
        // Store in cache
        await this.storageService.set(PlayerDataNamespace.MATCH_DETAILS, matchId, matchDetails, TTL.MATCH_DETAILS);
        return matchDetails;
    }
    /**
     * Store analysis results for a player
     * @param puuid Player UUID
     * @param analysis Analysis data
     */
    async storeAnalysis(puuid, analysis) {
        await this.storageService.set(PlayerDataNamespace.ANALYSIS, puuid, analysis, TTL.ANALYSIS);
        loggerService_1.default.info(`Stored analysis for ${puuid}`);
    }
    /**
     * Get analysis results for a player if available
     * @param puuid Player UUID
     */
    async getAnalysis(puuid) {
        return await this.storageService.get(PlayerDataNamespace.ANALYSIS, puuid);
    }
    /**
     * Get storage statistics for player data
     */
    async getStats() {
        return await this.storageService.getStats();
    }
    /**
     * Clear expired data
     */
    async clearExpired() {
        // The StorageService automatically cleans expired items when reading
        // This method is for manual cleanup
        loggerService_1.default.info('Manual cleanup of expired player data initiated');
        // We could implement additional cleanup logic here if needed
    }
}
exports.PlayerDataService = PlayerDataService;
