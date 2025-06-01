import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  SmurfAnalysis,
  AnalysisRequest,
  ApiResponse,
  SmurfDetectionError,
  Region,
  Player,
  ChampionMastery,
  MatchData,
  RateLimitInfo
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // In development, use local backend. In production, use the deployed backend
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds timeout for analysis requests
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => {
        console.log(`Response from ${response.config.url}:`, response.status);
        return response;
      },
      (error) => {
        console.error('Response interceptor error:', error);
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: any): SmurfDetectionError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 404:
          return {
            type: 'PLAYER_NOT_FOUND',
            message: data.error?.message || 'Player not found',
            code: status,
          };
        case 429:
          return {
            type: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded. Please try again later.',
            code: status,
            retryAfter: parseInt(error.response.headers['retry-after']) || 60,
          };
        case 500:
          return {
            type: 'API_ERROR',
            message: 'Internal server error. Please try again later.',
            code: status,
          };
        default:
          return {
            type: 'API_ERROR',
            message: data.error?.message || 'An unexpected error occurred',
            code: status,
            details: data,
          };
      }
    } else if (error.request) {
      // Network error
      return {
        type: 'API_ERROR',
        message: 'Network error. Please check your connection.',
        code: 0,
      };
    } else {
      // Other error
      return {
        type: 'API_ERROR',
        message: error.message || 'An unexpected error occurred',
        code: -1,
      };
    }
  }

  /**
   * Analyze a player for smurf detection
   */
  async analyzePlayer(request: AnalysisRequest): Promise<SmurfAnalysis> {
    try {
      const response = await this.api.post<ApiResponse<SmurfAnalysis>>('/analyze', request);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Analysis failed');
      }

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get player information by name and region
   */
  async getPlayer(playerName: string, region: Region): Promise<Player> {
    try {
      const response = await this.api.get<ApiResponse<Player>>(`/player/${region}/${encodeURIComponent(playerName)}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get player information');
      }

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get champion mastery data for a player
   */
  async getChampionMastery(summonerId: string, region: Region): Promise<ChampionMastery[]> {
    try {
      const response = await this.api.get<ApiResponse<ChampionMastery[]>>(`/mastery/${region}/${summonerId}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get champion mastery data');
      }

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get match history for a player
   */
  async getMatchHistory(puuid: string, region: Region, count: number = 20): Promise<MatchData[]> {
    try {
      const response = await this.api.get<ApiResponse<MatchData[]>>(
        `/matches/${region}/${puuid}?count=${count}`
      );
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get match history');
      }

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current rate limit information
   */
  async getRateLimitInfo(): Promise<RateLimitInfo> {
    try {
      const response = await this.api.get<ApiResponse<RateLimitInfo>>('/rate-limit');
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to get rate limit information');
      }

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get<ApiResponse<{ status: string }>>('/health');
      return response.data.success && response.data.data?.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available regions
   */
  getAvailableRegions(): { value: Region; label: string }[] {
    return [
      { value: 'na1', label: 'North America' },
      { value: 'euw1', label: 'Europe West' },
      { value: 'eun1', label: 'Europe Nordic & East' },
      { value: 'kr', label: 'Korea' },
      { value: 'br1', label: 'Brazil' },
      { value: 'la1', label: 'Latin America North' },
      { value: 'la2', label: 'Latin America South' },
      { value: 'oc1', label: 'Oceania' },
      { value: 'tr1', label: 'Turkey' },
      { value: 'ru', label: 'Russia' },
      { value: 'jp1', label: 'Japan' },
    ];
  }

  /**
   * Parse player name to handle Riot ID format (Name#TAG)
   */
  parsePlayerName(input: string): { name: string; tag: string } {
    const parts = input.split('#');
    if (parts.length === 2) {
      return {
        name: parts[0].trim(),
        tag: parts[1].trim(),
      };
    }
    
    // Fallback for old summoner names without tags
    return {
      name: input.trim(),
      tag: '',
    };
  }

  /**
   * Validate player name format
   */
  validatePlayerName(input: string): { isValid: boolean; error?: string } {
    if (!input || input.trim().length === 0) {
      return { isValid: false, error: 'Player name cannot be empty' };
    }

    const trimmed = input.trim();
    
    // Check for Riot ID format (Name#TAG)
    if (trimmed.includes('#')) {
      const parts = trimmed.split('#');
      if (parts.length !== 2) {
        return { isValid: false, error: 'Invalid Riot ID format. Use: PlayerName#TAG' };
      }
      
      const [name, tag] = parts;
      if (!name || name.length === 0) {
        return { isValid: false, error: 'Player name cannot be empty' };
      }
      
      if (!tag || tag.length === 0) {
        return { isValid: false, error: 'Tag cannot be empty in Riot ID format' };
      }
      
      if (name.length > 16) {
        return { isValid: false, error: 'Player name cannot be longer than 16 characters' };
      }
      
      if (tag.length > 5) {
        return { isValid: false, error: 'Tag cannot be longer than 5 characters' };
      }
    } else {
      // Legacy summoner name
      if (trimmed.length > 16) {
        return { isValid: false, error: 'Player name cannot be longer than 16 characters' };
      }
    }

    // Check for invalid characters
    const validPattern = /^[a-zA-Z0-9\s\-_#]+$/;
    if (!validPattern.test(trimmed)) {
      return { isValid: false, error: 'Player name contains invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Mock analysis for development (when API is not available)
   */
  async mockAnalyzePlayer(playerName: string): Promise<SmurfAnalysis> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockAnalysis: SmurfAnalysis = {
      playerName,
      puuid: 'mock-puuid-' + Date.now(),
      smurfProbability: Math.random() * 100,
      confidenceLevel: 75 + Math.random() * 25,
      reasons: [
        {
          type: 'CHAMPION_PERFORMANCE',
          severity: 'HIGH',
          description: 'Exceptional performance on recently played champions',
          confidence: 85,
          evidence: ['90% win rate on Yasuo with only 8 games', 'KDA of 4.2 significantly above average']
        },
        {
          type: 'PLAYTIME_GAP',
          severity: 'MEDIUM',
          description: 'Suspicious gaps in gameplay activity',
          confidence: 70,
          evidence: ['21-day gap between game sessions', 'Pattern suggests account sharing or boosting']
        }
      ],
      championStats: [
        {
          championId: 157,
          championName: 'Yasuo',
          winRate: 90,
          kda: 4.2,
          csPerMinute: 8.5,
          gamesPlayed: 8,
          averageDamage: 28500,
          visionScore: 15,
          masteryLevel: 4,
          masteryPoints: 12500,
          recentPerformance: []
        },
        {
          championId: 238,
          championName: 'Zed',
          winRate: 85,
          kda: 3.8,
          csPerMinute: 9.2,
          gamesPlayed: 12,
          averageDamage: 32000,
          visionScore: 12,
          masteryLevel: 5,
          masteryPoints: 18500,
          recentPerformance: []
        }
      ],
      playtimeGaps: [7, 14, 21],
      accountAge: 45,
      totalGamesAnalyzed: 50,
      analysisDate: new Date().toISOString(),
      detectionCriteria: {
        championPerformanceThreshold: {
          winRateThreshold: 70,
          kdaThreshold: 3.0,
          csPerMinuteThreshold: 8.0,
          minimumGames: 5
        },
        playtimeGapThreshold: {
          suspiciousGapDays: 7,
          maximumGapCount: 3
        },
        summonerSpellAnalysis: {
          trackKeyBindings: true,
          patternChangeThreshold: 3
        },
        playerAssociation: {
          highEloThreshold: 'DIAMOND',
          associationCount: 5
        }
      }
    };

    return mockAnalysis;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 