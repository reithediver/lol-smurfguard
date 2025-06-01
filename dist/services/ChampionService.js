"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChampionService = void 0;
const axios_1 = __importDefault(require("axios"));
const loggerService_1 = require("../utils/loggerService");
const errorHandler_1 = require("../utils/errorHandler");
const storageAdapter_1 = require("../utils/storageAdapter");
class ChampionService {
    constructor(apiKey, region = 'na1') {
        this.CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
        this.apiKey = apiKey;
        this.region = region;
        this.cache = new Map();
    }
    /**
     * Get the current champion rotation
     */
    async getChampionRotation() {
        try {
            const cacheKey = 'champion-rotation';
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                loggerService_1.logger.debug('Returning cached champion rotation data');
                return cached.data;
            }
            const response = await axios_1.default.get(`https://${this.region}.api.riotgames.com/lol/platform/v3/champion-rotations`, { headers: { 'X-Riot-Token': this.apiKey } });
            // Store in cache
            this.cache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            loggerService_1.logger.error('Failed to get champion rotation:', axiosError.response?.status, axiosError.response?.statusText);
            throw (0, errorHandler_1.createError)(axiosError.response?.status || 500, 'Failed to get champion rotation');
        }
    }
    /**
     * Get champion rotation history (detects changes in rotation over time)
     * This uses our storage system to detect changes in rotation
     */
    async trackRotationChanges() {
        // Get current rotation data
        const currentRotation = await this.getChampionRotation();
        // Check for previous rotation data in storage
        const previousRotationJson = storageAdapter_1.storage.getItem('previous-champion-rotation');
        if (!previousRotationJson) {
            // No previous data, store current data for future comparison
            storageAdapter_1.storage.setItem('previous-champion-rotation', JSON.stringify({
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
            const previousRotation = previousData.rotation;
            // Calculate differences
            const newlyAdded = currentRotation.freeChampionIds.filter(id => !previousRotation.freeChampionIds.includes(id));
            const newlyRemoved = previousRotation.freeChampionIds.filter(id => !currentRotation.freeChampionIds.includes(id));
            const unchanged = currentRotation.freeChampionIds.filter(id => previousRotation.freeChampionIds.includes(id));
            // Update stored data if more than a week has passed
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - previousData.timestamp > oneWeek) {
                storageAdapter_1.storage.setItem('previous-champion-rotation', JSON.stringify({
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
        }
        catch (error) {
            loggerService_1.logger.error('Error tracking rotation changes:', error);
            // Reset stored data
            storageAdapter_1.storage.setItem('previous-champion-rotation', JSON.stringify({
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
    clearCache() {
        this.cache.clear();
    }
}
exports.ChampionService = ChampionService;
