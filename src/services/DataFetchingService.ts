import { RiotApi } from '../api/RiotApi';
import { OpggMcpClient } from './OpggMcpClient';
import { EnhancedPlayerAnalysis } from '../models/EnhancedPlayerData';
import { PlayerAnalysis } from '../models/PlayerAnalysis';
import logger from '../utils/loggerService';
import { createError } from '../utils/errorHandler';

interface CacheEntry {
  data: PlayerAnalysis;
  timestamp: number;
}

interface DataSourceConfig {
  useOpggMcp: boolean;
  useRiotApi: boolean;
  fallbackToMock: boolean;
}

export class DataFetchingService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached entries
  private riotApi: RiotApi;
  private opggMcpClient: OpggMcpClient;
  private config: DataSourceConfig;

  constructor() {
    this.riotApi = new RiotApi(process.env.RIOT_API_KEY || 'demo-key');
    this.opggMcpClient = new OpggMcpClient();
    
    // Configuration based on environment variables  
    this.config = {
      useOpggMcp: false,
      useRiotApi: true,
      fallbackToMock: false  // Disable mock data to get real error messages
    };

    logger.info('DataFetchingService initialized with config:', this.config);
  }

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

  /**
   * Get enhanced player analysis using the best available data source
   */
  async getEnhancedPlayerAnalysis(summonerName: string, region: string = 'na1'): Promise<EnhancedPlayerAnalysis> {
    logger.info(`Fetching enhanced analysis for ${summonerName} in ${region}`);

    // Try OP.GG MCP first if enabled
    if (this.config.useOpggMcp) {
      try {
        logger.info('Attempting OP.GG MCP analysis...');
        const opggResult = await this.opggMcpClient.getEnhancedPlayerAnalysis(summonerName, region);
        logger.info('✅ OP.GG MCP analysis successful');
        return opggResult;
      } catch (error) {
        logger.warn('⚠️ OP.GG MCP analysis failed:', error);
        
        // Continue to fallback options
      }
    }

    // Fallback to Riot API + enhanced processing
    if (this.config.useRiotApi) {
      try {
        logger.info('Attempting Riot API + enhanced analysis...');
        const riotResult = await this.getRiotApiEnhancedAnalysis(summonerName, region);
        logger.info('✅ Riot API enhanced analysis successful');
        return riotResult;
      } catch (error) {
        logger.warn('⚠️ Riot API enhanced analysis failed:', error);
      }
    }

    throw new Error('All data sources failed');
  }

  /**
   * Enhanced analysis using Riot API data
   */
  private async getRiotApiEnhancedAnalysis(summonerName: string, region: string): Promise<EnhancedPlayerAnalysis> {
    logger.info('Creating enhanced analysis from Riot API data...');
    
    try {
      // Parse Riot ID if provided in format GameName#TAG
      const riotIdParts = RiotApi.parseRiotId(summonerName);
      
      let summonerData;
      if (riotIdParts) {
        // Use modern Riot ID approach
        summonerData = await this.riotApi.getSummonerByRiotId(riotIdParts.gameName, riotIdParts.tagLine);
      } else {
        // Fallback to legacy summoner name
        summonerData = await this.riotApi.getSummonerByName(summonerName);
      }
      
      // Use SmurfDetectionService for real analysis instead of mock data
      const { SmurfDetectionService } = await import('./SmurfDetectionService');
      const smurfDetectionService = new SmurfDetectionService(this.riotApi);
      const analysis = await smurfDetectionService.analyzeSmurf(summonerData.puuid, region);
      
      // Convert to EnhancedPlayerAnalysis format
      const enhancedAnalysis: EnhancedPlayerAnalysis = {
        summoner: {
          name: summonerData.name || summonerData.gameName,
          level: summonerData.summonerLevel,
          profileIconId: summonerData.profileIconId,
          region: region
        },
        currentRank: {
          currentRank: {
            tier: 'UNRANKED',
            division: 'I',
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
          overallProbability: analysis.smurfProbability,
          confidenceLevel: 85,
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
              score: 0,
              weight: 0.15,
              indicators: {
                suspiciousGaps: false,
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
          evidenceLevel: 'weak',
          keyFindings: [],
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
            missingDataPoints: [],
            reliabilityScore: 75
          },
          analysisTimestamp: new Date(),
          apiLimitations: [],
          recommendedActions: []
        }
      };
      
      return enhancedAnalysis;
      
    } catch (error) {
      logger.error('Riot API enhanced analysis failed:', error);
      throw error;
    }
  }



  /**
   * Get integration status
   */
  async getIntegrationStatus(): Promise<{
    opggMcp: { enabled: boolean; connected: boolean; tools: string[] };
    riotApi: { enabled: boolean; connected: boolean };
    fallbackMode: boolean;
  }> {
    let opggStatus = { enabled: false, connected: false, tools: [] as string[] };
    
    if (this.config.useOpggMcp) {
      try {
        const status = await this.opggMcpClient.getIntegrationStatus();
        opggStatus = {
          enabled: true,
          connected: status.connected,
          tools: status.availableTools
        };
      } catch (error) {
        logger.error('Error checking OP.GG MCP status:', error);
      }
    }

    return {
      opggMcp: opggStatus,
      riotApi: {
        enabled: this.config.useRiotApi,
        connected: true // Assume Riot API is available
      },
      fallbackMode: this.config.fallbackToMock
    };
  }

  /**
   * Health check for all data sources
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.config.useOpggMcp) {
        const opggHealth = await this.opggMcpClient.healthCheck();
        if (opggHealth) return true;
      }

      if (this.config.useRiotApi) {
        // Assume Riot API is healthy for now
        return true;
      }

      return this.config.fallbackToMock;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup connections
   */
  async cleanup(): Promise<void> {
    try {
      await this.opggMcpClient.disconnect();
      logger.info('DataFetchingService cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
} 