"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiotApi = void 0;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Production API Key Rate Limits - Based on user's actual key
const RATE_LIMITS = {
    'match-v5': {
        requestsPerSecond: 200, // 2000 per 10 seconds
        requestsPer10Seconds: 2000,
        requestsPerMinute: 12000, // Conservative estimate
        requestsPer10Minutes: 120000 // Conservative estimate
    },
    'summoner-v4': {
        requestsPerSecond: 26, // 1600 per minute
        requestsPer10Seconds: 266,
        requestsPerMinute: 1600,
        requestsPer10Minutes: 16000
    },
    'account-v1': {
        requestsPerSecond: 2000, // 20000 per 10 seconds
        requestsPer10Seconds: 20000,
        requestsPerMinute: 120000, // 1200000 per 10 minutes
        requestsPer10Minutes: 1200000
    },
    'champion-mastery-v4': {
        requestsPerSecond: 2000, // 20000 per 10 seconds
        requestsPer10Seconds: 20000,
        requestsPerMinute: 120000,
        requestsPer10Minutes: 1200000
    },
    'league-v4': {
        requestsPerSecond: 100, // Variable based on endpoint
        requestsPer10Seconds: 1000,
        requestsPerMinute: 6000,
        requestsPer10Minutes: 60000
    },
    'default': {
        requestsPerSecond: 100, // Conservative default
        requestsPer10Seconds: 1000,
        requestsPerMinute: 6000,
        requestsPer10Minutes: 60000
    }
};
class RiotApi {
    constructor(apiKey, region = 'na1') {
        this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for memory cache
        this.PERSISTENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for disk cache
        // Enhanced rate limiting with endpoint-specific controls
        this.requestTimestamps = {};
        this.rateLimitConfig = RATE_LIMITS;
        this.apiKey = apiKey;
        this.region = region;
        this.api = axios_1.default.create({
            baseURL: `https://${region}.api.riotgames.com`,
            headers: {
                'X-Riot-Token': apiKey
            }
        });
        this.memoryCache = new Map();
        this.cacheFile = path.join(process.cwd(), 'storage', 'riot-api-cache.json');
        // Initialize persistent cache
        this.initializePersistentCache();
        console.log('🚀 RiotApi initialized with Production Rate Limits');
        console.log('📊 Match API: 2000 req/10s | Account API: 20000 req/10s | Summoner API: 1600 req/min');
    }
    initializePersistentCache() {
        try {
            const cacheDir = path.dirname(this.cacheFile);
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            if (!fs.existsSync(this.cacheFile)) {
                fs.writeFileSync(this.cacheFile, JSON.stringify({}));
            }
            console.log('💾 Persistent cache initialized at:', this.cacheFile);
        }
        catch (error) {
            console.warn('⚠️ Could not initialize persistent cache:', error);
        }
    }
    getEndpointType(endpoint) {
        if (endpoint.includes('/lol/match/v5/'))
            return 'match-v5';
        if (endpoint.includes('/lol/summoner/v4/'))
            return 'summoner-v4';
        if (endpoint.includes('/riot/account/v1/'))
            return 'account-v1';
        if (endpoint.includes('/lol/champion-mastery/v4/'))
            return 'champion-mastery-v4';
        if (endpoint.includes('/lol/league/v4/'))
            return 'league-v4';
        return 'default';
    }
    async enforceRateLimit(endpoint) {
        const endpointType = this.getEndpointType(endpoint);
        const config = this.rateLimitConfig[endpointType];
        const now = Date.now();
        // Initialize timestamp array if not exists
        if (!this.requestTimestamps[endpointType]) {
            this.requestTimestamps[endpointType] = [];
        }
        const timestamps = this.requestTimestamps[endpointType];
        // Clean old timestamps (older than 10 minutes)
        while (timestamps.length > 0 && now - timestamps[0] > 600000) {
            timestamps.shift();
        }
        // Check rate limits
        const last1Second = timestamps.filter(t => now - t < 1000).length;
        const last10Seconds = timestamps.filter(t => now - t < 10000).length;
        const last1Minute = timestamps.filter(t => now - t < 60000).length;
        const last10Minutes = timestamps.length;
        let waitTime = 0;
        // Check each rate limit tier
        if (last1Second >= config.requestsPerSecond) {
            waitTime = Math.max(waitTime, 1000 - (now - timestamps[timestamps.length - config.requestsPerSecond]));
        }
        if (last10Seconds >= config.requestsPer10Seconds) {
            waitTime = Math.max(waitTime, 10000 - (now - timestamps[timestamps.length - config.requestsPer10Seconds]));
        }
        if (last1Minute >= config.requestsPerMinute) {
            waitTime = Math.max(waitTime, 60000 - (now - timestamps[timestamps.length - config.requestsPerMinute]));
        }
        if (last10Minutes >= config.requestsPer10Minutes) {
            waitTime = Math.max(waitTime, 600000 - (now - timestamps[timestamps.length - config.requestsPer10Minutes]));
        }
        if (waitTime > 0) {
            console.log(`⏳ Rate limit for ${endpointType}: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        // Add current timestamp
        timestamps.push(now);
    }
    getCachedData(key) {
        // Check memory cache first
        const memoryData = this.memoryCache.get(key);
        if (memoryData && Date.now() < memoryData.expiry) {
            return memoryData.data;
        }
        // Check persistent cache
        try {
            if (fs.existsSync(this.cacheFile)) {
                const persistentCache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                const cachedItem = persistentCache[key];
                if (cachedItem && Date.now() < cachedItem.expiry) {
                    // Restore to memory cache
                    this.memoryCache.set(key, {
                        data: cachedItem.data,
                        timestamp: cachedItem.timestamp,
                        expiry: cachedItem.expiry
                    });
                    return cachedItem.data;
                }
            }
        }
        catch (error) {
            console.warn('⚠️ Error reading persistent cache:', error);
        }
        return null;
    }
    setCachedData(key, data, persistent = true) {
        const now = Date.now();
        const cacheItem = {
            data,
            timestamp: now,
            expiry: now + (persistent ? this.PERSISTENT_CACHE_DURATION : this.CACHE_DURATION)
        };
        // Set in memory cache
        this.memoryCache.set(key, cacheItem);
        // Set in persistent cache for important data
        if (persistent) {
            try {
                let persistentCache = {};
                if (fs.existsSync(this.cacheFile)) {
                    persistentCache = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                }
                persistentCache[key] = cacheItem;
                // Clean expired entries periodically
                const cleanedCache = {};
                Object.keys(persistentCache).forEach(k => {
                    if (persistentCache[k].expiry > now) {
                        cleanedCache[k] = persistentCache[k];
                    }
                });
                fs.writeFileSync(this.cacheFile, JSON.stringify(cleanedCache, null, 2));
            }
            catch (error) {
                console.warn('⚠️ Error writing persistent cache:', error);
            }
        }
    }
    async retryWithBackoff(operation, maxRetries = 3, endpoint = '') {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                // Enhanced error logging
                console.error(`❌ Request failed for ${endpoint}:`, {
                    status: error.response?.status,
                    message: error.message,
                    attempt: attempt + 1,
                    maxRetries: maxRetries + 1
                });
                // Check if it's a rate limit error
                if (error.response?.status === 429) {
                    const retryAfter = error.response.headers['retry-after'];
                    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 2000;
                    console.log(`🚫 Rate limited on ${endpoint}. Waiting ${waitTime / 1000}s (attempt ${attempt + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                // For other errors, use exponential backoff
                if (attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 1000;
                    console.log(`⚠️ Request failed for ${endpoint}, retrying in ${waitTime / 1000}s... (${attempt + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        // Enhanced error throwing
        if (lastError.response?.status === 429) {
            throw new Error(`Rate limit exceeded after ${maxRetries + 1} attempts`);
        }
        else if (lastError.code === 'ECONNABORTED') {
            throw new Error(`Request timeout after ${maxRetries + 1} attempts`);
        }
        else {
            throw lastError;
        }
    }
    async makeRequest(endpoint, useCache = true, persistent = true) {
        const cacheKey = `${this.region}:${endpoint}`;
        if (useCache) {
            const cached = this.getCachedData(cacheKey);
            if (cached) {
                console.log(`💾 Cache hit for: ${endpoint}`);
                return cached;
            }
        }
        // Enforce rate limiting
        await this.enforceRateLimit(endpoint);
        return this.retryWithBackoff(async () => {
            const response = await this.api.get(endpoint);
            if (useCache) {
                this.setCachedData(cacheKey, response.data, persistent);
                console.log(`💾 Cached ${persistent ? '(persistent)' : '(memory)'}: ${endpoint}`);
            }
            return response.data;
        }, 3, endpoint);
    }
    // Modern Riot ID method - get account by Riot ID (gameName#tagLine)
    async getAccountByRiotId(gameName, tagLine) {
        const routingValue = this.getRoutingValue(this.region);
        const endpoint = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
        // Use direct API call for account lookup with caching
        const url = `https://${routingValue}.api.riotgames.com${endpoint}`;
        const cacheKey = `${routingValue}:${endpoint}`;
        // Check cache first
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            console.log(`💾 Cache hit for account: ${gameName}#${tagLine}`);
            return cached;
        }
        await this.enforceRateLimit(endpoint);
        return this.retryWithBackoff(async () => {
            const response = await axios_1.default.get(url, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            // Cache account data persistently (24 hours)
            this.setCachedData(cacheKey, response.data, true);
            console.log(`💾 Cached account data: ${gameName}#${tagLine}`);
            return response.data;
        }, 3, endpoint);
    }
    // Get summoner by PUUID (modern approach)
    async getSummonerByPuuid(puuid) {
        return this.makeRequest(`/lol/summoner/v4/summoners/by-puuid/${puuid}`, true, true);
    }
    // Legacy method maintained for backward compatibility
    async getSummonerByName(name) {
        return this.makeRequest(`/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`, true, true);
    }
    // Modern Riot ID workflow - get full summoner data from Riot ID
    async getSummonerByRiotId(gameName, tagLine) {
        const cacheKey = `summoner:${gameName}#${tagLine}`;
        // Check for complete summoner data in cache
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            console.log(`💾 Complete summoner cache hit: ${gameName}#${tagLine}`);
            return cached;
        }
        try {
            // Step 1: Get account info (PUUID) from Riot ID
            const account = await this.getAccountByRiotId(gameName, tagLine);
            // Step 2: Get summoner info using PUUID
            const summoner = await this.getSummonerByPuuid(account.puuid);
            // Combine data
            const completeData = {
                ...summoner,
                puuid: account.puuid,
                gameName: account.gameName,
                tagLine: account.tagLine
            };
            // Cache complete summoner data persistently
            this.setCachedData(cacheKey, completeData, true);
            console.log(`💾 Cached complete summoner: ${gameName}#${tagLine}`);
            return completeData;
        }
        catch (error) {
            throw error;
        }
    }
    async getMatchHistory(puuid, startTime, endTime, count = 100) {
        const routingValue = this.getRoutingValue(this.region);
        const params = {
            start: '0',
            count: Math.min(count, 100).toString() // Riot API max is 100 per request
        };
        if (startTime)
            params.startTime = startTime.toString();
        if (endTime)
            params.endTime = endTime.toString();
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/lol/match/v5/matches/by-puuid/${puuid}/ids?${queryString}`;
        const url = `https://${routingValue}.api.riotgames.com${endpoint}`;
        const cacheKey = `${routingValue}:${endpoint}`;
        // Check cache first
        const cached = this.getCachedData(cacheKey);
        if (cached) {
            console.log(`💾 Match history cache hit for PUUID: ${puuid.slice(0, 8)}...`);
            return cached;
        }
        await this.enforceRateLimit(endpoint);
        return this.retryWithBackoff(async () => {
            const response = await axios_1.default.get(url, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            // Cache match history for 30 minutes (less persistent)
            this.setCachedData(cacheKey, response.data, false);
            console.log(`💾 Cached match history: ${response.data.length} matches`);
            return response.data;
        }, 3, endpoint);
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
                    await this.enforceRateLimit(url);
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
                await this.enforceRateLimit(url);
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
        this.memoryCache.clear();
        // Also clear persistent cache file
        try {
            if (fs.existsSync(this.cacheFile)) {
                fs.writeFileSync(this.cacheFile, JSON.stringify({}));
                console.log('💾 Persistent cache cleared');
            }
        }
        catch (error) {
            console.warn('⚠️ Could not clear persistent cache:', error);
        }
    }
    // Generic request method for API validation
    async request(endpoint, useCache = true) {
        return this.makeRequest(endpoint, useCache);
    }
    // Request method that returns full response with headers
    async requestWithHeaders(endpoint) {
        await this.enforceRateLimit(endpoint);
        return this.retryWithBackoff(async () => {
            return await this.api.get(endpoint);
        }, 3, endpoint);
    }
}
exports.RiotApi = RiotApi;
