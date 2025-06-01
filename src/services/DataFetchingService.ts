import { RiotApi } from '../api/RiotApi';
import { PlayerAnalysis } from '../models/PlayerAnalysis';
import { logger } from '../utils/loggerService';
import { createError } from '../utils/errorHandler';

interface CacheEntry {
  data: PlayerAnalysis;
  timestamp: number;
}

export class DataFetchingService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached entries

  constructor(private riotApi: RiotApi) {}

  async fetchPlayerAnalysis(summonerName: string): Promise<PlayerAnalysis> {
    try {
      // Check cache first
      const cachedData = this.getFromCache(summonerName);
      if (cachedData) {
        logger.info(`Cache hit for player: ${summonerName}`);
        return cachedData;
      }

      logger.info(`Fetching fresh data for player: ${summonerName}`);
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
    } catch (error) {
      logger.error('Error fetching player analysis:', error);
      throw createError(500, 'Failed to fetch player analysis');
    }
  }

  private getFromCache(summonerName: string): PlayerAnalysis | null {
    const entry = this.cache.get(summonerName);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(summonerName);
      return null;
    }

    return entry.data;
  }

  private addToCache(summonerName: string, data: PlayerAnalysis): void {
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

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats(): { size: number; oldestEntry: number; newestEntry: number } {
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