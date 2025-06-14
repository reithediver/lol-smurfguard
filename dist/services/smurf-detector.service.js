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
                    championPerformance: await this.analyzeChampionPerformance(matchDetails),
                    summonerSpellUsage: await this.analyzeSummonerSpells(matchDetails),
                    playerAssociations: await this.analyzePlayerAssociations(matchDetails)
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
            averageGapHours: gaps.reduce((sum, gap) => sum + gap.durationHours, 0) / gaps.length,
            suspiciousGaps: gaps,
            totalGapScore: gaps.reduce((sum, gap) => sum + gap.suspicionLevel, 0)
        };
    }
    async analyzeChampionPerformance(matches) {
        const championStats = new Map();
        matches.forEach(match => {
            const player = match.participants.find(p => p.puuid === match.participants[0].puuid);
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
        return (factors.playtimeGaps.totalGapScore * weights.playtimeGaps +
            factors.championPerformance.overallPerformanceScore * weights.championPerformance +
            factors.summonerSpellUsage.patternChangeScore * weights.summonerSpellUsage +
            factors.playerAssociations.associationScore * weights.playerAssociations);
    }
    // TODO: Implement these methods
    async analyzeSummonerSpells(matches) {
        return {
            spellPlacementChanges: [],
            patternChangeScore: 0
        };
    }
    async analyzePlayerAssociations(matches) {
        return {
            highEloAssociations: [],
            associationScore: 0
        };
    }
}
exports.SmurfDetectionService = SmurfDetectionService;
