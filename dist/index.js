"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const RiotApi_1 = require("./api/RiotApi");
const DataFetchingService_1 = require("./services/DataFetchingService");
const SmurfDetectionService_1 = require("./services/SmurfDetectionService");
const loggerService_1 = __importDefault(require("./utils/loggerService"));
const ChampionStatsService_1 = require("./services/ChampionStatsService");
const UnifiedAnalysisService_1 = require("./services/UnifiedAnalysisService");
const ChampionService_1 = require("./services/ChampionService");
const ChallengerService_1 = require("./services/ChallengerService");
const AdvancedDataService_1 = require("./services/AdvancedDataService");
const OutlierGameDetectionService_1 = require("./services/OutlierGameDetectionService");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Log startup configuration
console.log('🚀 Starting SmurfGuard API Server...');
console.log('📍 Port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔑 API Key present:', !!process.env.RIOT_API_KEY);
console.log('🔗 CORS origins:', [
    'http://localhost:3000',
    'https://lol-smurfguard.vercel.app',
    'https://lol-smurfguard-*.vercel.app',
    'https://smurfgaurd-production.up.railway.app'
]);
// Initialize services
const riotApi = new RiotApi_1.RiotApi(process.env.RIOT_API_KEY || 'demo-key');
const championService = new ChampionService_1.ChampionService(process.env.RIOT_API_KEY || 'demo-key');
const challengerService = new ChallengerService_1.ChallengerService(process.env.RIOT_API_KEY || 'demo-key');
const advancedDataService = new AdvancedDataService_1.AdvancedDataService(riotApi);
const smurfDetectionService = new SmurfDetectionService_1.SmurfDetectionService(riotApi);
const dataFetchingService = new DataFetchingService_1.DataFetchingService();
const outlierGameDetectionService = new OutlierGameDetectionService_1.OutlierGameDetectionService();
const unifiedAnalysisService = new UnifiedAnalysisService_1.UnifiedAnalysisService(riotApi, smurfDetectionService, dataFetchingService, outlierGameDetectionService);
const championStatsService = new ChampionStatsService_1.ChampionStatsService(riotApi);
// Middleware
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        console.log('🔍 CORS Request from origin:', origin);
        const allowedOrigins = [
            'http://localhost:3000',
            'https://lol-smurfguard.vercel.app',
            /^https:\/\/lol-smurfguard-.*\.vercel\.app$/, // Preview deployments
            'https://smurfgaurd-production.up.railway.app',
            /^https:\/\/.*-reis-projects-.*\.vercel\.app$/ // All Vercel preview deployments
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('✅ CORS: Allowing request with no origin');
            return callback(null, true);
        }
        // Check against allowed origins
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return allowed === origin;
            }
            else {
                return allowed.test(origin);
            }
        });
        if (isAllowed) {
            console.log('✅ CORS: Allowing origin:', origin);
            callback(null, true);
        }
        else {
            console.log('❌ CORS: Blocking origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));
app.use(express_1.default.json());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'SmurfGuard API is healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: ['OP.GG MCP Integration', 'Enhanced Analysis', 'Real-time Detection']
    });
});
// OP.GG Integration Status endpoint
app.get('/api/integration/status', async (req, res) => {
    try {
        const integrationStatus = await dataFetchingService.getIntegrationStatus();
        res.json({
            success: true,
            integration: {
                opggEnabled: false, // OP.GG MCP is disabled
                serviceName: 'Riot API + SmurfGuard Analysis',
                features: ['Real-time Analysis', 'Riot API Integration', 'Smurf Detection'],
                mcpTools: [],
                dataQuality: 'Limited',
                limitations: [
                    'OP.GG MCP integration disabled',
                    'Using Riot API and fallback data sources'
                ]
            }
        });
    }
    catch (error) {
        loggerService_1.default.error('Error getting integration status:', error);
        res.status(500).json({
            success: false,
            error: {
                type: 'INTEGRATION_STATUS_ERROR',
                message: 'Failed to check integration status'
            }
        });
    }
});
// Enhanced OP.GG analysis endpoint
app.get('/api/analyze/opgg-enhanced/:summonerName', async (req, res) => {
    try {
        const { summonerName } = req.params;
        const region = req.query.region || 'na1';
        loggerService_1.default.info(`Enhanced OP.GG analysis request for ${summonerName} in ${region}`);
        const analysis = await dataFetchingService.getEnhancedPlayerAnalysis(summonerName, region);
        res.json({
            success: true,
            data: analysis,
            metadata: {
                analysisType: 'enhanced_opgg',
                requestTimestamp: new Date().toISOString(),
                processingTime: Date.now() // You could measure actual processing time
            }
        });
    }
    catch (error) {
        loggerService_1.default.error(`Enhanced analysis error for ${req.params.summonerName}:`, error);
        res.status(500).json({
            success: false,
            error: {
                type: 'ENHANCED_ANALYSIS_ERROR',
                message: error instanceof Error ? error.message : 'Enhanced analysis failed',
                details: 'Please try again or check the Demo tab for working examples'
            }
        });
    }
});
// Legacy endpoints for backward compatibility
app.get('/api/analyze/basic/:summonerName', async (req, res) => {
    try {
        const { summonerName } = req.params;
        const region = req.query.region || 'na1';
        loggerService_1.default.info(`Basic analysis request for ${summonerName} in ${region}`);
        // Use basic Riot API analysis
        const analysis = await dataFetchingService.fetchPlayerAnalysis(summonerName);
        res.json({
            success: true,
            data: analysis,
            metadata: {
                analysisType: 'basic_riot_api',
                requestTimestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        loggerService_1.default.error(`Basic analysis error for ${req.params.summonerName}:`, error);
        res.status(403).json({
            success: false,
            error: 'API_ACCESS_FORBIDDEN',
            message: `Cannot access player data for "${req.params.summonerName}". The Development API key has restrictions on famous players.`,
            details: `API access forbidden for "${req.params.summonerName}". The Development API key cannot access famous players. Try a different summoner name.`,
            suggestions: [
                'Try searching for a less well-known summoner name',
                'Visit the Demo tab to see working examples with challenger data',
                'Use the Enhanced Analysis mode for better results'
            ]
        });
    }
});
// Comprehensive analysis endpoint (updated to handle Riot IDs)
app.get('/api/analyze/comprehensive/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const region = req.query.region || 'na1';
        loggerService_1.default.info(`Comprehensive analysis request for ${identifier} in ${region}`);
        // Check if identifier is a Riot ID (contains #) or legacy summoner name
        const riotIdParts = RiotApi_1.RiotApi.parseRiotId(identifier);
        let analysis;
        if (riotIdParts) {
            // Modern Riot ID format (gameName#tagLine)
            loggerService_1.default.info(`Using modern Riot ID format: ${riotIdParts.gameName}#${riotIdParts.tagLine}`);
            try {
                // Try to get summoner data using Riot ID
                const summonerData = await riotApi.getSummonerByRiotId(riotIdParts.gameName, riotIdParts.tagLine);
                // Perform smurf analysis using PUUID
                analysis = await smurfDetectionService.analyzeSmurf(summonerData.puuid, region);
                res.json({
                    success: true,
                    data: {
                        ...analysis,
                        summonerInfo: summonerData,
                        riotId: `${riotIdParts.gameName}#${riotIdParts.tagLine}`
                    },
                    metadata: {
                        analysisType: 'comprehensive_riotid',
                        requestTimestamp: new Date().toISOString(),
                        inputFormat: 'riot_id'
                    }
                });
            }
            catch (riotIdError) {
                loggerService_1.default.warn('Riot ID analysis failed, trying fallback methods:', riotIdError);
                throw riotIdError;
            }
        }
        else {
            // Legacy summoner name format
            loggerService_1.default.info(`Using legacy summoner name format: ${identifier}`);
            try {
                const enhancedAnalysis = await dataFetchingService.getEnhancedPlayerAnalysis(identifier, region);
                res.json({
                    success: true,
                    data: enhancedAnalysis,
                    metadata: {
                        analysisType: 'comprehensive_enhanced',
                        requestTimestamp: new Date().toISOString(),
                        inputFormat: 'summoner_name'
                    }
                });
            }
            catch (enhancedError) {
                loggerService_1.default.warn('Enhanced analysis failed, falling back to basic:', enhancedError);
                const basicAnalysis = await dataFetchingService.fetchPlayerAnalysis(identifier);
                res.json({
                    success: true,
                    data: basicAnalysis,
                    metadata: {
                        analysisType: 'comprehensive_basic_fallback',
                        requestTimestamp: new Date().toISOString(),
                        inputFormat: 'summoner_name',
                        fallbackReason: 'Enhanced analysis unavailable'
                    }
                });
            }
        }
    }
    catch (error) {
        loggerService_1.default.error(`Comprehensive analysis error for ${req.params.identifier}:`, error);
        // Type guard for axios errors
        const isAxiosError = (err) => {
            return Boolean(err && typeof err === 'object' && err !== null && 'response' in err);
        };
        if (isAxiosError(error) && error.response?.status === 404) {
            res.status(404).json({
                success: false,
                error: 'PLAYER_NOT_FOUND',
                message: `Player "${req.params.identifier}" not found.`,
                details: 'The player may not exist or the Riot ID format may be incorrect.',
                suggestions: [
                    'Check the spelling of the Riot ID (format: gameName#tagLine)',
                    'Ensure the player exists in the specified region',
                    'Try using the exact capitalization shown in-game'
                ]
            });
        }
        else if (isAxiosError(error) && error.response?.status === 403) {
            res.status(403).json({
                success: false,
                error: 'API_ACCESS_FORBIDDEN',
                message: `Cannot access player data for "${req.params.identifier}".`,
                details: 'Request failed with status code 403',
                suggestions: [
                    'Try searching for a different player',
                    'Visit the Demo tab to see working examples',
                    'Use the OP.GG Enhanced analysis for better results'
                ]
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'ANALYSIS_ERROR',
                message: 'Failed to analyze player data',
                details: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
    }
});
// New dedicated Riot ID endpoint
app.get('/api/analyze/riot-id/:gameName/:tagLine', async (req, res) => {
    try {
        const { gameName, tagLine } = req.params;
        const region = req.query.region || 'na1';
        loggerService_1.default.info(`Riot ID analysis request for ${gameName}#${tagLine} in ${region}`);
        // Get summoner data using Riot ID
        const summonerData = await riotApi.getSummonerByRiotId(gameName, tagLine);
        // Perform comprehensive smurf analysis
        const analysis = await smurfDetectionService.analyzeSmurf(summonerData.puuid, region);
        res.json({
            success: true,
            data: {
                ...analysis,
                summonerInfo: summonerData,
                riotId: `${gameName}#${tagLine}`
            },
            metadata: {
                analysisType: 'riot_id_dedicated',
                requestTimestamp: new Date().toISOString(),
                inputFormat: 'riot_id_params'
            }
        });
    }
    catch (error) {
        loggerService_1.default.error(`Riot ID analysis error for ${req.params.gameName}#${req.params.tagLine}:`, error);
        if (error && typeof error === 'object' && 'response' in error) {
            const apiError = error;
            if (apiError.response?.status === 404) {
                res.status(404).json({
                    success: false,
                    error: 'RIOT_ID_NOT_FOUND',
                    message: `Riot ID "${req.params.gameName}#${req.params.tagLine}" not found.`,
                    details: 'The Riot ID may not exist or may be in a different region.',
                    suggestions: [
                        'Check the spelling and capitalization',
                        'Verify the tagline (part after #)',
                        'Ensure the account exists in the specified region'
                    ]
                });
                return;
            }
        }
        res.status(500).json({
            success: false,
            error: 'RIOT_ID_ANALYSIS_ERROR',
            message: 'Failed to analyze Riot ID',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
// Comprehensive player statistics endpoint (OP.GG style)
app.get('/api/player/comprehensive/:riotId', async (req, res) => {
    const { riotId } = req.params;
    const region = req.query.region || 'na1';
    const matchCount = parseInt(req.query.matches) || 100;
    loggerService_1.default.info(`🔍 Comprehensive stats request for: ${riotId} (${region})`);
    try {
        // Parse Riot ID
        const riotIdParts = RiotApi_1.RiotApi.parseRiotId(riotId);
        if (!riotIdParts) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_RIOT_ID',
                message: 'Please provide a valid Riot ID in format: GameName#TAG'
            });
        }
        // Initialize services
        const riotApi = new RiotApi_1.RiotApi(process.env.RIOT_API_KEY, region);
        const championStatsService = new ChampionStatsService_1.ChampionStatsService(riotApi);
        // Get summoner data
        const summoner = await riotApi.getSummonerByRiotId(riotIdParts.gameName, riotIdParts.tagLine);
        const leagueData = await riotApi.getLeagueEntries(summoner.puuid);
        const championMastery = await riotApi.getChampionMastery(summoner.puuid);
        // Get comprehensive statistics
        const comprehensiveStats = await championStatsService.getComprehensiveStats(summoner.puuid, matchCount);
        res.json({
            success: true,
            source: 'Riot API + Comprehensive Analysis',
            timestamp: new Date().toISOString(),
            data: {
                summoner: {
                    puuid: summoner.puuid,
                    gameName: summoner.gameName,
                    tagLine: summoner.tagLine,
                    summonerLevel: summoner.summonerLevel,
                    profileIconId: summoner.profileIconId,
                    region: region
                },
                leagueData,
                championMastery: championMastery.slice(0, 10), // Top 10 mastery
                comprehensiveStats
            }
        });
    }
    catch (error) {
        loggerService_1.default.error('Error in comprehensive stats endpoint:', error);
        // Type guard for axios-like error
        const isAxiosError = (err) => {
            return typeof err === 'object' && err !== null && 'response' in err;
        };
        if (isAxiosError(error) && error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                error: 'SUMMONER_NOT_FOUND',
                message: 'Summoner not found. Please check the Riot ID and region.'
            });
        }
        if (isAxiosError(error) && error.response?.status === 403) {
            return res.status(403).json({
                success: false,
                error: 'API_ACCESS_FORBIDDEN',
                message: 'API access forbidden. Please check API key configuration.'
            });
        }
        res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Failed to fetch comprehensive player statistics',
            details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
        });
    }
});
// NEW: Unified Smurf Detection & Stats Endpoint
app.get('/api/analyze/unified/:riotId', async (req, res) => {
    const { riotId } = req.params;
    const region = req.query.region || 'na1';
    const matchCount = Math.min(parseInt(req.query.matches) || 50, 100); // Reduced default and max
    // Set timeout for the entire request
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(504).json({
                success: false,
                error: 'REQUEST_TIMEOUT',
                message: 'Analysis request timed out. Please try again with fewer matches.',
                details: 'Consider reducing the number of matches to analyze for faster results.'
            });
        }
    }, 40000); // Reduced to 40 seconds
    try {
        loggerService_1.default.info(`Starting unified analysis for ${riotId} in region ${region} (${matchCount} matches)`);
        // Parse Riot ID
        const riotIdParts = RiotApi_1.RiotApi.parseRiotId(riotId);
        if (!riotIdParts) {
            clearTimeout(timeout);
            return res.status(400).json({
                success: false,
                error: 'INVALID_RIOT_ID',
                message: 'Invalid Riot ID format. Please use the format: GameName#TagLine',
                suggestions: [
                    'Check the format: GameName#TagLine',
                    'Ensure the # symbol is included',
                    'Verify there are no spaces around the #'
                ]
            });
        }
        const { gameName, tagLine } = riotIdParts;
        // Get summoner data
        const summoner = await riotApi.getSummonerByRiotId(gameName, tagLine);
        if (!summoner) {
            clearTimeout(timeout);
            return res.status(404).json({
                success: false,
                error: 'PLAYER_NOT_FOUND',
                message: `Player "${riotId}" not found in region ${region}`,
                suggestions: [
                    'Check spelling and capitalization',
                    'Verify the tagline (part after #)',
                    'Try a different region',
                    'Ensure the player has recent game activity'
                ]
            });
        }
        // Use the UnifiedAnalysisService with optimized settings
        const analysis = await unifiedAnalysisService.getUnifiedAnalysis(summoner.puuid, {
            region,
            riotId,
            matchCount,
            forceRefresh: req.query.refresh === 'true' || req.query.bust === 'true',
            fastMode: true // Enable fast mode for quicker analysis
        });
        // Transform the analysis to match frontend interface
        const transformedAnalysis = {
            summoner: {
                id: summoner.id,
                accountId: summoner.accountId,
                puuid: summoner.puuid,
                name: summoner.name,
                profileIconId: summoner.profileIconId,
                revisionDate: summoner.revisionDate,
                summonerLevel: summoner.summonerLevel,
                gameName: summoner.gameName || gameName,
                tagLine: summoner.tagLine || tagLine
            },
            overallStats: analysis.overallStats,
            championAnalysis: analysis.championAnalysis,
            unifiedSuspicion: analysis.unifiedSuspicion,
            outlierAnalysis: analysis.outlierAnalysis ? {
                totalGamesAnalyzed: analysis.outlierAnalysis.totalGamesAnalyzed,
                outlierGames: analysis.outlierAnalysis.outlierGames.map(game => ({
                    matchId: game.matchId,
                    championName: game.championName,
                    gameDate: game.gameDate,
                    queueType: game.queueType || 'Unknown',
                    position: game.position || 'Unknown',
                    kda: game.kda || 0,
                    kills: game.kills || 0,
                    deaths: game.deaths || 0,
                    assists: game.assists || 0,
                    csPerMinute: game.csPerMinute || 0,
                    damageShare: game.damageShare || 0,
                    visionScore: game.visionScore || 0,
                    killParticipation: game.killParticipation || 0,
                    outlierScore: game.outlierScore || 0,
                    outlierFlags: game.outlierFlags || [],
                    teamMVP: game.teamMVP || false,
                    perfectGame: game.perfectGame || false,
                    gameCarried: game.gameCarried || false,
                    matchUrl: game.matchUrl || `https://www.op.gg/summoners/${region}/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}/matches/${game.matchId}`
                })),
                outlierRate: analysis.outlierAnalysis.outlierRate,
                averageOutlierScore: analysis.outlierAnalysis.averageOutlierScore,
                topOutlierFlags: analysis.outlierAnalysis.topOutlierFlags,
                suspicionSummary: analysis.outlierAnalysis.suspicionSummary
            } : undefined,
            metadata: {
                ...analysis.metadata,
                optimizedForSpeed: true,
                matchesRequested: matchCount,
                matchesAnalyzed: analysis.metadata.matchesAnalyzed
            }
        };
        clearTimeout(timeout);
        loggerService_1.default.info(`✅ Unified analysis completed for ${riotId} (${analysis.metadata.matchesAnalyzed} matches processed)`);
        return res.json({
            success: true,
            data: transformedAnalysis
        });
    }
    catch (error) {
        clearTimeout(timeout);
        loggerService_1.default.error(`Error in unified analysis for ${riotId}:`, error);
        // Don't send response if headers already sent (timeout occurred)
        if (res.headersSent) {
            return;
        }
        // Type guard for axios-like error
        const isAxiosError = (err) => {
            return typeof err === 'object' && err !== null && 'response' in err;
        };
        if (isAxiosError(error)) {
            if (error.response?.status === 404) {
                return res.status(404).json({
                    success: false,
                    error: 'PLAYER_NOT_FOUND',
                    message: `Player "${riotId}" not found in region ${region}`,
                    suggestions: [
                        'Check spelling and capitalization',
                        'Verify the tagline (part after #)',
                        'Try a different region',
                        'Ensure the player has recent game activity'
                    ]
                });
            }
            if (error.response?.status === 403) {
                return res.status(403).json({
                    success: false,
                    error: 'API_ACCESS_FORBIDDEN',
                    message: 'API access restricted. This may be due to Development API Key limitations.',
                    details: 'Some player data may not be accessible with the current API key configuration.'
                });
            }
            if (error.response?.status === 429) {
                return res.status(429).json({
                    success: false,
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: 'API rate limit exceeded. Please try again in a moment.',
                    retryAfter: 60
                });
            }
        }
        // Handle timeout errors
        if (error instanceof Error && error.message.includes('timeout')) {
            return res.status(504).json({
                success: false,
                error: 'REQUEST_TIMEOUT',
                message: 'The request took too long to complete. Please try again.',
                details: 'The analysis is taking longer than expected. This might be due to high server load or rate limiting.'
            });
        }
        res.status(500).json({
            success: false,
            error: 'UNIFIED_ANALYSIS_ERROR',
            message: 'Failed to complete unified smurf analysis',
            details: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: new Date().toISOString()
        });
    }
});
// Analysis capabilities endpoint
app.get('/api/analysis/capabilities', async (req, res) => {
    try {
        const integrationStatus = await dataFetchingService.getIntegrationStatus();
        res.json({
            success: true,
            capabilities: {
                opggIntegration: {
                    enabled: integrationStatus.opggMcp.enabled,
                    connected: integrationStatus.opggMcp.connected,
                    features: integrationStatus.opggMcp.connected ? [
                        'Real-time summoner search',
                        'Enhanced match history analysis',
                        'Champion statistics',
                        'Performance benchmarking',
                        'Advanced smurf detection'
                    ] : ['Basic analysis only']
                },
                riotApiIntegration: {
                    enabled: integrationStatus.riotApi.enabled,
                    connected: integrationStatus.riotApi.connected,
                    features: ['Basic player lookup', 'Match history', 'Champion mastery']
                },
                analysisTypes: [
                    'enhanced_opgg',
                    'comprehensive',
                    'basic',
                    'mock_demo'
                ],
                supportedRegions: ['na1', 'euw1', 'eun1', 'kr', 'br1', 'la1', 'la2', 'oc1', 'tr1', 'ru', 'jp1']
            }
        });
    }
    catch (error) {
        loggerService_1.default.error('Error getting analysis capabilities:', error);
        res.status(500).json({
            success: false,
            error: {
                type: 'CAPABILITIES_ERROR',
                message: 'Failed to get analysis capabilities'
            }
        });
    }
});
// Register routes
// app.use('/api/analysis', analysisRoutes); // Commented out to avoid conflicts with new unified endpoint
// Debug endpoint to test Riot ID parsing
app.get('/api/debug/riot-id/:riotId', async (req, res) => {
    try {
        const { riotId } = req.params;
        loggerService_1.default.info(`🔍 Testing Riot ID parsing for: ${riotId}`);
        // Parse Riot ID
        const riotIdParts = RiotApi_1.RiotApi.parseRiotId(riotId);
        if (!riotIdParts) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_RIOT_ID',
                message: 'Invalid Riot ID format',
                input: riotId
            });
        }
        const { gameName, tagLine } = riotIdParts;
        try {
            // Try to get account data
            const accountData = await riotApi.getAccountByRiotId(gameName, tagLine);
            // Try to get summoner data
            const summonerData = await riotApi.getSummonerByRiotId(gameName, tagLine);
            res.json({
                success: true,
                input: riotId,
                parsed: {
                    gameName,
                    tagLine
                },
                account: accountData,
                summoner: summonerData,
                timestamp: new Date().toISOString()
            });
        }
        catch (apiError) {
            // Return parsing success but API error
            res.status(apiError.response?.status || 500).json({
                success: false,
                error: 'API_ERROR',
                message: apiError.message,
                input: riotId,
                parsed: {
                    gameName,
                    tagLine
                },
                apiErrorCode: apiError.response?.status,
                apiErrorData: apiError.response?.data
            });
        }
    }
    catch (error) {
        loggerService_1.default.error(`Error in Riot ID debug endpoint: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});
// Debug endpoint to check API status and configuration
app.get('/api/debug/status', async (req, res) => {
    try {
        const status = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '2.0.0',
            apiKey: process.env.RIOT_API_KEY ? 'Configured' : 'Missing',
            apiKeyLength: process.env.RIOT_API_KEY?.length || 0,
            apiKeyPrefix: process.env.RIOT_API_KEY?.substring(0, 4) || 'N/A',
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            endpoints: {
                '/api/analyze/unified/:riotId': 'Main unified analysis endpoint',
                '/api/analyze/comprehensive/:identifier': 'Comprehensive analysis endpoint',
                '/api/analyze/riot-id/:gameName/:tagLine': 'Dedicated Riot ID endpoint',
                '/api/debug/riot-id/:riotId': 'Debug endpoint for testing Riot ID parsing',
                '/api/debug/status': 'This endpoint (API status and configuration)'
            },
            cors: {
                enabled: true,
                allowedOrigins: [
                    'http://localhost:3000',
                    'https://lol-smurfguard.vercel.app',
                    /^https:\/\/lol-smurfguard-.*\.vercel\.app$/.toString(),
                    'https://smurfgaurd-production.up.railway.app',
                    /^https:\/\/.*-reis-projects-.*\.vercel\.app$/.toString()
                ]
            },
            loggers: {
                winston: !!loggerService_1.default,
                logtail: !!process.env.LOGTAIL_SOURCE_TOKEN,
                github: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO)
            }
        };
        res.json({
            success: true,
            status
        });
    }
    catch (error) {
        loggerService_1.default.error(`Error in debug status endpoint: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});
// Add logs endpoint to receive frontend logs
app.post('/api/logs', async (req, res) => {
    try {
        const { logs, metadata } = req.body;
        if (!logs || !Array.isArray(logs)) {
            return res.status(400).json({ error: 'Invalid log format' });
        }
        // Log each entry to the server logger
        logs.forEach((log) => {
            const { level, message, context, stack } = log;
            switch (level) {
                case 'debug':
                    loggerService_1.default.debug(message, { context, stack, source: 'frontend', metadata });
                    break;
                case 'info':
                    loggerService_1.default.info(message, { context, stack, source: 'frontend', metadata });
                    break;
                case 'warn':
                    loggerService_1.default.warn(message, { context, stack, source: 'frontend', metadata });
                    break;
                case 'error':
                    loggerService_1.default.error('Frontend Error:', {
                        message,
                        context,
                        stack,
                        source: 'frontend',
                        metadata
                    });
                    break;
            }
        });
        res.status(200).json({ success: true });
    }
    catch (error) {
        loggerService_1.default.error('Error processing frontend logs', error);
        res.status(500).json({ error: 'Failed to process logs' });
    }
});
// Global error handler
app.use((err, req, res, next) => {
    const message = err.message || 'Internal Server Error';
    const errorContext = {
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
        headers: req.headers,
        timestamp: new Date().toISOString()
    };
    loggerService_1.default.error('Unhandled Error:', {
        error: message,
        stack: err.stack,
        ...errorContext
    });
    res.status(500).json({
        status: 'error',
        code: 500,
        message
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            type: 'ENDPOINT_NOT_FOUND',
            message: `Endpoint ${req.originalUrl} not found`,
            availableEndpoints: [
                'GET /api/health',
                'GET /api/integration/status',
                'GET /api/analyze/opgg-enhanced/:summonerName',
                'GET /api/analyze/comprehensive/:identifier',
                'GET /api/analyze/basic/:summonerName',
                'GET /api/mock/challenger-demo',
                'GET /api/analysis/capabilities'
            ]
        }
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    loggerService_1.default.info('Received SIGTERM, shutting down gracefully...');
    await dataFetchingService.cleanup();
    process.exit(0);
});
process.on('SIGINT', async () => {
    loggerService_1.default.info('Received SIGINT, shutting down gracefully...');
    await dataFetchingService.cleanup();
    process.exit(0);
});
process.on('uncaughtException', (err) => {
    loggerService_1.default.error('Uncaught Exception:', { error: err.message, stack: err.stack });
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    loggerService_1.default.error('Unhandled Rejection:', { error: reason.message, stack: reason.stack });
    process.exit(1);
});
app.listen(PORT, () => {
    loggerService_1.default.info(`🚀 SmurfGuard API server running on port ${PORT}`, {
        metadata: {
            service: 'smurfguard-api',
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version,
            timestamp: new Date().toISOString()
        }
    });
    loggerService_1.default.info(`📊 Features: OP.GG MCP Integration, Enhanced Analysis, Real-time Detection`);
    loggerService_1.default.info(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    loggerService_1.default.info(`⚡ Integration Status: http://localhost:${PORT}/api/integration/status`);
});
