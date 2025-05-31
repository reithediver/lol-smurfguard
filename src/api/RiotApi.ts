import axios, { AxiosInstance } from 'axios';
import { MatchHistory, MatchParticipant } from '../models/MatchHistory';
import { ChampionStats } from '../models/ChampionStats';
import { PlayerAnalysis } from '../models/PlayerAnalysis';

export class RiotApi {
    private api: AxiosInstance;
    private cache: Map<string, { data: any; timestamp: number }>;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    private readonly RATE_LIMIT = 20; // requests per second
    private requestQueue: Array<() => Promise<any>> = [];
    private processingQueue = false;

    constructor(apiKey: string, region: string = 'na1') {
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

    async getSummonerByName(name: string): Promise<any> {
        return this.makeRequest(`/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`);
    }

    async getMatchHistory(puuid: string, startTime?: number, endTime?: number): Promise<string[]> {
        let endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`;
        if (startTime) endpoint += `&startTime=${startTime}`;
        if (endTime) endpoint += `&endTime=${endTime}`;
        return this.makeRequest(endpoint);
    }

    async getMatchDetails(matchId: string): Promise<MatchHistory> {
        return this.makeRequest(`/lol/match/v5/matches/${matchId}`);
    }

    async getChampionMastery(puuid: string, championId: number): Promise<any> {
        return this.makeRequest(`/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`);
    }

    async getLeagueEntries(summonerId: string): Promise<any> {
        return this.makeRequest(`/lol/league/v4/entries/by-summoner/${summonerId}`);
    }

    clearCache() {
        this.cache.clear();
    }
} 