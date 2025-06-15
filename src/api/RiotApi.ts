import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { MatchHistory, MatchParticipant } from '../models/MatchHistory';
import { ChampionStats } from '../models/ChampionStats';
import { PlayerAnalysis } from '../models/PlayerAnalysis';

export class RiotApi {
    private api: AxiosInstance;
    private cache: Map<string, { data: any; timestamp: number }>;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    private readonly RATE_LIMIT = 20; // requests per second
    private readonly MAX_QUEUE_SIZE = 1000; // Maximum number of requests in the queue
    private requestQueue: Array<() => Promise<any>> = [];
    private processingQueue = false;
    public readonly apiKey: string;
    private readonly region: string;

    constructor(apiKey: string, region: string = 'na1') {
        this.apiKey = apiKey;
        this.region = region;
        this.api = axios.create({
            baseURL: `https://${region}.api.riotgames.com`,
            headers: {
                'X-Riot-Token': apiKey
            }
        });
        this.cache = new Map();
    }

    private async processQueue() {
        if (this.processingQueue) return;
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

    private async makeRequest<T>(endpoint: string, useCache: boolean = true): Promise<T> {
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
                    const response = await this.api.get<T>(endpoint);
                    if (useCache) {
                        this.cache.set(cacheKey, {
                            data: response.data,
                            timestamp: Date.now()
                        });
                    }
                    resolve(response.data);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    // Modern Riot ID method - get account by Riot ID (gameName#tagLine)
    async getAccountByRiotId(gameName: string, tagLine: string): Promise<any> {
        const routingValue = this.getRoutingValue(this.region);
        const url = `https://${routingValue}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
        
        try {
            const response = await axios.get(url, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Get summoner by PUUID (modern approach)
    async getSummonerByPuuid(puuid: string): Promise<any> {
        return this.makeRequest(`/lol/summoner/v4/summoners/by-puuid/${puuid}`);
    }

    // Legacy method maintained for backward compatibility
    async getSummonerByName(name: string): Promise<any> {
        return this.makeRequest(`/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`);
    }

    // Modern Riot ID workflow - get full summoner data from Riot ID
    async getSummonerByRiotId(gameName: string, tagLine: string): Promise<any> {
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
        } catch (error) {
            throw error;
        }
    }

    async getMatchHistory(puuid: string, startTime?: number, endTime?: number): Promise<string[]> {
        const routingValue = this.getRoutingValue(this.region);
        const url = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`;
        
        const params: Record<string, string> = {};
        if (startTime) params.startTime = startTime.toString();
        if (endTime) params.endTime = endTime.toString();
        
        try {
            const response = await axios.get(url, { 
                headers: { 'X-Riot-Token': this.apiKey },
                params 
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getMatchDetails(matchId: string): Promise<MatchHistory> {
        const routingValue = this.getRoutingValue(this.region);
        const url = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        
        try {
            const response = await axios.get(url, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getChampionMastery(puuid: string, championId?: number): Promise<any> {
        const endpoint = championId 
            ? `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`
            : `/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
        return this.makeRequest(endpoint);
    }

    async getLeagueEntries(puuid: string): Promise<any> {
        return this.makeRequest(`/lol/league/v4/entries/by-puuid/${puuid}`);
    }

    // Helper method to get regional routing values
    private getRoutingValue(region: string): string {
        const regionMapping: { [key: string]: string } = {
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
    static parseRiotId(riotIdString: string): { gameName: string; tagLine: string } | null {
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
    async request<T = any>(endpoint: string, useCache: boolean = true): Promise<T> {
        return this.makeRequest<T>(endpoint, useCache);
    }

    // Request method that returns full response with headers
    async requestWithHeaders(endpoint: string): Promise<AxiosResponse> {
        return new Promise((resolve, reject) => {
            if (this.requestQueue.length >= this.MAX_QUEUE_SIZE) {
                reject(new Error('Request queue is full. Try again later.'));
                return;
            }
            
            this.requestQueue.push(async () => {
                try {
                    const response = await this.api.get(endpoint);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }
} 