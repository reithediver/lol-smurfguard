import { Player } from '../models/player.model';
import { Match } from '../models/match.model';
import { ChampionStats } from '../models/champion.model';
import { logger } from '../utils/logger';

export class SmurfDetectorService {
  private readonly WIN_RATE_THRESHOLD = 0.7;
  private readonly KDA_THRESHOLD = 3.0;
  private readonly CS_PER_MIN_THRESHOLD = 8.0;
  private readonly SUSPICIOUS_GAP_DAYS = 30;

  calculateSmurfProbability(player: Player): number {
    try {
      const factors = [
        this.analyzePlaytimeGaps(player),
        this.analyzeChampionPerformance(player),
        this.analyzeSummonerSpells(player),
        this.analyzePlayerAssociations(player),
      ];

      // Weight each factor (can be adjusted based on importance)
      const weights = [0.3, 0.3, 0.2, 0.2];
      const probability = factors.reduce((sum, factor, index) => sum + factor * weights[index], 0);

      return Math.min(Math.max(probability, 0), 1); // Ensure result is between 0 and 1
    } catch (error) {
      logger.error('Error calculating smurf probability:', error);
      throw error;
    }
  }

  private analyzePlaytimeGaps(player: Player): number {
    const matches = player.matchHistory.sort((a, b) => b.gameCreation - a.gameCreation);
    if (matches.length < 2) return 0;

    const gaps = [];
    for (let i = 0; i < matches.length - 1; i++) {
      const gap = (matches[i].gameCreation - matches[i + 1].gameCreation) / (1000 * 60 * 60 * 24); // Convert to days
      gaps.push(gap);
    }

    if (gaps.length === 0) return 0;
    const suspiciousGaps = gaps.filter(gap => gap > this.SUSPICIOUS_GAP_DAYS);
    return Math.min(suspiciousGaps.length / gaps.length, 1);
  }

  private analyzeChampionPerformance(player: Player): number {
    if (!player.championStats || player.championStats.length === 0) return 0;
    // Suspicious if firstTimePerformance exists and is strong
    const suspiciousPerformances = player.championStats.filter(champion => {
      if (!champion.firstTimePerformance) return false;
      const performance = champion.firstTimePerformance;
      return (
        performance.kda >= this.KDA_THRESHOLD &&
        performance.csPerMinute >= this.CS_PER_MIN_THRESHOLD &&
        performance.win
      );
    });
    return Math.min(suspiciousPerformances.length / player.championStats.length, 1);
  }

  private analyzeSummonerSpells(player: Player): number {
    const matches = player.matchHistory;
    if (matches.length < 2) return 0;
    let patternChanges = 0;
    for (let i = 0; i < matches.length - 1; i++) {
      const playerInCurrent = this.findPlayerInMatch(matches[i], player.puuid);
      const playerInNext = this.findPlayerInMatch(matches[i + 1], player.puuid);
      if (!playerInCurrent || !playerInNext) continue;
      const currentPattern = `${playerInCurrent.spell1Id}-${playerInCurrent.spell2Id}`;
      const nextPattern = `${playerInNext.spell1Id}-${playerInNext.spell2Id}`;
      if (currentPattern !== nextPattern) {
        patternChanges++;
      }
    }
    if (matches.length <= 1) return 0;
    return Math.min(patternChanges / (matches.length - 1), 1);
  }

  private analyzePlayerAssociations(player: Player): number {
    const matches = player.matchHistory;
    if (matches.length === 0) return 0;

    let suspiciousAssociations = 0;
    const processedPlayers = new Set<string>();

    for (const match of matches) {
      for (const participant of match.participants) {
        if (participant.puuid === player.puuid || processedPlayers.has(participant.puuid)) continue;

        processedPlayers.add(participant.puuid);
        const stats = participant.stats;
        const kda = (stats.kills + stats.assists) / Math.max(stats.deaths, 1);
        const csPerMin = stats.totalMinionsKilled / (match.gameDuration / 60);

        if (kda >= this.KDA_THRESHOLD && csPerMin >= this.CS_PER_MIN_THRESHOLD) {
          suspiciousAssociations++;
        }
      }
    }
    if (processedPlayers.size === 0) return 0;
    return Math.min(suspiciousAssociations / processedPlayers.size, 1);
  }

  private findPlayerInMatch(match: Match, puuid: string) {
    return match.participants.find(p => p.puuid === puuid);
  }
}

export const smurfDetectorService = new SmurfDetectorService(); 