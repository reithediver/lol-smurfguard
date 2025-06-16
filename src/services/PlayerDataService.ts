import { StorageService } from './StorageService';
import { logger } from '../utils/loggerService';
import { RiotApi } from '../api/RiotApi';

// Namespaces for different types of player data
enum PlayerDataNamespace {
  SUMMONER = 'summoners',
  MATCH_HISTORY = 'match_histories',
  ANALYSIS = 'analyses',
  MATCH_DETAILS = 'match_details'
}

// TTL values for different types of data (in milliseconds)
const TTL = {
  SUMMONER: 24 * 60 * 60 * 1000, // 24 hours
  MATCH_HISTORY: 12 * 60 * 60 * 1000, // 12 hours
  ANALYSIS: 24 * 60 * 60 * 1000, // 24 hours
  MATCH_DETAILS: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Service for managing player data storage and retrieval
 */
export class PlayerDataService {
  private storageService: StorageService;
  private riotApi: RiotApi;
  
  constructor(riotApi: RiotApi) {
    this.storageService = new StorageService({
      baseDir: 'storage/players',
      maxMemoryCacheSize: 500 // Limit memory usage
    });
    this.riotApi = riotApi;
  }
  
  /**
   * Get summoner data by Riot ID, from cache or API
   * @param gameName Game name portion of Riot ID
   * @param tagLine Tag line portion of Riot ID
   * @param forceRefresh Whether to force a refresh from the API
   */
  async getSummonerByRiotId(gameName: string, tagLine: string, forceRefresh = false): Promise<any> {
    const key = `${gameName.toLowerCase()}_${tagLine.toLowerCase()}`;
    
    // Try to get from cache first unless force refresh
    if (!forceRefresh) {
      const cached = await this.storageService.get(PlayerDataNamespace.SUMMONER, key);
      if (cached) {
        logger.info(`Retrieved summoner data for ${gameName}#${tagLine} from cache`);
        return cached;
      }
    }
    
    // Get from API
    logger.info(`Fetching summoner data for ${gameName}#${tagLine} from API`);
    const summoner = await this.riotApi.getSummonerByRiotId(gameName, tagLine);
    
    // Store in cache
    await this.storageService.set(
      PlayerDataNamespace.SUMMONER,
      key,
      summoner,
      TTL.SUMMONER
    );
    
    return summoner;
  }
  
  /**
   * Get match history for a player, from cache or API
   * @param puuid Player UUID
   * @param count Number of matches to retrieve
   * @param forceRefresh Whether to force a refresh from the API
   */
  async getMatchHistory(puuid: string, count: number = 100, forceRefresh = false): Promise<string[]> {
    const key = `${puuid}_${count}`;
    
    // Try to get from cache first unless force refresh
    if (!forceRefresh) {
      const cached = await this.storageService.get<string[]>(PlayerDataNamespace.MATCH_HISTORY, key);
      if (cached) {
        logger.info(`Retrieved match history for ${puuid} from cache`);
        return cached;
      }
    }
    
    // Get from API
    logger.info(`Fetching match history for ${puuid} from API`);
    const matchHistory = await this.riotApi.getMatchHistory(puuid, count);
    
    // Store in cache
    await this.storageService.set(
      PlayerDataNamespace.MATCH_HISTORY,
      key,
      matchHistory,
      TTL.MATCH_HISTORY
    );
    
    return matchHistory;
  }
  
  /**
   * Get match details, from cache or API
   * @param matchId Match ID
   * @param forceRefresh Whether to force a refresh from the API
   */
  async getMatchDetails(matchId: string, forceRefresh = false): Promise<any> {
    // Try to get from cache first unless force refresh
    if (!forceRefresh) {
      const cached = await this.storageService.get(PlayerDataNamespace.MATCH_DETAILS, matchId);
      if (cached) {
        logger.info(`Retrieved match details for ${matchId} from cache`);
        return cached;
      }
    }
    
    // Get from API
    logger.info(`Fetching match details for ${matchId} from API`);
    const matchDetails = await this.riotApi.getMatchDetails(matchId);
    
    // Store in cache
    await this.storageService.set(
      PlayerDataNamespace.MATCH_DETAILS,
      matchId,
      matchDetails,
      TTL.MATCH_DETAILS
    );
    
    return matchDetails;
  }
  
  /**
   * Store analysis results for a player
   * @param puuid Player UUID
   * @param analysis Analysis data
   */
  async storeAnalysis(puuid: string, analysis: any): Promise<void> {
    await this.storageService.set(
      PlayerDataNamespace.ANALYSIS,
      puuid,
      analysis,
      TTL.ANALYSIS
    );
    
    logger.info(`Stored analysis for ${puuid}`);
  }
  
  /**
   * Get analysis results for a player if available
   * @param puuid Player UUID
   */
  async getAnalysis(puuid: string): Promise<any | null> {
    return await this.storageService.get(PlayerDataNamespace.ANALYSIS, puuid);
  }
  
  /**
   * Get storage statistics for player data
   */
  async getStats(): Promise<any> {
    return await this.storageService.getStats();
  }
  
  /**
   * Clear expired data
   */
  async clearExpired(): Promise<void> {
    // The StorageService automatically cleans expired items when reading
    // This method is for manual cleanup
    logger.info('Manual cleanup of expired player data initiated');
    
    // We could implement additional cleanup logic here if needed
  }
} 