"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmurfDetectionService = void 0;
const loggerService_1 = require("../utils/loggerService");
const errorHandler_1 = require("../utils/errorHandler");
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
            loggerService_1.logger.error('Error analyzing player:', error);
            throw (0, errorHandler_1.createError)(500, 'Failed to analyze player');
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
            championName: '', // TODO: Get champion name from Data Dragon
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
        const weights = {
            playtimeGaps: 0.3,
            championPerformance: 0.4,
            summonerSpellUsage: 0.2,
            playerAssociations: 0.1
        };
        const rawProbability = factors.playtimeGaps.totalGapScore * weights.playtimeGaps +
            factors.championPerformance.overallPerformanceScore * weights.championPerformance +
            factors.summonerSpellUsage.patternChangeScore * weights.summonerSpellUsage +
            factors.playerAssociations.associationScore * weights.playerAssociations;
        // Clamp to [0, 1] range
        return Math.min(Math.max(rawProbability, 0), 1);
    }
    async analyzeSummonerSpells(matches, targetPuuid) {
        if (matches.length < 2) {
            return {
                spellPlacementChanges: [],
                patternChangeScore: 0
            };
        }
        const sortedMatches = matches.sort((a, b) => new Date(a.gameCreation).getTime() - new Date(b.gameCreation).getTime());
        const spellChanges = [];
        let patternChangeCount = 0;
        for (let i = 1; i < sortedMatches.length; i++) {
            const currentMatch = sortedMatches[i];
            const previousMatch = sortedMatches[i - 1];
            const currentPlayer = currentMatch.participants.find(p => p.puuid === targetPuuid);
            const previousPlayer = previousMatch.participants.find(p => p.puuid === targetPuuid);
            if (!currentPlayer || !previousPlayer)
                continue;
            // Check if spells are in the same order
            const currentSpellOrder = `${currentPlayer.summonerSpells.spell1Id}-${currentPlayer.summonerSpells.spell2Id}`;
            const previousSpellOrder = `${previousPlayer.summonerSpells.spell1Id}-${previousPlayer.summonerSpells.spell2Id}`;
            // Check if either spell changed
            if (currentSpellOrder !== previousSpellOrder) {
                spellChanges.push({
                    date: new Date(currentMatch.gameCreation),
                    oldPlacement: previousSpellOrder,
                    newPlacement: currentSpellOrder
                });
                patternChangeCount++;
            }
        }
        // Calculate a score based on the number of changes relative to total matches
        const maxChangesExpected = Math.ceil(matches.length / 3); // Assume changing every 3 games is normal
        const patternChangeScore = Math.min(patternChangeCount / maxChangesExpected, 1);
        return {
            spellPlacementChanges: spellChanges,
            patternChangeScore: patternChangeScore
        };
    }
    async analyzePlayerAssociations(matches, targetPuuid) {
        const highEloAssociations = [];
        const playerEncounters = new Map();
        for (const match of matches) {
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
