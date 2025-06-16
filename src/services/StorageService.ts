import fs from 'fs';
import path from 'path';
import { logger } from '../utils/loggerService';

/**
 * Interface for cached data with expiration
 */
interface CachedItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Storage configuration options
 */
interface StorageOptions {
  // Base directory for storage files
  baseDir?: string;
  // Default TTL in milliseconds (1 day default)
  defaultTtl?: number;
  // Maximum size of the memory cache (items)
  maxMemoryCacheSize?: number;
}

/**
 * Service for handling persistent storage of data
 * Implements a tiered approach with memory and file-based caching
 */
export class StorageService {
  private memoryCache: Map<string, CachedItem<any>> = new Map();
  private baseDir: string;
  private defaultTtl: number;
  private maxMemoryCacheSize: number;
  
  constructor(options: StorageOptions = {}) {
    this.baseDir = options.baseDir || path.join(process.cwd(), 'storage');
    this.defaultTtl = options.defaultTtl || 24 * 60 * 60 * 1000; // 1 day
    this.maxMemoryCacheSize = options.maxMemoryCacheSize || 1000;
    
    this.initializeStorage();
  }
  
  /**
   * Initialize the storage directory
   */
  private initializeStorage(): void {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
        logger.info(`Storage directory created at: ${this.baseDir}`);
      }
    } catch (error) {
      logger.error('Failed to initialize storage directory:', error);
    }
  }
  
  /**
   * Get the file path for a specific namespace
   */
  private getFilePath(namespace: string): string {
    return path.join(this.baseDir, `${namespace}.json`);
  }
  
  /**
   * Read data from file storage
   */
  private readFromFile<T>(namespace: string): Record<string, CachedItem<T>> {
    try {
      const filePath = this.getFilePath(namespace);
      
      if (!fs.existsSync(filePath)) {
        return {};
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      logger.error(`Error reading from storage (${namespace}):`, error);
      return {};
    }
  }
  
  /**
   * Write data to file storage
   */
  private writeToFile(namespace: string, data: Record<string, CachedItem<any>>): void {
    try {
      const filePath = this.getFilePath(namespace);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error(`Error writing to storage (${namespace}):`, error);
    }
  }
  
  /**
   * Generate a cache key
   */
  private getCacheKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }
  
  /**
   * Clean expired items from memory cache
   */
  private cleanMemoryCache(): void {
    const now = Date.now();
    
    // Remove expired items
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
      }
    }
    
    // If still too large, remove oldest items
    if (this.memoryCache.size > this.maxMemoryCacheSize) {
      const sortedEntries = [...this.memoryCache.entries()]
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const itemsToRemove = this.memoryCache.size - this.maxMemoryCacheSize;
      
      for (let i = 0; i < itemsToRemove; i++) {
        this.memoryCache.delete(sortedEntries[i][0]);
      }
    }
  }
  
  /**
   * Clean expired items from file storage
   */
  private cleanFileStorage(namespace: string): void {
    try {
      const data = this.readFromFile(namespace);
      const now = Date.now();
      let changed = false;
      
      // Remove expired items
      for (const key in data) {
        if (now > data[key].expiry) {
          delete data[key];
          changed = true;
        }
      }
      
      if (changed) {
        this.writeToFile(namespace, data);
      }
    } catch (error) {
      logger.error(`Error cleaning file storage (${namespace}):`, error);
    }
  }
  
  /**
   * Get data from storage
   * @param namespace The namespace/category of the data
   * @param key The unique key for the data
   * @returns The stored data or null if not found or expired
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(namespace, key);
    const now = Date.now();
    
    // Check memory cache first
    const memoryItem = this.memoryCache.get(cacheKey);
    if (memoryItem && now < memoryItem.expiry) {
      return memoryItem.data;
    }
    
    // Check file storage
    const fileData = this.readFromFile<T>(namespace);
    const fileItem = fileData[key];
    
    if (fileItem && now < fileItem.expiry) {
      // Restore to memory cache
      this.memoryCache.set(cacheKey, fileItem);
      return fileItem.data;
    }
    
    return null;
  }
  
  /**
   * Store data in both memory and file storage
   * @param namespace The namespace/category of the data
   * @param key The unique key for the data
   * @param data The data to store
   * @param ttl Time-to-live in milliseconds (optional, uses default if not provided)
   */
  async set<T>(namespace: string, key: string, data: T, ttl?: number): Promise<void> {
    const now = Date.now();
    const expiry = now + (ttl || this.defaultTtl);
    const cacheKey = this.getCacheKey(namespace, key);
    
    // Store in memory
    const cacheItem: CachedItem<T> = {
      data,
      timestamp: now,
      expiry
    };
    
    this.memoryCache.set(cacheKey, cacheItem);
    
    // Clean memory cache if needed
    if (this.memoryCache.size > this.maxMemoryCacheSize) {
      this.cleanMemoryCache();
    }
    
    // Store in file
    const fileData = this.readFromFile(namespace);
    fileData[key] = cacheItem;
    this.writeToFile(namespace, fileData);
  }
  
  /**
   * Delete data from both memory and file storage
   * @param namespace The namespace/category of the data
   * @param key The unique key for the data
   */
  async delete(namespace: string, key: string): Promise<void> {
    const cacheKey = this.getCacheKey(namespace, key);
    
    // Remove from memory
    this.memoryCache.delete(cacheKey);
    
    // Remove from file
    const fileData = this.readFromFile(namespace);
    if (fileData[key]) {
      delete fileData[key];
      this.writeToFile(namespace, fileData);
    }
  }
  
  /**
   * Clear all data in a namespace
   * @param namespace The namespace/category to clear
   */
  async clearNamespace(namespace: string): Promise<void> {
    // Clear from memory
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear from file
    this.writeToFile(namespace, {});
  }
  
  /**
   * Get all keys in a namespace
   * @param namespace The namespace/category to list
   * @returns Array of keys in the namespace
   */
  async listKeys(namespace: string): Promise<string[]> {
    const fileData = this.readFromFile(namespace);
    return Object.keys(fileData);
  }
  
  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    memoryCacheSize: number;
    namespaces: { namespace: string; keys: number; size: number }[];
  }> {
    const namespaces: { namespace: string; keys: number; size: number }[] = [];
    
    // Get all files in storage directory
    const files = fs.readdirSync(this.baseDir)
      .filter(file => file.endsWith('.json'));
    
    for (const file of files) {
      const namespace = path.basename(file, '.json');
      const filePath = this.getFilePath(namespace);
      const stats = fs.statSync(filePath);
      const fileData = this.readFromFile(namespace);
      
      namespaces.push({
        namespace,
        keys: Object.keys(fileData).length,
        size: stats.size
      });
    }
    
    return {
      memoryCacheSize: this.memoryCache.size,
      namespaces
    };
  }
} 