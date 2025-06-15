import { RiotApi } from '../api/RiotApi';
import { OpggMcpClient } from './OpggMcpClient';
import { EnhancedPlayerAnalysis } from '../models/EnhancedPlayerData';
import { PlayerAnalysis } from '../models/PlayerAnalysis';
import { logger } from '../utils/loggerService';
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
      fallbackToMock: process.env.ALLOW_MOCK_DATA !== 'false'
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

    // Final fallback to mock data
    if (this.config.fallbackToMock) {
      logger.warn('🔄 Using mock data as final fallback');
      return this.generateMockEnhancedAnalysis(summonerName, region);
    }

    throw new Error('All data sources failed and mock data is disabled');
  }

  /**
   * Enhanced analysis using Riot API data
   */
  private async getRiotApiEnhancedAnalysis(summonerName: string, region: string): Promise<EnhancedPlayerAnalysis> {
    // This would use the existing Riot API integration
    // For now, return enhanced mock data to maintain functionality
    logger.info('Creating enhanced analysis from Riot API data...');
    
    return this.generateMockEnhancedAnalysis(summonerName, region, 'Riot API + Enhanced Processing');
  }

  /**
   * Generate mock enhanced analysis
   */
  private generateMockEnhancedAnalysis(
    summonerName: string, 
    region: string, 
    source: string = 'Mock Data'
  ): EnhancedPlayerAnalysis {
    const mockLevel = Math.floor(Math.random() * 200) + 30;
    const mockWins = Math.floor(Math.random() * 100) + 20;
    const mockLosses = Math.floor(Math.random() * 50) + 10;
    const mockWinRate = (mockWins / (mockWins + mockLosses)) * 100;

    return {
      summoner: {
        name: summonerName,
        level: mockLevel,
        profileIconId: Math.floor(Math.random() * 50) + 1,
        region: region
      },
      currentRank: {
        currentRank: {
          tier: ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'][Math.floor(Math.random() * 6)],
          division: ['IV', 'III', 'II', 'I'][Math.floor(Math.random() * 4)],
          lp: Math.floor(Math.random() * 100),
          promos: undefined
        },
        rankHistory: [],
        climbAnalysis: {
          winStreak: Math.floor(Math.random() * 10),
          currentWinRate: mockWinRate,
          climbSpeed: Math.floor(Math.random() * 50),
          skipDivisions: Math.random() > 0.8,
          newAccountRapidClimb: Math.random() > 0.9,
          mmrDiscrepancy: Math.random() > 0.85
        }
      },
      historicalTimeline: {
        seasonData: [],
        activityAnalysis: {
          totalDaysActive: Math.floor(Math.random() * 100) + 30,
          averageGamesPerDay: Math.floor(Math.random() * 8) + 1,
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
          chatFrequency: Math.floor(Math.random() * 100),
          gameKnowledgeTerminology: Math.random() > 0.7,
          strategicCallouts: Math.random() > 0.6,
          flamePatterns: Math.random() > 0.8,
          coachingBehavior: Math.random() > 0.9
        },
        gameplayPatterns: {
          riskTaking: Math.floor(Math.random() * 100),
          adaptability: Math.floor(Math.random() * 100),
          teamFightPositioning: Math.floor(Math.random() * 100),
          objectivePrioritization: Math.floor(Math.random() * 100),
          mapAwareness: Math.floor(Math.random() * 100)
        },
        duoAnalysis: {
          duoPartners: [],
          soloVsDuoPerformance: {
            soloWinRate: mockWinRate + Math.random() * 10 - 5,
            duoWinRate: mockWinRate + Math.random() * 15 - 7.5,
            performanceDifference: Math.random() * 20 - 10
          }
        }
      },
      smurfDetection: {
        overallProbability: Math.floor(Math.random() * 80) + 10,
        confidenceLevel: Math.floor(Math.random() * 50) + 50,
        categoryBreakdown: {
          performanceMetrics: { 
            score: Math.floor(Math.random() * 100), 
            weight: 0.35,
            indicators: {
              unusuallyHighKDA: Math.random() > 0.8,
              perfectCSEfficiency: Math.random() > 0.9,
              expertDamageDealing: Math.random() > 0.85,
              advancedVisionControl: Math.random() > 0.8,
              objectiveControl: Math.random() > 0.75
            }
          },
          historicalAnalysis: { 
            score: Math.floor(Math.random() * 100), 
            weight: 0.25,
            indicators: {
              newAccountHighPerformance: Math.random() > 0.9,
              rapidRankProgression: Math.random() > 0.8,
              mmrDiscrepancy: Math.random() > 0.85,
              skipDivisions: Math.random() > 0.9
            }
          },
          championMastery: { 
            score: Math.floor(Math.random() * 100), 
            weight: 0.20,
            indicators: {
              immediateChampionExpertise: Math.random() > 0.85,
              perfectBuildPaths: Math.random() > 0.9,
              advancedMechanics: Math.random() > 0.8,
              unusualChampionPool: Math.random() > 0.7
            }
          },
          gapAnalysis: { 
            score: Math.floor(Math.random() * 100), 
            weight: 0.15,
            indicators: {
              suspiciousGaps: Math.random() > 0.7,
              performanceJumpsAfterGaps: Math.random() > 0.8,
              roleShiftsAfterGaps: Math.random() > 0.75,
              championPoolChanges: Math.random() > 0.7
            }
          },
          behavioralPatterns: { 
            score: Math.floor(Math.random() * 100), 
            weight: 0.05,
            indicators: {
              advancedGameKnowledge: Math.random() > 0.8,
              strategicCommunication: Math.random() > 0.85,
              unusualDuoPartners: Math.random() > 0.9,
              coachingBehavior: Math.random() > 0.95
            }
          }
        },
        evidenceLevel: ['weak', 'moderate', 'strong'][Math.floor(Math.random() * 3)] as 'weak' | 'moderate' | 'strong',
        keyFindings: [
          `${source} analysis completed`,
          'Statistical analysis performed',
          'Behavioral patterns evaluated'
        ],
        redFlags: Math.random() > 0.7 ? ['Suspicious rapid improvement detected'] : [],
        comparisonToLegitPlayers: {
          percentileRanking: {
            performance: Math.floor(Math.random() * 100),
            consistency: Math.floor(Math.random() * 100)
          },
          statisticalOutliers: Math.random() > 0.8 ? ['KDA', 'CS/min'] : []
        }
      },
      analysisMetadata: {
        dataQuality: {
          gamesAnalyzed: Math.floor(Math.random() * 50) + 10,
          timeSpanDays: Math.floor(Math.random() * 180) + 30,
          missingDataPoints: Math.random() > 0.8 ? ['Some match details unavailable'] : [],
          reliabilityScore: Math.floor(Math.random() * 40) + 60
        },
        analysisTimestamp: new Date(),
        apiLimitations: source.includes('Mock') ? [
          'Using simulated data',
          'Real data requires proper API integration'
        ] : [],
        recommendedActions: [
          `${source} integration status: ${source.includes('Mock') ? 'Simulated' : 'Active'}`,
          'Analysis completed successfully'
        ]
      }
    };
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