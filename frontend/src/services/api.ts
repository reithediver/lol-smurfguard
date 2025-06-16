import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
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
    // Force Railway backend URL for production deployments
    // Only use localhost in actual development environment
    let isLocalDevelopment = false;
    let hostname = 'unknown';
    
    try {
      // Safely check if we're in a browser environment
      if (typeof window !== 'undefined' && window.location) {
        hostname = window.location.hostname;
        isLocalDevelopment = process.env.NODE_ENV === 'development' && hostname === 'localhost';
      }
    } catch (error) {
      console.warn('Could not access window.location:', error);
      // Default to production mode if we can't determine environment
      isLocalDevelopment = false;
    }
    
    if (isLocalDevelopment) {
      this.baseURL = 'http://localhost:3001/api';
    } else {
      // Always use Railway backend for deployed versions
      this.baseURL = 'https://smurfgaurd-production.up.railway.app/api';
    }
    
    console.log('🌐 ApiService initialized with baseURL:', this.baseURL);
    console.log('🔧 Environment info:', {
      NODE_ENV: process.env.NODE_ENV,
      hostname,
      isLocalDevelopment,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL // Just for debugging
    });
    
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
        console.log(`🚀 Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
        console.log('📝 Request config:', {
          url: config.url,
          method: config.method,
          baseURL: config.baseURL,
          params: config.params,
          timeout: config.timeout
        });
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<any>>) => {
        console.log(`✅ Response from ${response.config.url}:`, response.status);
        console.log('📊 Response data preview:', response.data);
        return response;
      },
      (error) => {
        console.error('❌ Response interceptor error:', error);
        console.error('🔍 Error details:', {
          message: error.message,
          code: error.code,
          config: error.config,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : null
        });
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: any): SmurfDetectionError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 403:
          return {
            type: 'API_ACCESS_FORBIDDEN',
            message: data.message || 'Access forbidden. Development API key restrictions.',
            code: status,
            details: data.details,
            suggestions: data.suggestions || []
          };
        case 404:
          return {
            type: 'PLAYER_NOT_FOUND',
            message: data.message || 'Player not found',
            code: status,
            suggestions: data.suggestions || []
          };
        case 429:
          return {
            type: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded. Please try again later.',
            code: status,
            retryAfter: parseInt(error.response.headers['retry-after']) || 60,
          };
        case 500:
          // Handle backend analysis errors
          if (data.error === 'ANALYSIS_ERROR') {
            return {
              type: 'ANALYSIS_FAILED',
              message: `Unable to analyze this player.`,
              code: status,
              details: `Backend analysis error: ${data.details || data.message}`,
              suggestions: [
                'This player may have restricted data access',
                'Try a different Riot ID',
                'The player may not have recent game data'
              ]
            };
          }
          return {
            type: 'API_ERROR',
            message: 'Internal server error. Please try again later.',
            code: status,
          };
        default:
          return {
            type: 'API_ERROR',
            message: data.error?.message || data.message || 'An unexpected error occurred',
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
   * Health check endpoint
   */
  async healthCheck(): Promise<{ success: boolean; message: string; version: string; features: string[] }> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(): Promise<any> {
    try {
      const response = await this.api.get('/integration/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Basic smurf analysis
   */
  async analyzeBasic(summonerName: string, region: string = 'na1'): Promise<any> {
    try {
      const response = await this.api.get(`/analyze/basic/${encodeURIComponent(summonerName)}`, {
        params: { region }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enhanced OP.GG style analysis
   */
  async analyzeEnhanced(summonerName: string, region: string = 'na1'): Promise<any> {
    try {
      const response = await this.api.get(`/analyze/opgg-enhanced/${encodeURIComponent(summonerName)}`, {
        params: { region }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Comprehensive analysis (supports both Riot IDs and legacy summoner names)
   */
  async analyzeComprehensive(identifier: string, region: string = 'na1'): Promise<any> {
    try {
      const response = await this.api.get(`/analyze/comprehensive/${encodeURIComponent(identifier)}`, {
        params: { region }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get comprehensive player statistics (OP.GG style)
   */
  async getComprehensiveStats(riotId: string, region: string = 'na1', matches: number = 100): Promise<any> {
    try {
      const response = await this.api.get(`/player/comprehensive/${encodeURIComponent(riotId)}`, {
        params: { region, matches }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * NEW: Unified Smurf Analysis (combines comprehensive stats + smurf detection)
   */
  async getUnifiedAnalysis(riotId: string, options: {
    region?: string;
    matches?: number;
    refresh?: boolean;
  } = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (options.region) params.append('region', options.region);
      if (options.matches) params.append('matches', options.matches.toString());
      if (options.refresh) params.append('refresh', 'true');
      
      // Fix: Use the correct endpoint structure that matches the backend route
      // The backend expects /api/analyze/unified/:riotId but we're using /analysis/unified?summonerName=
      const url = `/analyze/unified/${encodeURIComponent(riotId)}?${params.toString()}`;
      
      console.log('🎯 Calling unified analysis endpoint:', url);
      console.log('🌐 Full URL:', `${this.baseURL}${url}`);
      
      // Create a timeout promise that rejects after 45 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Analysis request timed out after 45 seconds'));
        }, 45000);
      });
      
      try {
        // Race between the actual request and the timeout
        const response = await Promise.race([
          this.api.get(url, {
            timeout: 60000, // Increase timeout to 60 seconds
          }),
          timeoutPromise
        ]) as any;
        
        console.log('✅ Unified analysis response received:', response.status);
        return response.data;
      } catch (networkError: any) {
        console.error('❌ Network error in unified analysis:', networkError);
        console.error('❌ Network error details:', {
          message: networkError.message,
          code: networkError.code,
          config: networkError.config,
          response: networkError.response ? {
            status: networkError.response.status,
            statusText: networkError.response.statusText,
            data: networkError.response.data
          } : null
        });
        
        // If it's a timeout error, provide a more specific message
        if (networkError.message && networkError.message.includes('timeout')) {
          throw {
            type: 'TIMEOUT_ERROR',
            message: 'The analysis request is taking longer than expected. Please try again or check your connection.',
            code: 408
          };
        }
        
        // Retry once with a direct fetch to bypass any axios issues
        console.log('🔄 Retrying with direct fetch...');
        const directUrl = `${this.baseURL}${url}`;
        
        // Add a timeout to the fetch request as well
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        
        try {
          const directResponse = await fetch(directUrl, { 
            signal: controller.signal 
          });
          
          clearTimeout(timeoutId);
          
          if (!directResponse.ok) {
            throw new Error(`Direct fetch failed with status: ${directResponse.status}`);
          }
          
          const data = await directResponse.json();
          console.log('✅ Direct fetch successful');
          return data;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            throw {
              type: 'TIMEOUT_ERROR',
              message: 'The analysis request was aborted due to timeout. Please try again later.',
              code: 408
            };
          }
          
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('❌ Unified analysis error:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Try multiple analysis methods in order of preference
   */
  async analyzePlayer(playerName: string, region: string = 'na1'): Promise<any> {
    // Prioritize comprehensive analysis first since it's working best
    const analysisOrder = [
      () => this.analyzeComprehensive(playerName, region),  // This works great according to debug logs
      () => this.analyzeEnhanced(playerName, region),      // Fallback 1
      () => this.analyzeBasic(playerName, region)          // Fallback 2 (known to have 403 issues for famous players)
    ];

    let lastError;
    let attemptCount = 0;
    
    for (const analysisMethod of analysisOrder) {
      try {
        attemptCount++;
        console.log(`🔍 Attempting analysis method ${attemptCount}/3...`);
        
        const result = await analysisMethod();
        
        if (result && result.success) {
          console.log(`✅ Analysis successful with method ${attemptCount}!`);
          return result;
        } else {
          throw new Error(result?.error?.message || result?.message || 'Analysis method returned unsuccessful result');
        }
      } catch (error) {
        lastError = error;
        console.warn(`❌ Analysis method ${attemptCount} failed:`, error);
        
        // Don't continue trying other methods for 404 errors (player not found)
        if (error instanceof Error && error.message.includes('404')) {
          console.log(`🚫 Player not found (404), stopping attempts`);
          break;
        }
      }
    }

    // If all methods failed, provide helpful error message
    console.error('❌ All analysis methods failed. Last error:', lastError);
    throw lastError || new Error('All analysis methods failed');
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
   * Get available regions for analysis
   */
  getAvailableRegions(): { value: Region; label: string }[] {
    return [
      { value: 'na1', label: 'North America' },
      { value: 'euw1', label: 'Europe West' },
      { value: 'eun1', label: 'Europe Nordic & East' },
      { value: 'kr', label: 'Korea' },
      { value: 'jp1', label: 'Japan' },
      { value: 'br1', label: 'Brazil' },
      { value: 'la1', label: 'Latin America North' },
      { value: 'la2', label: 'Latin America South' },
      { value: 'oc1', label: 'Oceania' },
      { value: 'tr1', label: 'Turkey' },
      { value: 'ru', label: 'Russia' },
    ];
  }

  /**
   * Parse player name to handle both Riot ID format (GameName#TAG) and legacy names
   */
  parsePlayerName(input: string): { name: string; tag: string } {
    if (input.includes('#')) {
      const parts = input.split('#');
      return {
        name: parts[0].trim(),
        tag: parts[1].trim()
      };
    }
    return {
      name: input.trim(),
      tag: ''
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
    
    if (trimmed.length < 3) {
      return { isValid: false, error: 'Player name must be at least 3 characters long' };
    }

    if (trimmed.length > 30) {
      return { isValid: false, error: 'Player name cannot exceed 30 characters' };
    }

    // Check for Riot ID format
    if (trimmed.includes('#')) {
      const parts = trimmed.split('#');
      if (parts.length !== 2) {
        return { isValid: false, error: 'Invalid Riot ID format. Use: GameName#TAG' };
      }
      
      const [gameName, tagLine] = parts;
      if (!gameName.trim() || !tagLine.trim()) {
        return { isValid: false, error: 'Both game name and tag are required for Riot ID' };
      }
      
      if (tagLine.length < 3 || tagLine.length > 5) {
        return { isValid: false, error: 'Tag must be 3-5 characters long' };
      }
    }

    // Basic character validation
    const validChars = /^[a-zA-Z0-9\s#]+$/;
    if (!validChars.test(trimmed)) {
      return { isValid: false, error: 'Player name contains invalid characters' };
    }

    return { isValid: true };
  }


}

// Export singleton instance
export const apiService = new ApiService();
export { ApiService }; 