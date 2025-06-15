"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiotApi = void 0;
const axios_1 = __importDefault(require("axios"));
class RiotApi {
    constructor(apiKey, region = 'na1') {
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.RATE_LIMIT = 20; // requests per second
        this.MAX_QUEUE_SIZE = 1000; // Maximum number of requests in the queue
        this.requestQueue = [];
        this.processingQueue = false;
        this.apiKey = apiKey;
        this.region = region;
        this.api = axios_1.default.create({
            baseURL: `https://${region}.api.riotgames.com`,
            headers: {
                'X-Riot-Token': apiKey
            }
        });
        this.cache = new Map();
    }
    async processQueue() {
        if (this.processingQueue)
            return;
        this.processingQueue = true;
        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            if (request) {
                await request();
                await new Promise(resolve => setTimeout(resolve, 1000 / this.RATE_LIMIT));
            }
        }
        this.processingQueue = false;
    }
    async makeRequest(endpoint, useCache = true) {
        const cacheKey = endpoint;
        if (useCache) {
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                return cached.data;
            }
        }
        return new Promise((resolve, reject) => {
            if (this.requestQueue.length >= this.MAX_QUEUE_SIZE) {
                reject(new Error('Request queue is full. Try again later.'));
                return;
            }
            this.requestQueue.push(async () => {
                try {
                    const response = await this.api.get(endpoint);
                    if (useCache) {
                        this.cache.set(cacheKey, {
                            data: response.data,
                            timestamp: Date.now()
                        });
                    }
                    resolve(response.data);
                }
                catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }
    // Modern Riot ID method - get account by Riot ID (gameName#tagLine)
    async getAccountByRiotId(gameName, tagLine) {
        const routingValue = this.getRoutingValue(this.region);
        const url = `https://${routingValue}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
        try {
            const response = await axios_1.default.get(url, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }
    // Get summoner by PUUID (modern approach)
    async getSummonerByPuuid(puuid) {
        return this.makeRequest(`/lol/summoner/v4/summoners/by-puuid/${puuid}`);
    }
    // Legacy method maintained for backward compatibility
    async getSummonerByName(name) {
        return this.makeRequest(`/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`);
    }
    // Modern Riot ID workflow - get full summoner data from Riot ID
    async getSummonerByRiotId(gameName, tagLine) {
        try {
            // Step 1: Get account info (PUUID) from Riot ID
            const account = await this.getAccountByRiotId(gameName, tagLine);
            // Step 2: Get summoner info using PUUID
            const summoner = await this.getSummonerByPuuid(account.puuid);
            // Return combined data
            return {
                ...summoner,
                puuid: account.puuid,
                gameName: account.gameName,
                tagLine: account.tagLine
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getMatchHistory(puuid, startTime, endTime) {
        const routingValue = this.getRoutingValue(this.region);
        const url = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`;
        const params = {};
        if (startTime)
            params.startTime = startTime.toString();
        if (endTime)
            params.endTime = endTime.toString();
        try {
            const response = await axios_1.default.get(url, {
                headers: { 'X-Riot-Token': this.apiKey },
                params
            });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }
    async getMatchDetails(matchId) {
        const routingValue = this.getRoutingValue(this.region);
        const url = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        try {
            const response = await axios_1.default.get(url, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }
    async getChampionMastery(puuid, championId) {
        const endpoint = championId
            ? `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`
            : `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
        return this.makeRequest(endpoint);
    }
    async getLeagueEntries(puuid) {
        return this.makeRequest(`/lol/league/v4/entries/by-puuid/${puuid}`);
    }
    // Helper method to get regional routing values
    getRoutingValue(region) {
        const regionMapping = {
            'br1': 'americas',
            'eun1': 'europe',
            'euw1': 'europe',
            'jp1': 'asia',
            'kr': 'asia',
            'la1': 'americas',
            'la2': 'americas',
            'na1': 'americas',
            'oc1': 'sea',
            'tr1': 'europe',
            'ru': 'europe',
            'ph2': 'sea',
            'sg2': 'sea',
            'th2': 'sea',
            'tw2': 'sea',
            'vn2': 'sea'
        };
        return regionMapping[region] || 'americas';
    }
    // Utility method to parse Riot ID from string
    static parseRiotId(riotIdString) {
        const parts = riotIdString.split('#');
        if (parts.length !== 2) {
            return null;
        }
        return {
            gameName: parts[0].trim(),
            tagLine: parts[1].trim()
        };
    }
    clearCache() {
        this.cache.clear();
    }
    // Generic request method for API validation
    async request(endpoint, useCache = true) {
        return this.makeRequest(endpoint, useCache);
    }
    // Request method that returns full response with headers
    async requestWithHeaders(endpoint) {
        return new Promise((resolve, reject) => {
            if (this.requestQueue.length >= this.MAX_QUEUE_SIZE) {
                reject(new Error('Request queue is full. Try again later.'));
                return;
            }
            this.requestQueue.push(async () => {
                try {
                    const response = await this.api.get(endpoint);
                    resolve(response);
                }
                catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }
}
exports.RiotApi = RiotApi;
