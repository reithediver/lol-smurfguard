"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChampionStatsService = void 0;
const loggerService_1 = require("../utils/loggerService");
class ChampionStatsService {
    constructor(riotApi) {
        this.riotApi = riotApi;
    }
    async getComprehensiveStats(puuid, matchCount = 200) {
        loggerService_1.logger.info(`🔍 Generating comprehensive stats for PUUID: ${puuid}`);
        try {
            // Get extended match history
            const matchIds = await this.riotApi.getExtendedMatchHistory(puuid, matchCount);
            loggerService_1.logger.info(`📊 Retrieved ${matchIds.length} match IDs`);
            // Fetch match details in batches to avoid rate limits
            const matches = await this.fetchMatchesInBatches(matchIds, puuid);
            loggerService_1.logger.info(`✅ Processed ${matches.length} detailed matches`);
            // Generate comprehensive statistics
            const overallStats = this.calculateOverallStats(matches, puuid);
            const championStats = this.calculateChampionStats(matches, puuid);
            return {
                ...overallStats,
                mostPlayedChampions: championStats.slice(0, 10) // Top 10 champions
            };
        }
        catch (error) {
            loggerService_1.logger.error('Error generating comprehensive stats:', error);
            throw error;
        }
    }
    async fetchMatchesInBatches(matchIds, puuid) {
        const matches = [];
        const batchSize = 10; // Process 10 matches at a time
        for (let i = 0; i < matchIds.length; i += batchSize) {
            const batch = matchIds.slice(i, i + batchSize);
            try {
                const batchPromises = batch.map(matchId => this.riotApi.getMatchDetails(matchId));
                const batchMatches = await Promise.all(batchPromises);
                // Filter out matches where the player didn't participate
                const validMatches = batchMatches.filter(match => match.participants.some(p => p.puuid === puuid));
                matches.push(...validMatches);
                // Rate limiting between batches
                if (i + batchSize < matchIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                loggerService_1.logger.info(`📈 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(matchIds.length / batchSize)}`);
            }
            catch (error) {
                loggerService_1.logger.warn(`⚠️ Error processing batch starting at ${i}:`, error);
                continue;
            }
        }
        return matches;
    }
    calculateOverallStats(matches, puuid) {
        const queueStats = {
            420: { games: 0, wins: 0, totalKDA: 0, totalDuration: 0 }, // Ranked Solo
            440: { games: 0, wins: 0, totalKDA: 0, totalDuration: 0 }, // Ranked Flex
            400: { games: 0, wins: 0, totalKDA: 0, totalDuration: 0 }, // Normal Draft
            450: { games: 0, wins: 0, totalKDA: 0, totalDuration: 0 }, // ARAM
        };
        const last10Games = [];
        const uniqueChampions = new Set();
        let totalWins = 0;
        matches.forEach(match => {
            const player = match.participants.find(p => p.puuid === puuid);
            if (!player)
                return;
            uniqueChampions.add(player.championId);
            if (player.stats.win)
                totalWins++;
            // Queue-specific stats
            const queueId = match.queueId;
            if (queueStats[queueId]) {
                queueStats[queueId].games++;
                if (player.stats.win)
                    queueStats[queueId].wins++;
                queueStats[queueId].totalKDA += (player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths);
                queueStats[queueId].totalDuration += match.gameDuration;
            }
            // Last 10 games
            if (last10Games.length < 10) {
                last10Games.push({
                    matchId: match.matchId,
                    championId: player.championId,
                    championName: player.championName,
                    win: player.stats.win,
                    kda: (player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths),
                    gameDate: match.gameCreation,
                    gameDuration: match.gameDuration,
                    position: player.position
                });
            }
        });
        const totalGames = matches.length;
        const overallKDA = matches.reduce((sum, match) => {
            const player = match.participants.find(p => p.puuid === puuid);
            return sum + (player ? (player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths) : 0);
        }, 0) / totalGames;
        return {
            totalGames,
            totalWins,
            totalLosses: totalGames - totalWins,
            overallWinRate: totalWins / totalGames,
            overallKDA,
            rankedSoloStats: {
                games: queueStats[420].games,
                wins: queueStats[420].wins,
                winRate: queueStats[420].games > 0 ? queueStats[420].wins / queueStats[420].games : 0,
                avgKDA: queueStats[420].games > 0 ? queueStats[420].totalKDA / queueStats[420].games : 0,
                avgGameLength: queueStats[420].games > 0 ? queueStats[420].totalDuration / queueStats[420].games : 0
            },
            rankedFlexStats: {
                games: queueStats[440].games,
                wins: queueStats[440].wins,
                winRate: queueStats[440].games > 0 ? queueStats[440].wins / queueStats[440].games : 0,
                avgKDA: queueStats[440].games > 0 ? queueStats[440].totalKDA / queueStats[440].games : 0,
                avgGameLength: queueStats[440].games > 0 ? queueStats[440].totalDuration / queueStats[440].games : 0
            },
            normalStats: {
                games: queueStats[400].games,
                wins: queueStats[400].wins,
                winRate: queueStats[400].games > 0 ? queueStats[400].wins / queueStats[400].games : 0,
                avgKDA: queueStats[400].games > 0 ? queueStats[400].totalKDA / queueStats[400].games : 0,
                avgGameLength: queueStats[400].games > 0 ? queueStats[400].totalDuration / queueStats[400].games : 0
            },
            aramStats: {
                games: queueStats[450].games,
                wins: queueStats[450].wins,
                winRate: queueStats[450].games > 0 ? queueStats[450].wins / queueStats[450].games : 0,
                avgKDA: queueStats[450].games > 0 ? queueStats[450].totalKDA / queueStats[450].games : 0,
                avgGameLength: queueStats[450].games > 0 ? queueStats[450].totalDuration / queueStats[450].games : 0
            },
            uniqueChampions: uniqueChampions.size,
            last10Games,
            last30Days: [] // TODO: Implement 30-day trends
        };
    }
    calculateChampionStats(matches, puuid) {
        const championData = new Map();
        // Collect all games per champion
        matches.forEach(match => {
            const player = match.participants.find(p => p.puuid === puuid);
            if (!player)
                return;
            if (!championData.has(player.championId)) {
                championData.set(player.championId, {
                    championName: player.championName,
                    games: [],
                    positions: {}
                });
            }
            const champData = championData.get(player.championId);
            champData.games.push(player);
            // Track positions
            const position = player.position || 'UNKNOWN';
            champData.positions[position] = (champData.positions[position] || 0) + 1;
        });
        // Calculate stats for each champion
        const championStats = [];
        championData.forEach((data, championId) => {
            const games = data.games;
            const gamesPlayed = games.length;
            const wins = games.filter(g => g.stats.win).length;
            // Calculate averages
            const avgKills = games.reduce((sum, g) => sum + g.stats.kills, 0) / gamesPlayed;
            const avgDeaths = games.reduce((sum, g) => sum + g.stats.deaths, 0) / gamesPlayed;
            const avgAssists = games.reduce((sum, g) => sum + g.stats.assists, 0) / gamesPlayed;
            const avgCS = games.reduce((sum, g) => sum + g.stats.cs, 0) / gamesPlayed;
            const avgCSPerMin = games.reduce((sum, g) => sum + g.stats.csPerMinute, 0) / gamesPlayed;
            const avgGold = games.reduce((sum, g) => sum + g.stats.goldEarned, 0) / gamesPlayed;
            const avgDamageDealt = games.reduce((sum, g) => sum + g.stats.totalDamageDealt, 0) / gamesPlayed;
            const avgDamageTaken = games.reduce((sum, g) => sum + g.stats.totalDamageTaken, 0) / gamesPlayed;
            const avgVisionScore = games.reduce((sum, g) => sum + g.stats.visionScore, 0) / gamesPlayed;
            // Find most played position
            const mostPlayedPosition = Object.entries(data.positions)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'UNKNOWN';
            // Recent performance (last 10 games)
            const recentGames = games.slice(-10);
            const recentWins = recentGames.filter(g => g.stats.win).length;
            const recentKDA = recentGames.reduce((sum, g) => sum + (g.stats.kills + g.stats.assists) / Math.max(1, g.stats.deaths), 0) / recentGames.length;
            championStats.push({
                championId,
                championName: data.championName,
                gamesPlayed,
                wins,
                losses: gamesPlayed - wins,
                winRate: wins / gamesPlayed,
                avgKills,
                avgDeaths,
                avgAssists,
                avgKDA: (avgKills + avgAssists) / Math.max(1, avgDeaths),
                avgCS,
                avgCSPerMin,
                avgGold,
                avgGoldPerMin: avgGold / 30, // Approximate game length
                avgDamageDealt,
                avgDamageTaken,
                avgDamagePerMin: avgDamageDealt / 30,
                damageShare: 0.25, // TODO: Calculate actual team damage share
                avgVisionScore,
                avgWardsPlaced: avgVisionScore * 0.6, // Approximation
                avgWardsKilled: avgVisionScore * 0.2, // Approximation
                firstBloodRate: 0, // TODO: Calculate from match timeline
                pentaKills: 0, // TODO: Extract from match data
                quadraKills: 0,
                tripleKills: 0,
                doubleKills: 0,
                recentWinRate: recentWins / recentGames.length,
                recentKDA,
                matchups: [], // TODO: Calculate matchup data
                positions: data.positions,
                mostPlayedPosition
            });
        });
        // Sort by games played (most played first)
        return championStats.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    }
}
exports.ChampionStatsService = ChampionStatsService;
