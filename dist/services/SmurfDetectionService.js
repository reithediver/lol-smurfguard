"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmurfDetectionService = void 0;
const loggerService_1 = __importDefault(require("../utils/loggerService"));
const errorHandler_1 = require("../utils/errorHandler");
// Champion ID to name mapping (subset for common champions)
const CHAMPION_NAMES = {
    1: 'Annie', 2: 'Olaf', 3: 'Galio', 4: 'Twisted Fate', 5: 'Xin Zhao',
    6: 'Urgot', 7: 'LeBlanc', 8: 'Vladimir', 9: 'Fiddlesticks', 10: 'Kayle',
    11: 'Master Yi', 12: 'Alistar', 13: 'Ryze', 14: 'Sion', 15: 'Sivir',
    16: 'Soraka', 17: 'Teemo', 18: 'Tristana', 19: 'Warwick', 20: 'Nunu',
    21: 'Miss Fortune', 22: 'Ashe', 23: 'Tryndamere', 24: 'Jax', 25: 'Morgana',
    26: 'Zilean', 27: 'Singed', 28: 'Evelynn', 29: 'Twitch', 30: 'Karthus',
    31: 'Cho\'Gath', 32: 'Amumu', 33: 'Rammus', 34: 'Anivia', 35: 'Shaco',
    36: 'Dr. Mundo', 37: 'Sona', 38: 'Kassadin', 39: 'Irelia', 40: 'Janna',
    41: 'Gangplank', 42: 'Corki', 43: 'Karma', 44: 'Taric', 45: 'Veigar',
    48: 'Trundle', 50: 'Swain', 51: 'Caitlyn', 53: 'Blitzcrank', 54: 'Malphite',
    55: 'Katarina', 56: 'Nocturne', 57: 'Maokai', 58: 'Renekton', 59: 'Jarvan IV',
    60: 'Elise', 61: 'Orianna', 62: 'Wukong', 63: 'Brand', 64: 'Lee Sin',
    67: 'Vayne', 68: 'Rumble', 69: 'Cassiopeia', 72: 'Skarner', 74: 'Heimerdinger',
    75: 'Nasus', 76: 'Nidalee', 77: 'Udyr', 78: 'Poppy', 79: 'Gragas',
    80: 'Pantheon', 81: 'Ezreal', 82: 'Mordekaiser', 83: 'Yorick', 84: 'Akali',
    85: 'Kennen', 86: 'Garen', 89: 'Leona', 90: 'Malzahar', 91: 'Talon',
    92: 'Riven', 96: 'Kog\'Maw', 98: 'Shen', 99: 'Lux', 101: 'Xerath',
    102: 'Shyvana', 103: 'Ahri', 104: 'Graves', 105: 'Fizz', 106: 'Volibear',
    107: 'Rengar', 110: 'Varus', 111: 'Nautilus', 112: 'Viktor', 113: 'Sejuani',
    114: 'Fiora', 115: 'Ziggs', 117: 'Lulu', 119: 'Draven', 120: 'Hecarim',
    121: 'Kha\'Zix', 122: 'Darius', 123: 'Jayce', 126: 'Jayce', 127: 'Lissandra',
    131: 'Diana', 133: 'Quinn', 134: 'Syndra', 136: 'Aurelion Sol', 141: 'Kayn',
    142: 'Azir', 143: 'Zyra', 145: 'Kai\'Sa', 147: 'Seraphine', 150: 'Gnar',
    154: 'Zac', 157: 'Yasuo', 161: 'Vel\'Koz', 163: 'Taliyah', 164: 'Camille',
    166: 'Akshan', 200: 'Bel\'Veth', 201: 'Braum', 202: 'Jhin', 203: 'Kindred',
    221: 'Zeri', 222: 'Jinx', 223: 'Tahm Kench', 234: 'Viego', 235: 'Senna',
    236: 'Lucian', 238: 'Zed', 240: 'Kled', 245: 'Ekko', 246: 'Qiyana',
    254: 'Vi', 266: 'Aatrox', 267: 'Nami', 268: 'Azir', 350: 'Yuumi',
    360: 'Samira', 412: 'Thresh', 420: 'Illaoi', 421: 'Rek\'Sai', 427: 'Ivern',
    429: 'Kalista', 432: 'Bard', 516: 'Ornn', 517: 'Sylas', 518: 'Neeko',
    555: 'Pyke', 777: 'Yone', 875: 'Sett', 876: 'Lillia', 887: 'Gwen',
    888: 'Renata Glasc', 895: 'Nilah', 897: 'K\'Sante', 901: 'Smolder'
};
// Helper function to get champion name
function getChampionName(championId) {
    return CHAMPION_NAMES[championId] || `Champion ${championId}`;
}
class SmurfDetectionService {
    constructor(riotApi) {
        this.riotApi = riotApi;
        this.SUSPICIOUS_WIN_RATE = 0.7;
        this.SUSPICIOUS_KDA = 3.0;
        this.SUSPICIOUS_CS_PER_MIN = 8.0;
        this.SUSPICIOUS_GAP_HOURS = 24 * 7; // 1 week
    }
    async analyzePlayer(summonerName) {
        try {
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
                    playtimeGaps: await this.analyzePlaytimeGaps(matchDetails),
                    championPerformance: await this.analyzeChampionPerformance(matchDetails, summoner.puuid),
                    summonerSpellUsage: await this.analyzeSummonerSpells(matchDetails, summoner.puuid),
                    playerAssociations: await this.analyzePlayerAssociations(matchDetails, summoner.puuid)
                },
                lastUpdated: new Date()
            };
            analysis.smurfProbability = this.calculateSmurfProbability(analysis.analysisFactors);
            return analysis;
        }
        catch (error) {
            loggerService_1.default.error('Error analyzing player:', error);
            // Handle specific Riot API errors
            if (error.response?.status === 403) {
                throw (0, errorHandler_1.createError)(403, `API access forbidden for "${summonerName}". The Development API key cannot access famous players. Try a different summoner name.`);
            }
            else if (error.response?.status === 404) {
                throw (0, errorHandler_1.createError)(404, `Player "${summonerName}" not found. Please check the spelling and region.`);
            }
            else if (error.response?.status === 429) {
                throw (0, errorHandler_1.createError)(429, 'Rate limit exceeded. Please wait a moment and try again.');
            }
            else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                throw (0, errorHandler_1.createError)(503, 'Unable to connect to Riot API. Please try again later.');
            }
            else {
                // For other errors, preserve the original message if available
                const errorMessage = error.message || 'Failed to analyze player';
                const statusCode = error.response?.status || error.statusCode || 500;
                throw (0, errorHandler_1.createError)(statusCode, errorMessage);
            }
        }
    }
    // New method for analyzing by PUUID (modern Riot ID workflow)
    async analyzeSmurf(puuid, region = 'na1') {
        try {
            loggerService_1.default.info(`🚀 Starting smurf analysis for PUUID: ${puuid} in region: ${region}`);
            // Get summoner data using PUUID
            loggerService_1.default.info('📡 Fetching summoner data by PUUID...');
            const summoner = await this.riotApi.getSummonerByPuuid(puuid);
            loggerService_1.default.info(`✅ Summoner data retrieved: ${summoner.name} (Level ${summoner.summonerLevel})`);
            // Get match history
            loggerService_1.default.info('📡 Fetching match history...');
            const matchHistory = await this.riotApi.getMatchHistory(puuid);
            loggerService_1.default.info(`✅ Match history retrieved: ${matchHistory.length} matches`);
            const matchDetails = await Promise.all(matchHistory.slice(0, 10).map(matchId => {
                loggerService_1.default.info(`📡 Fetching match details for: ${matchId}`);
                return this.riotApi.getMatchDetails(matchId);
            }));
            loggerService_1.default.info(`✅ Match details retrieved: ${matchDetails.length} detailed matches`);
            // Get additional data
            loggerService_1.default.info('📡 Fetching league entries...');
            const leagueEntries = await this.riotApi.getLeagueEntries(puuid);
            loggerService_1.default.info(`✅ League entries retrieved: ${JSON.stringify(leagueEntries)}`);
            loggerService_1.default.info('📡 Fetching champion mastery...');
            const championMastery = await this.riotApi.getChampionMastery(puuid);
            loggerService_1.default.info(`✅ Champion mastery retrieved: ${championMastery.length} champions`);
            loggerService_1.default.info('🔍 Starting detailed analysis...');
            // Analyze playtime gaps
            loggerService_1.default.info('📊 Analyzing playtime gaps...');
            const playtimeGaps = await this.analyzePlaytimeGaps(matchDetails);
            loggerService_1.default.info(`✅ Playtime gaps analysis: ${playtimeGaps.suspiciousGaps.length} gaps found, score: ${playtimeGaps.totalGapScore}`);
            // Analyze champion performance
            loggerService_1.default.info('📊 Analyzing champion performance...');
            const championPerformance = await this.analyzeChampionPerformance(matchDetails, puuid);
            loggerService_1.default.info(`✅ Champion performance analysis: ${championPerformance.firstTimeChampions.length} champions, score: ${championPerformance.overallPerformanceScore}`);
            // Analyze summoner spells
            loggerService_1.default.info('📊 Analyzing summoner spell usage...');
            const summonerSpellUsage = await this.analyzeSummonerSpells(matchDetails, puuid);
            loggerService_1.default.info(`✅ Summoner spell analysis: ${summonerSpellUsage.spellPlacementChanges.length} changes, score: ${summonerSpellUsage.patternChangeScore}`);
            // Analyze player associations
            loggerService_1.default.info('📊 Analyzing player associations...');
            const playerAssociations = await this.analyzePlayerAssociations(matchDetails, puuid);
            loggerService_1.default.info(`✅ Player associations analysis: ${playerAssociations.highEloAssociations.length} associations, score: ${playerAssociations.associationScore}`);
            const analysis = {
                summonerId: summoner.id,
                accountId: summoner.accountId || 'N/A',
                puuid: puuid,
                name: summoner.name,
                level: summoner.summonerLevel,
                smurfProbability: 0,
                analysisFactors: {
                    playtimeGaps: playtimeGaps,
                    championPerformance: championPerformance,
                    summonerSpellUsage: summonerSpellUsage,
                    playerAssociations: playerAssociations
                },
                lastUpdated: new Date(),
                // Additional modern data
                leagueData: leagueEntries,
                championMasteryData: championMastery.slice(0, 5), // Top 5 masteries
                region: region
            };
            analysis.smurfProbability = this.calculateSmurfProbability(analysis.analysisFactors);
            loggerService_1.default.info(`🎯 Final analysis complete - Smurf probability: ${analysis.smurfProbability}%`);
            loggerService_1.default.info(`📋 Final analysis factors:`, JSON.stringify(analysis.analysisFactors, null, 2));
            return analysis;
        }
        catch (error) {
            loggerService_1.default.error('Error analyzing smurf by PUUID:', error);
            // Handle specific Riot API errors
            if (error.response?.status === 403) {
                throw (0, errorHandler_1.createError)(403, `API access forbidden for PUUID. The API key may have restrictions.`);
            }
            else if (error.response?.status === 404) {
                throw (0, errorHandler_1.createError)(404, `Player data not found for the given PUUID. The account may not exist.`);
            }
            else if (error.response?.status === 429) {
                throw (0, errorHandler_1.createError)(429, 'Rate limit exceeded. Please wait a moment and try again.');
            }
            else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                throw (0, errorHandler_1.createError)(503, 'Unable to connect to Riot API. Please try again later.');
            }
            else {
                // For other errors, preserve the original message if available
                const errorMessage = error.message || 'Failed to analyze player by PUUID';
                const statusCode = error.response?.status || error.statusCode || 500;
                throw (0, errorHandler_1.createError)(statusCode, errorMessage);
            }
        }
    }
    async analyzePlaytimeGaps(matches) {
        const sortedMatches = matches.sort((a, b) => new Date(a.gameCreation).getTime() - new Date(b.gameCreation).getTime());
        const gaps = [];
        for (let i = 1; i < sortedMatches.length; i++) {
            const gap = new Date(sortedMatches[i].gameCreation).getTime() -
                new Date(sortedMatches[i - 1].gameCreation).getTime();
            const gapHours = gap / (1000 * 60 * 60);
            if (gapHours > this.SUSPICIOUS_GAP_HOURS) {
                gaps.push({
                    startDate: new Date(sortedMatches[i - 1].gameCreation),
                    endDate: new Date(sortedMatches[i].gameCreation),
                    durationHours: gapHours,
                    suspicionLevel: this.calculateGapSuspicionLevel(gapHours)
                });
            }
        }
        return {
            averageGapHours: gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap.durationHours, 0) / gaps.length : 0,
            suspiciousGaps: gaps,
            totalGapScore: gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap.suspicionLevel, 0) : 0
        };
    }
    async analyzeChampionPerformance(matches, targetPuuid) {
        const championStats = new Map();
        matches.forEach(match => {
            // Add null checks for match data structure
            if (!match || !match.participants || !Array.isArray(match.participants)) {
                loggerService_1.default.warn('Invalid match data structure:', match);
                return;
            }
            const player = match.participants.find(p => p.puuid === targetPuuid);
            if (!player)
                return;
            const stats = championStats.get(player.championId) || {
                games: 0,
                wins: 0,
                totalKda: 0,
                totalCsPerMin: 0
            };
            stats.games++;
            if (player.stats.win)
                stats.wins++;
            stats.totalKda += (player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths);
            stats.totalCsPerMin += player.stats.csPerMinute;
            championStats.set(player.championId, stats);
        });
        const firstTimeChampions = Array.from(championStats.entries())
            .filter(([_, stats]) => stats.games === 1)
            .map(([championId, stats]) => ({
            championId,
            championName: getChampionName(championId),
            winRate: stats.wins / stats.games,
            kda: stats.totalKda,
            csPerMinute: stats.totalCsPerMin,
            suspicionLevel: this.calculateChampionSuspicionLevel(stats)
        }));
        return {
            firstTimeChampions,
            overallPerformanceScore: this.calculateOverallPerformanceScore(firstTimeChampions)
        };
    }
    calculateGapSuspicionLevel(gapHours) {
        return Math.min(1, gapHours / (this.SUSPICIOUS_GAP_HOURS * 2));
    }
    calculateChampionSuspicionLevel(stats) {
        const winRate = stats.wins / stats.games;
        const kda = stats.totalKda;
        const csPerMin = stats.totalCsPerMin;
        let suspicionLevel = 0;
        if (winRate >= this.SUSPICIOUS_WIN_RATE)
            suspicionLevel += 0.4;
        if (kda >= this.SUSPICIOUS_KDA)
            suspicionLevel += 0.3;
        if (csPerMin >= this.SUSPICIOUS_CS_PER_MIN)
            suspicionLevel += 0.3;
        return suspicionLevel;
    }
    calculateOverallPerformanceScore(champions) {
        if (champions.length === 0)
            return 0;
        return champions.reduce((sum, champ) => sum + champ.suspicionLevel, 0) / champions.length;
    }
    calculateSmurfProbability(factors) {
        // Champion performance (75% weight - increased as main indicator)
        const championScore = factors.championPerformance.overallPerformanceScore * 0.75;
        // Summoner spell usage (5% weight - reduced as it's rare but indicative)
        const spellScore = factors.summonerSpellUsage.patternChangeScore * 0.05;
        // Playtime gaps (15% weight - increased slightly)
        const gapScore = factors.playtimeGaps.totalGapScore * 0.15;
        // Player associations (5% weight - kept same)
        const associationScore = factors.playerAssociations.associationScore * 0.05;
        // Calculate total probability
        const totalProbability = championScore + spellScore + gapScore + associationScore;
        // Apply a multiplier to ensure we reach our desired thresholds
        const multiplier = 1.2; // 20% boost to reach thresholds
        const adjustedProbability = totalProbability * multiplier;
        // Ensure probability is between 0 and 1
        return Math.min(Math.max(adjustedProbability, 0), 1);
    }
    async analyzeSummonerSpells(matches, targetPuuid) {
        if (matches.length < 3) { // Need at least 3 games to establish a pattern
            return {
                spellPlacementChanges: [],
                patternChangeScore: 0
            };
        }
        const sortedMatches = matches.sort((a, b) => new Date(a.gameCreation).getTime() - new Date(b.gameCreation).getTime());
        const spellChanges = [];
        let keyPositionSwaps = 0;
        // Track Flash (spell ID 4) position consistency
        let establishedFlashPosition = null;
        let positionEstablishmentGames = 0;
        for (let i = 0; i < sortedMatches.length; i++) {
            const currentMatch = sortedMatches[i];
            // Add null checks for match data structure
            if (!currentMatch || !currentMatch.participants || !Array.isArray(currentMatch.participants)) {
                loggerService_1.default.warn('Invalid match data structure in summoner spell analysis:', currentMatch);
                continue;
            }
            const currentPlayer = currentMatch.participants.find(p => p.puuid === targetPuuid);
            if (!currentPlayer)
                continue;
            const { spell1Id, spell2Id } = currentPlayer.summonerSpells;
            // Check if Flash is being used and where it's positioned
            if (spell1Id === 4) { // Flash on D key (spell1)
                if (establishedFlashPosition === null) {
                    if (positionEstablishmentGames >= 2) {
                        establishedFlashPosition = 'spell1';
                    }
                    else {
                        positionEstablishmentGames++;
                    }
                }
                else if (establishedFlashPosition === 'spell2') {
                    // Flash moved from F to D - KEY POSITION SWAP DETECTED
                    spellChanges.push({
                        date: new Date(currentMatch.gameCreation),
                        oldPlacement: 'Flash on F key',
                        newPlacement: 'Flash on D key',
                        swapType: 'Flash position swap'
                    });
                    keyPositionSwaps++;
                }
            }
            else if (spell2Id === 4) { // Flash on F key (spell2)
                if (establishedFlashPosition === null) {
                    if (positionEstablishmentGames >= 2) {
                        establishedFlashPosition = 'spell2';
                    }
                    else {
                        positionEstablishmentGames++;
                    }
                }
                else if (establishedFlashPosition === 'spell1') {
                    // Flash moved from D to F - KEY POSITION SWAP DETECTED
                    spellChanges.push({
                        date: new Date(currentMatch.gameCreation),
                        oldPlacement: 'Flash on D key',
                        newPlacement: 'Flash on F key',
                        swapType: 'Flash position swap'
                    });
                    keyPositionSwaps++;
                }
            }
        }
        // Calculate suspicion score based on key position swaps
        // Even one swap is highly suspicious since players are very consistent with keybinds
        let patternChangeScore = 0;
        if (keyPositionSwaps >= 1) {
            // High suspicion for any key position swaps
            patternChangeScore = Math.min(keyPositionSwaps * 0.8, 1.0);
        }
        return {
            spellPlacementChanges: spellChanges,
            patternChangeScore: patternChangeScore
        };
    }
    async analyzePlayerAssociations(matches, targetPuuid) {
        const highEloAssociations = [];
        const playerEncounters = new Map();
        for (const match of matches) {
            // Add null checks for match data structure
            if (!match || !match.participants || !Array.isArray(match.participants)) {
                loggerService_1.default.warn('Invalid match data structure in player associations analysis:', match);
                continue;
            }
            const targetPlayer = match.participants.find(p => p.puuid === targetPuuid);
            if (!targetPlayer)
                continue;
            // Filter to players on the same team
            const teammates = match.participants.filter(p => p.teamId === targetPlayer.teamId && p.puuid !== targetPuuid);
            for (const teammate of teammates) {
                // We would normally fetch the teammate's rank/elo from the API
                // For now, we'll estimate based on their performance
                const estimatedElo = this.estimatePlayerElo(teammate);
                // Only track players with above-average estimated skill
                if (estimatedElo !== 'HIGH')
                    continue;
                const existingRecord = playerEncounters.get(teammate.puuid);
                if (existingRecord) {
                    existingRecord.gamesPlayedTogether += 1;
                    playerEncounters.set(teammate.puuid, existingRecord);
                }
                else {
                    playerEncounters.set(teammate.puuid, {
                        playerName: teammate.summonerName,
                        elo: estimatedElo,
                        gamesPlayedTogether: 1
                    });
                }
            }
        }
        // Only consider repeated high-elo teammates
        for (const [playerId, data] of playerEncounters.entries()) {
            if (data.gamesPlayedTogether > 1) {
                highEloAssociations.push({
                    playerId,
                    playerName: data.playerName,
                    elo: data.elo,
                    gamesPlayedTogether: data.gamesPlayedTogether
                });
            }
        }
        // Calculate association score based on number of high-elo associations
        // and frequency of play together
        const totalGames = matches.length;
        let totalAssociationWeight = 0;
        for (const association of highEloAssociations) {
            const frequency = association.gamesPlayedTogether / totalGames;
            totalAssociationWeight += frequency;
        }
        // Cap the score at 1.0
        const associationScore = Math.min(totalAssociationWeight, 1);
        return {
            highEloAssociations,
            associationScore
        };
    }
    // Helper method to estimate player skill level
    estimatePlayerElo(player) {
        const { kills, deaths, assists } = player.stats;
        const kda = (kills + assists) / Math.max(deaths, 1);
        const csPerMin = player.stats.csPerMinute;
        // Simple heuristic - could be improved with more detailed analysis
        if (kda >= 4.0 && csPerMin >= 8.0) {
            return 'HIGH';
        }
        else if (kda >= 3.0 && csPerMin >= 6.5) {
            return 'MEDIUM';
        }
        else {
            return 'LOW';
        }
    }
}
exports.SmurfDetectionService = SmurfDetectionService;
