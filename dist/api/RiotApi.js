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
        this.requestQueue = [];
        this.processingQueue = false;
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
    async getSummonerByName(name) {
        return this.makeRequest(`/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`);
    }
    async getMatchHistory(puuid, startTime, endTime) {
        let endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`;
        if (startTime)
            endpoint += `&startTime=${startTime}`;
        if (endTime)
            endpoint += `&endTime=${endTime}`;
        return this.makeRequest(endpoint);
    }
    async getMatchDetails(matchId) {
        return this.makeRequest(`/lol/match/v5/matches/${matchId}`);
    }
    async getChampionMastery(puuid, championId) {
        return this.makeRequest(`/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`);
    }
    async getLeagueEntries(summonerId) {
        return this.makeRequest(`/lol/league/v4/entries/by-summoner/${summonerId}`);
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.RiotApi = RiotApi;
