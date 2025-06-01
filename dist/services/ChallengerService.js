"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengerService = void 0;
const axios_1 = __importDefault(require("axios"));
const loggerService_1 = require("../utils/loggerService");
const errorHandler_1 = require("../utils/errorHandler");
const storageAdapter_1 = require("../utils/storageAdapter");
class ChallengerService {
    constructor(apiKey, region = 'na1') {
        this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.apiKey = apiKey;
        this.region = region;
        this.cache = new Map();
    }
    /**
     * Get challenger league data
     * @param queue Queue type (default: RANKED_SOLO_5x5)
     */
    async getChallengerLeague(queue = 'RANKED_SOLO_5x5') {
        try {
            const cacheKey = `challenger-league-${queue}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                loggerService_1.logger.debug('Returning cached challenger league data');
                return cached.data;
            }
            const response = await axios_1.default.get(`https://${this.region}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/${queue}`, { headers: { 'X-Riot-Token': this.apiKey } });
            // Store in cache
            this.cache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            loggerService_1.logger.error('Failed to get challenger league:', axiosError.response?.status, axiosError.response?.statusText);
            throw (0, errorHandler_1.createError)(axiosError.response?.status || 500, 'Failed to get challenger league');
        }
    }
    /**
     * Get top challenger players
     * @param limit Number of players to return (default: 10)
     * @param queue Queue type (default: RANKED_SOLO_5x5)
     */
    async getTopChallengers(limit = 10, queue = 'RANKED_SOLO_5x5') {
        const league = await this.getChallengerLeague(queue);
        return league.entries
            .sort((a, b) => b.leaguePoints - a.leaguePoints)
            .slice(0, limit);
    }
    /**
     * Track player movement in challenger league over time
     */
    async trackChallengerMovement() {
        // Get current challenger data
        const currentChallengers = await this.getChallengerLeague();
        // Check for previous challenger data in storage
        const previousDataJson = storageAdapter_1.storage.getItem('previous-challenger-data');
        if (!previousDataJson) {
            // No previous data, store current data for future comparison
            storageAdapter_1.storage.setItem('previous-challenger-data', JSON.stringify({
                challengers: currentChallengers,
                timestamp: Date.now()
            }));
            return {
                newPlayers: [],
                droppedPlayers: [],
                improved: [],
                declined: []
            };
        }
        try {
            const previousData = JSON.parse(previousDataJson);
            const previousChallengers = previousData.challengers;
            // Create maps for easier lookup
            const currentPlayerMap = new Map();
            currentChallengers.entries.forEach(player => {
                currentPlayerMap.set(player.summonerId, player);
            });
            const previousPlayerMap = new Map();
            previousChallengers.entries.forEach(player => {
                previousPlayerMap.set(player.summonerId, player);
            });
            // Find new players (in current, not in previous)
            const newPlayers = currentChallengers.entries.filter(player => !previousPlayerMap.has(player.summonerId));
            // Find dropped players (in previous, not in current)
            const droppedPlayers = previousChallengers.entries
                .filter(player => !currentPlayerMap.has(player.summonerId))
                .map(player => player.summonerName);
            // Find players who improved or declined
            const improved = [];
            const declined = [];
            currentChallengers.entries.forEach(currentPlayer => {
                const previousPlayer = previousPlayerMap.get(currentPlayer.summonerId);
                if (previousPlayer) {
                    const lpDifference = currentPlayer.leaguePoints - previousPlayer.leaguePoints;
                    if (lpDifference > 50) {
                        improved.push({
                            ...currentPlayer,
                            // Add additional info if needed
                        });
                    }
                    else if (lpDifference < -50) {
                        declined.push({
                            ...currentPlayer,
                            // Add additional info if needed
                        });
                    }
                }
            });
            // Update stored data if more than a day has passed
            const oneDay = 24 * 60 * 60 * 1000;
            if (Date.now() - previousData.timestamp > oneDay) {
                storageAdapter_1.storage.setItem('previous-challenger-data', JSON.stringify({
                    challengers: currentChallengers,
                    timestamp: Date.now()
                }));
            }
            return {
                newPlayers,
                droppedPlayers,
                improved,
                declined
            };
        }
        catch (error) {
            loggerService_1.logger.error('Error tracking challenger movement:', error);
            // Reset stored data
            storageAdapter_1.storage.setItem('previous-challenger-data', JSON.stringify({
                challengers: currentChallengers,
                timestamp: Date.now()
            }));
            return {
                newPlayers: [],
                droppedPlayers: [],
                improved: [],
                declined: []
            };
        }
    }
    /**
     * Analyze a challenger player's stats
     * @param playerId Summoner ID of the player
     */
    async analyzePlayer(playerId) {
        const league = await this.getChallengerLeague();
        const player = league.entries.find(entry => entry.summonerId === playerId);
        if (!player) {
            return null;
        }
        const totalGames = player.wins + player.losses;
        const winRate = totalGames > 0 ? (player.wins / totalGames) * 100 : 0;
        // Estimate average LP gain based on total games and LP
        // This is a rough approximation since we don't have match history
        const averageLpGain = totalGames > 0 ? player.leaguePoints / totalGames : 0;
        return {
            winRate,
            totalGames,
            averageLpGain,
            isHotStreak: player.hotStreak,
            isVeteran: player.veteran,
            isFreshBlood: player.freshBlood,
            isInactive: player.inactive
        };
    }
    /**
     * Clear the challenger service cache
     */
    clearCache() {
        this.cache.clear();
    }
}
exports.ChallengerService = ChallengerService;
