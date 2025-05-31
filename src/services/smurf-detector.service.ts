import { RiotApi } from '../api/RiotApi';
import { PlayerAnalysis, PlaytimeGapAnalysis, ChampionPerformanceAnalysis } from '../models/PlayerAnalysis';
import { MatchHistory } from '../models/MatchHistory';
import { ChampionStats } from '../models/ChampionStats';
import { logger } from '../utils/loggerService';
import { createError } from '../utils/errorHandler';

export class SmurfDetectionService {
    private readonly SUSPICIOUS_WIN_RATE = 0.7;
    private readonly SUSPICIOUS_KDA = 3.0;
    private readonly SUSPICIOUS_CS_PER_MIN = 8.0;
    private readonly SUSPICIOUS_GAP_HOURS = 24 * 7; // 1 week

    constructor(private riotApi: RiotApi) {}

    async analyzePlayer(summonerName: string): Promise<PlayerAnalysis> {
        try {
            const summoner = await this.riotApi.getSummonerByName(summonerName);
            const matchHistory = await this.riotApi.getMatchHistory(summoner.puuid);
            const matchDetails = await Promise.all(
                matchHistory.map(matchId => this.riotApi.getMatchDetails(matchId))
            );

            const analysis: PlayerAnalysis = {
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
        } catch (error) {
            logger.error('Error analyzing player:', error);
            throw createError(500, 'Failed to analyze player');
        }
    }

    private async analyzePlaytimeGaps(matches: MatchHistory[]): Promise<PlaytimeGapAnalysis> {
        const sortedMatches = matches.sort((a, b) => 
            new Date(a.gameCreation).getTime() - new Date(b.gameCreation).getTime()
        );

        const gaps = [];
        for (let i = 1; i < sortedMatches.length; i++) {
            const gap = new Date(sortedMatches[i].gameCreation).getTime() - 
                       new Date(sortedMatches[i-1].gameCreation).getTime();
            const gapHours = gap / (1000 * 60 * 60);
            
            if (gapHours > this.SUSPICIOUS_GAP_HOURS) {
                gaps.push({
                    startDate: new Date(sortedMatches[i-1].gameCreation),
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

    private async analyzeChampionPerformance(matches: MatchHistory[]): Promise<ChampionPerformanceAnalysis> {
        const championStats = new Map<number, {
            games: number;
            wins: number;
            totalKda: number;
            totalCsPerMin: number;
        }>();

        matches.forEach(match => {
            const player = match.participants.find(p => p.puuid === match.participants[0].puuid);
            if (!player) return;

            const stats = championStats.get(player.championId) || {
                games: 0,
                wins: 0,
                totalKda: 0,
                totalCsPerMin: 0
            };

            stats.games++;
            if (player.stats.win) stats.wins++;
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

    private calculateGapSuspicionLevel(gapHours: number): number {
        return Math.min(1, gapHours / (this.SUSPICIOUS_GAP_HOURS * 2));
    }

    private calculateChampionSuspicionLevel(stats: {
        games: number;
        wins: number;
        totalKda: number;
        totalCsPerMin: number;
    }): number {
        const winRate = stats.wins / stats.games;
        const kda = stats.totalKda;
        const csPerMin = stats.totalCsPerMin;

        let suspicionLevel = 0;
        if (winRate >= this.SUSPICIOUS_WIN_RATE) suspicionLevel += 0.4;
        if (kda >= this.SUSPICIOUS_KDA) suspicionLevel += 0.3;
        if (csPerMin >= this.SUSPICIOUS_CS_PER_MIN) suspicionLevel += 0.3;

        return suspicionLevel;
    }

    private calculateOverallPerformanceScore(champions: Array<{
        winRate: number;
        kda: number;
        csPerMinute: number;
        suspicionLevel: number;
    }>): number {
        if (champions.length === 0) return 0;
        return champions.reduce((sum, champ) => sum + champ.suspicionLevel, 0) / champions.length;
    }

    private calculateSmurfProbability(factors: PlayerAnalysis['analysisFactors']): number {
        const weights = {
            playtimeGaps: 0.3,
            championPerformance: 0.4,
            summonerSpellUsage: 0.2,
            playerAssociations: 0.1
        };

        return (
            factors.playtimeGaps.totalGapScore * weights.playtimeGaps +
            factors.championPerformance.overallPerformanceScore * weights.championPerformance +
            factors.summonerSpellUsage.patternChangeScore * weights.summonerSpellUsage +
            factors.playerAssociations.associationScore * weights.playerAssociations
        );
    }

    // TODO: Implement these methods
    private async analyzeSummonerSpells(matches: MatchHistory[]) {
        return {
            spellPlacementChanges: [],
            patternChangeScore: 0
        };
    }

    private async analyzePlayerAssociations(matches: MatchHistory[]) {
        return {
            highEloAssociations: [],
            associationScore: 0
        };
    }
} 