import { RiotApi } from '../api/RiotApi';
import { PlayerAnalysis } from '../models/PlayerAnalysis';
import { EnhancedPlayerAnalysis } from '../models/EnhancedPlayerData';
import { OpggDataAdapter } from './OpggDataAdapter';
import { logger } from '../utils/loggerService';
import { createError } from '../utils/errorHandler';

interface CacheEntry {
  data: PlayerAnalysis;
  timestamp: number;
}

interface EnhancedCacheEntry {
  data: EnhancedPlayerAnalysis;
  timestamp: number;
}

export class DataFetchingService {
  private cache: Map<string, CacheEntry> = new Map();
  private enhancedCache: Map<string, EnhancedCacheEntry> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached entries
  private readonly USE_OPGG = process.env.USE_OPGG_DATA === 'true'; // Toggle for OP.GG integration

  // Enhanced OP.GG integration
  private opggAdapter: OpggDataAdapter;

  constructor(private riotApi: RiotApi) {
    this.opggAdapter = new OpggDataAdapter();
    logger.info(`DataFetchingService initialized with OP.GG integration: ${this.USE_OPGG}`);
  }

  /**
   * Enhanced method to fetch comprehensive player analysis using OP.GG data
   * Falls back to Riot API if OP.GG is unavailable
   */
  async fetchEnhancedPlayerAnalysis(summonerName: string, region: string = 'na1'): Promise<EnhancedPlayerAnalysis> {
    try {
      // Check enhanced cache first
      const cacheKey = `enhanced_${summonerName}_${region}`;
      const cachedData = this.getFromEnhancedCache(cacheKey);
      if (cachedData) {
        logger.info(`Enhanced cache hit for player: ${summonerName}`);
        return cachedData;
      }

      let enhancedAnalysis: EnhancedPlayerAnalysis;

      if (this.USE_OPGG) {
        try {
          logger.info(`Fetching enhanced data via OP.GG for player: ${summonerName}`);
          enhancedAnalysis = await this.opggAdapter.getEnhancedPlayerAnalysis(summonerName, region);
          logger.info(`Successfully fetched OP.GG data for ${summonerName}`);
        } catch (opggError) {
          logger.warn(`OP.GG fetch failed for ${summonerName}, falling back to Riot API:`, opggError);
          enhancedAnalysis = await this.fallbackToRiotApi(summonerName, region);
        }
      } else {
        logger.info(`Using Riot API fallback for player: ${summonerName}`);
        enhancedAnalysis = await this.fallbackToRiotApi(summonerName, region);
      }

      // Store in enhanced cache
      this.addToEnhancedCache(cacheKey, enhancedAnalysis);

      return enhancedAnalysis;
    } catch (error) {
      logger.error('Error fetching enhanced player analysis:', error);
      throw createError(500, `Failed to fetch enhanced analysis for ${summonerName}`);
    }
  }

  /**
   * Original method maintained for backward compatibility
   */
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

  /**
   * Fallback method to create EnhancedPlayerAnalysis from Riot API data
   * Used when OP.GG is unavailable or disabled
   */
  private async fallbackToRiotApi(summonerName: string, region: string): Promise<EnhancedPlayerAnalysis> {
    try {
      // Get basic player analysis first
      const basicAnalysis = await this.fetchPlayerAnalysis(summonerName);
      
      // Create a minimal enhanced analysis structure using available Riot API data
      const enhancedAnalysis: EnhancedPlayerAnalysis = {
        summoner: {
          name: basicAnalysis.name,
          level: basicAnalysis.level,
          profileIconId: 0, // Not available in basic analysis
          region: region
        },
        currentRank: {
          currentRank: {
            tier: 'UNRANKED',
            division: '',
            lp: 0
          },
          rankHistory: [],
          climbAnalysis: {
            winStreak: 0,
            currentWinRate: 0,
            climbSpeed: 0,
            skipDivisions: false,
            newAccountRapidClimb: false,
            mmrDiscrepancy: false
          }
        },
        historicalTimeline: {
          seasonData: [],
          activityAnalysis: {
            totalDaysActive: 0,
            averageGamesPerDay: 0,
            playTimeDistribution: {
              hourOfDay: {},
              dayOfWeek: {},
              monthOfYear: {}
            },
            inactivityGaps: []
          }
        },
        recentGames: [],
        championMastery: [],
        behavioralPatterns: {
          communicationPatterns: {
            chatFrequency: 0,
            gameKnowledgeTerminology: false,
            strategicCallouts: false,
            flamePatterns: false,
            coachingBehavior: false
          },
          gameplayPatterns: {
            riskTaking: 0,
            adaptability: 0,
            teamFightPositioning: 0,
            objectivePrioritization: 0,
            mapAwareness: 0
          },
          duoAnalysis: {
            duoPartners: [],
            soloVsDuoPerformance: {
              soloWinRate: 0,
              duoWinRate: 0,
              performanceDifference: 0
            }
          }
        },
        smurfDetection: {
          overallProbability: basicAnalysis.smurfProbability,
          confidenceLevel: 50, // Medium confidence for Riot API data
          categoryBreakdown: {
            performanceMetrics: {
              score: 0,
              weight: 0.35,
              indicators: {
                unusuallyHighKDA: false,
                perfectCSEfficiency: false,
                expertDamageDealing: false,
                advancedVisionControl: false,
                objectiveControl: false
              }
            },
            historicalAnalysis: {
              score: 0,
              weight: 0.25,
              indicators: {
                newAccountHighPerformance: false,
                rapidRankProgression: false,
                mmrDiscrepancy: false,
                skipDivisions: false
              }
            },
            championMastery: {
              score: 0,
              weight: 0.20,
              indicators: {
                immediateChampionExpertise: false,
                perfectBuildPaths: false,
                advancedMechanics: false,
                unusualChampionPool: false
              }
            },
            gapAnalysis: {
              score: basicAnalysis.analysisFactors.playtimeGaps.totalGapScore,
              weight: 0.15,
              indicators: {
                suspiciousGaps: basicAnalysis.analysisFactors.playtimeGaps.suspiciousGaps.length > 0,
                performanceJumpsAfterGaps: false,
                roleShiftsAfterGaps: false,
                championPoolChanges: false
              }
            },
            behavioralPatterns: {
              score: 0,
              weight: 0.05,
              indicators: {
                advancedGameKnowledge: false,
                strategicCommunication: false,
                unusualDuoPartners: false,
                coachingBehavior: false
              }
            }
          },
          evidenceLevel: 'weak' as const,
          keyFindings: ['Limited to Riot API data - using fallback analysis'],
          redFlags: [],
          comparisonToLegitPlayers: {
            percentileRanking: {},
            statisticalOutliers: []
          }
        },
        analysisMetadata: {
          dataQuality: {
            gamesAnalyzed: 0,
            timeSpanDays: 0,
            missingDataPoints: ['OP.GG data unavailable', 'Using Riot API fallback'],
            reliabilityScore: 60 // Lower reliability for fallback data
          },
          analysisTimestamp: new Date(),
          apiLimitations: ['Development API Key limitations', 'OP.GG data unavailable'],
          recommendedActions: ['Enable OP.GG integration for enhanced analysis', 'Obtain Personal API Key for complete data']
        }
      };

      logger.info(`Created fallback enhanced analysis for ${summonerName}`);
      return enhancedAnalysis;
    } catch (error) {
      logger.error(`Error creating fallback analysis for ${summonerName}:`, error);
      throw createError(500, 'Failed to create fallback analysis');
    }
  }

  /**
   * Refresh summoner data (OP.GG specific feature)
   */
  async refreshSummonerData(summonerName: string, region: string = 'na1'): Promise<void> {
    if (this.USE_OPGG) {
      try {
        await this.opggAdapter.refreshSummonerData(summonerName, region);
        
        // Clear local caches for this summoner
        const keysToDelete = Array.from(this.enhancedCache.keys()).filter(key => 
          key.includes(summonerName) && key.includes(region)
        );
        keysToDelete.forEach(key => this.enhancedCache.delete(key));
        
        logger.info(`Refreshed data and cleared cache for ${summonerName}`);
      } catch (error) {
        logger.error(`Error refreshing summoner data: ${error}`);
        throw createError(500, 'Failed to refresh summoner data');
      }
    } else {
      logger.warn('OP.GG refresh requested but OP.GG integration is disabled');
      throw createError(400, 'OP.GG integration is not enabled');
    }
  }

  // Original cache methods
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

  // Enhanced cache methods
  private getFromEnhancedCache(key: string): EnhancedPlayerAnalysis | null {
    const entry = this.enhancedCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_DURATION) {
      this.enhancedCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private addToEnhancedCache(key: string, data: EnhancedPlayerAnalysis): void {
    if (this.enhancedCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.enhancedCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.enhancedCache.delete(oldestKey);
    }

    this.enhancedCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
    this.enhancedCache.clear();
    if (this.USE_OPGG) {
      this.opggAdapter.clearCache();
    }
    logger.info('All caches cleared');
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats(): { 
    basic: { size: number; oldestEntry: number; newestEntry: number };
    enhanced: { size: number; oldestEntry: number; newestEntry: number };
    opgg?: { size: number; keys: string[] };
  } {
    const basicStats = this.getBasicCacheStats();
    const enhancedStats = this.getEnhancedCacheStats();
    
    const stats: any = {
      basic: basicStats,
      enhanced: enhancedStats
    };

    if (this.USE_OPGG) {
      stats.opgg = this.opggAdapter.getCacheStats();
    }

    return stats;
  }

  private getBasicCacheStats(): { size: number; oldestEntry: number; newestEntry: number } {
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

  private getEnhancedCacheStats(): { size: number; oldestEntry: number; newestEntry: number } {
    if (this.enhancedCache.size === 0) {
      return { size: 0, oldestEntry: 0, newestEntry: 0 };
    }

    const timestamps = Array.from(this.enhancedCache.values()).map(entry => entry.timestamp);
    return {
      size: this.enhancedCache.size,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }

  // Status and configuration methods
  getIntegrationStatus(): {
    opggEnabled: boolean;
    serviceName: string;
    features: string[];
    limitations: string[];
  } {
    return {
      opggEnabled: this.USE_OPGG,
      serviceName: this.USE_OPGG ? 'OP.GG MCP + Riot API Fallback' : 'Riot API Only',
      features: this.USE_OPGG 
        ? ['Enhanced Player Analysis', 'Real Summoner Data', 'Champion Analysis', 'Position Data', 'Data Refresh']
        : ['Basic Player Analysis', 'Limited Match Data'],
      limitations: this.USE_OPGG 
        ? ['Rate limiting via OP.GG', 'Cache dependent']
        : ['Development API Key restrictions', 'Mock data for demos']
    };
  }
} 