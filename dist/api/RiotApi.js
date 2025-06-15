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
        this.RATE_LIMIT = 10; // Reduced to 10 requests per second for safety
        this.MAX_QUEUE_SIZE = 1000; // Maximum number of requests in the queue
        this.requestQueue = [];
        this.processingQueue = false;
        // Enhanced rate limiting properties
        this.lastRequestTime = 0;
        this.requestCount = 0;
        this.REQUESTS_PER_MINUTE = 100; // Conservative limit
        this.REQUESTS_PER_SECOND = 20; // Burst limit
        this.MIN_REQUEST_INTERVAL = 50; // Minimum 50ms between requests
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
                await this.enforceRateLimit();
                await request();
            }
        }
        this.processingQueue = false;
    }
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        // Ensure minimum interval between requests
        if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
            await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
        }
        // Reset request count every minute
        if (now - this.lastRequestTime > 60000) {
            this.requestCount = 0;
        }
        // Check if we're approaching rate limits
        this.requestCount++;
        if (this.requestCount >= this.REQUESTS_PER_MINUTE) {
            console.log('⏳ Rate limit approaching, waiting 60 seconds...');
            await new Promise(resolve => setTimeout(resolve, 60000));
            this.requestCount = 0;
        }
        this.lastRequestTime = Date.now();
    }
    async retryWithBackoff(operation, maxRetries = 3) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                // Check if it's a rate limit error
                if (error.response?.status === 429) {
                    const retryAfter = error.response.headers['retry-after'];
                    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
                    console.log(`🚫 Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries + 1}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                // For other errors, use exponential backoff
                if (attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 1000;
                    console.log(`⚠️ Request failed, retrying in ${waitTime / 1000}s... (${attempt + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        throw lastError;
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
                    const response = await this.retryWithBackoff(() => this.api.get(endpoint));
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
    async getMatchHistory(puuid, startTime, endTime, count = 100) {
        const routingValue = this.getRoutingValue(this.region);
        const url = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
        const params = {
            start: '0',
            count: Math.min(count, 100).toString() // Riot API max is 100 per request
        };
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
    // Get extended match history with multiple requests if needed
    async getExtendedMatchHistory(puuid, totalCount = 500, queueId) {
        const allMatches = [];
        const batchSize = 100; // Riot API limit per request
        let start = 0;
        console.log(`🔍 Fetching ${totalCount} matches in batches of ${batchSize}...`);
        while (allMatches.length < totalCount && start < 1000) { // Riot API has a 1000 match limit
            const params = {
                start: start.toString(),
                count: Math.min(batchSize, totalCount - allMatches.length).toString()
            };
            if (queueId) {
                params.queue = queueId.toString(); // Filter by queue type (e.g., 420 for Ranked Solo)
            }
            try {
                console.log(`📥 Fetching matches ${start}-${start + batchSize}...`);
                const routingValue = this.getRoutingValue(this.region);
                const url = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
                const response = await this.retryWithBackoff(async () => {
                    await this.enforceRateLimit();
                    return axios_1.default.get(url, {
                        headers: { 'X-Riot-Token': this.apiKey },
                        params
                    });
                });
                const matches = response.data;
                if (matches.length === 0) {
                    console.log('✅ No more matches available');
                    break; // No more matches available
                }
                allMatches.push(...matches);
                start += batchSize;
                console.log(`📊 Progress: ${allMatches.length}/${totalCount} matches fetched`);
                // Enhanced rate limiting - longer wait between batches
                if (start < totalCount && allMatches.length < totalCount) {
                    const waitTime = 200 + Math.random() * 300; // 200-500ms random delay
                    console.log(`⏳ Waiting ${waitTime.toFixed(0)}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
            catch (error) {
                console.error(`❌ Error fetching matches starting at ${start}:`, error.response?.status || error.message);
                // If we hit rate limits, wait longer and continue
                if (error.response?.status === 429) {
                    const retryAfter = error.response.headers['retry-after'] || 60;
                    console.log(`🚫 Rate limited, waiting ${retryAfter} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    continue; // Don't break, try again
                }
                // For other errors, break to avoid infinite loops
                break;
            }
        }
        console.log(`✅ Completed: ${allMatches.length} matches fetched`);
        return allMatches.slice(0, totalCount);
    }
    async getMatchDetails(matchId) {
        const routingValue = this.getRoutingValue(this.region);
        const url = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        try {
            const response = await this.retryWithBackoff(async () => {
                await this.enforceRateLimit();
                return axios_1.default.get(url, {
                    headers: { 'X-Riot-Token': this.apiKey }
                });
            });
            // Transform Riot API v5 response to our MatchHistory interface
            const riotMatch = response.data;
            const transformedMatch = {
                matchId: riotMatch.metadata.matchId,
                gameCreation: new Date(riotMatch.info.gameCreation),
                gameDuration: riotMatch.info.gameDuration,
                gameMode: riotMatch.info.gameMode,
                gameType: riotMatch.info.gameType,
                participants: riotMatch.info.participants.map((participant) => ({
                    puuid: participant.puuid,
                    summonerId: participant.summonerId || '',
                    summonerName: participant.summonerName || participant.riotIdGameName || '',
                    championId: participant.championId,
                    championName: participant.championName,
                    teamId: participant.teamId,
                    stats: {
                        kills: participant.kills,
                        deaths: participant.deaths,
                        assists: participant.assists,
                        totalDamageDealt: participant.totalDamageDealtToChampions,
                        totalDamageTaken: participant.totalDamageTaken,
                        goldEarned: participant.goldEarned,
                        visionScore: participant.visionScore,
                        cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
                        csPerMinute: (participant.totalMinionsKilled + participant.neutralMinionsKilled) / (riotMatch.info.gameDuration / 60),
                        win: participant.win
                    },
                    runes: participant.perks?.styles?.map((style) => style.selections?.map((selection) => ({
                        runeId: selection.perk,
                        rank: selection.var1 || 0
                    })) || []).flat() || [],
                    items: [
                        participant.item0,
                        participant.item1,
                        participant.item2,
                        participant.item3,
                        participant.item4,
                        participant.item5,
                        participant.item6
                    ].filter(item => item > 0),
                    summonerSpells: {
                        spell1Id: participant.summoner1Id,
                        spell2Id: participant.summoner2Id
                    },
                    position: participant.teamPosition || participant.individualPosition || '',
                    lane: participant.lane || ''
                })),
                teams: riotMatch.info.teams.map((team) => ({
                    teamId: team.teamId,
                    win: team.win,
                    objectives: {
                        baron: {
                            first: team.objectives?.baron?.first || false,
                            kills: team.objectives?.baron?.kills || 0
                        },
                        dragon: {
                            first: team.objectives?.dragon?.first || false,
                            kills: team.objectives?.dragon?.kills || 0
                        },
                        herald: {
                            first: team.objectives?.riftHerald?.first || false,
                            kills: team.objectives?.riftHerald?.kills || 0
                        },
                        tower: {
                            first: team.objectives?.tower?.first || false,
                            kills: team.objectives?.tower?.kills || 0
                        }
                    }
                })),
                platformId: riotMatch.info.platformId,
                queueId: riotMatch.info.queueId,
                seasonId: riotMatch.info.gameVersion?.split('.')[0] || '13' // Extract season from game version
            };
            return transformedMatch;
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
