import axios, { AxiosError } from 'axios';
import logger from '../utils/loggerService';
import { createError } from '../utils/errorHandler';
import { storage } from '../utils/storageAdapter';

export interface ChampionRotation {
  freeChampionIds: number[];
  freeChampionIdsForNewPlayers: number[];
  maxNewPlayerLevel: number;
}

export class ChampionService {
  private apiKey: string;
  private region: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(apiKey: string, region: string = 'na1') {
    this.apiKey = apiKey;
    this.region = region;
    this.cache = new Map();
  }

  /**
   * Get the current champion rotation
   */
  async getChampionRotation(): Promise<ChampionRotation> {
    try {
      const cacheKey = 'champion-rotation';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        logger.debug('Returning cached champion rotation data');
        return cached.data;
      }
      
      const response = await axios.get(
        `https://${this.region}.api.riotgames.com/lol/platform/v3/champion-rotations`,
        { headers: { 'X-Riot-Token': this.apiKey } }
      );
      
      // Store in cache
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error('Failed to get champion rotation:', axiosError.response?.status, axiosError.response?.statusText);
      throw createError(axiosError.response?.status || 500, 'Failed to get champion rotation');
    }
  }
  
  /**
   * Get champion rotation history (detects changes in rotation over time)
   * This uses our storage system to detect changes in rotation
   */
  async trackRotationChanges(): Promise<{
    currentRotation: ChampionRotation;
    newlyAdded: number[];
    newlyRemoved: number[];
    unchanged: number[];
  }> {
    // Get current rotation data
    const currentRotation = await this.getChampionRotation();
    
    // Check for previous rotation data in storage
    const previousRotationJson = storage.getItem('previous-champion-rotation');
    
    if (!previousRotationJson) {
      // No previous data, store current data for future comparison
      storage.setItem('previous-champion-rotation', JSON.stringify({
        rotation: currentRotation,
        timestamp: Date.now()
      }));
      
      return {
        currentRotation,
        newlyAdded: [],
        newlyRemoved: [],
        unchanged: currentRotation.freeChampionIds
      };
    }
    
    try {
      const previousData = JSON.parse(previousRotationJson);
      const previousRotation = previousData.rotation as ChampionRotation;
      
      // Calculate differences
      const newlyAdded = currentRotation.freeChampionIds.filter(
        id => !previousRotation.freeChampionIds.includes(id)
      );
      
      const newlyRemoved = previousRotation.freeChampionIds.filter(
        id => !currentRotation.freeChampionIds.includes(id)
      );
      
      const unchanged = currentRotation.freeChampionIds.filter(
        id => previousRotation.freeChampionIds.includes(id)
      );
      
      // Update stored data if more than a week has passed
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - previousData.timestamp > oneWeek) {
        storage.setItem('previous-champion-rotation', JSON.stringify({
          rotation: currentRotation,
          timestamp: Date.now()
        }));
      }
      
      return {
        currentRotation,
        newlyAdded,
        newlyRemoved,
        unchanged
      };
    } catch (error) {
      logger.error('Error tracking rotation changes:', error);
      
      // Reset stored data
      storage.setItem('previous-champion-rotation', JSON.stringify({
        rotation: currentRotation,
        timestamp: Date.now()
      }));
      
      return {
        currentRotation,
        newlyAdded: [],
        newlyRemoved: [],
        unchanged: currentRotation.freeChampionIds
      };
    }
  }
  
  /**
   * Clear the champion service cache
   */
  clearCache(): void {
    this.cache.clear();
  }
} 