"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const loggerService_1 = __importDefault(require("../utils/loggerService"));
/**
 * Service for handling persistent storage of data
 * Implements a tiered approach with memory and file-based caching
 */
class StorageService {
    constructor(options = {}) {
        this.memoryCache = new Map();
        this.baseDir = options.baseDir || path_1.default.join(process.cwd(), 'storage');
        this.defaultTtl = options.defaultTtl || 24 * 60 * 60 * 1000; // 1 day
        this.maxMemoryCacheSize = options.maxMemoryCacheSize || 1000;
        this.initializeStorage();
    }
    /**
     * Initialize the storage directory
     */
    initializeStorage() {
        try {
            if (!fs_1.default.existsSync(this.baseDir)) {
                fs_1.default.mkdirSync(this.baseDir, { recursive: true });
                loggerService_1.default.info(`Storage directory created at: ${this.baseDir}`);
            }
        }
        catch (error) {
            loggerService_1.default.error('Failed to initialize storage directory:', error);
        }
    }
    /**
     * Get the file path for a specific namespace
     */
    getFilePath(namespace) {
        return path_1.default.join(this.baseDir, `${namespace}.json`);
    }
    /**
     * Read data from file storage
     */
    readFromFile(namespace) {
        try {
            const filePath = this.getFilePath(namespace);
            if (!fs_1.default.existsSync(filePath)) {
                return {};
            }
            const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        }
        catch (error) {
            loggerService_1.default.error(`Error reading from storage (${namespace}):`, error);
            return {};
        }
    }
    /**
     * Write data to file storage
     */
    writeToFile(namespace, data) {
        try {
            const filePath = this.getFilePath(namespace);
            fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            loggerService_1.default.error(`Error writing to storage (${namespace}):`, error);
        }
    }
    /**
     * Generate a cache key
     */
    getCacheKey(namespace, key) {
        return `${namespace}:${key}`;
    }
    /**
     * Clean expired items from memory cache
     */
    cleanMemoryCache() {
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
    cleanFileStorage(namespace) {
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
        }
        catch (error) {
            loggerService_1.default.error(`Error cleaning file storage (${namespace}):`, error);
        }
    }
    /**
     * Get data from storage
     * @param namespace The namespace/category of the data
     * @param key The unique key for the data
     * @returns The stored data or null if not found or expired
     */
    async get(namespace, key) {
        const cacheKey = this.getCacheKey(namespace, key);
        const now = Date.now();
        // Check memory cache first
        const memoryItem = this.memoryCache.get(cacheKey);
        if (memoryItem && now < memoryItem.expiry) {
            return memoryItem.data;
        }
        // Check file storage
        const fileData = this.readFromFile(namespace);
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
    async set(namespace, key, data, ttl) {
        const now = Date.now();
        const expiry = now + (ttl || this.defaultTtl);
        const cacheKey = this.getCacheKey(namespace, key);
        // Store in memory
        const cacheItem = {
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
    async delete(namespace, key) {
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
    async clearNamespace(namespace) {
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
    async listKeys(namespace) {
        const fileData = this.readFromFile(namespace);
        return Object.keys(fileData);
    }
    /**
     * Get storage statistics
     */
    async getStats() {
        const namespaces = [];
        // Get all files in storage directory
        const files = fs_1.default.readdirSync(this.baseDir)
            .filter(file => file.endsWith('.json'));
        for (const file of files) {
            const namespace = path_1.default.basename(file, '.json');
            const filePath = this.getFilePath(namespace);
            const stats = fs_1.default.statSync(filePath);
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
exports.StorageService = StorageService;
