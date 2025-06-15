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
const loggerService_1 = require("./utils/loggerService");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Initialize services
const riotApi = new RiotApi_1.RiotApi(process.env.RIOT_API_KEY || 'demo-key');
const dataFetchingService = new DataFetchingService_1.DataFetchingService();
const smurfDetectionService = new SmurfDetectionService_1.SmurfDetectionService(riotApi);
// Middleware
app.use((0, cors_1.default)());
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
                serviceName: 'Riot API + Mock Data Fallback',
                features: ['Basic Analysis', 'Mock Data', 'Riot API Integration'],
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
        loggerService_1.logger.error('Error getting integration status:', error);
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
        loggerService_1.logger.info(`Enhanced OP.GG analysis request for ${summonerName} in ${region}`);
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
        loggerService_1.logger.error(`Enhanced analysis error for ${req.params.summonerName}:`, error);
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
        loggerService_1.logger.info(`Basic analysis request for ${summonerName} in ${region}`);
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
        loggerService_1.logger.error(`Basic analysis error for ${req.params.summonerName}:`, error);
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
        loggerService_1.logger.info(`Comprehensive analysis request for ${identifier} in ${region}`);
        // Check if identifier is a Riot ID (contains #) or legacy summoner name
        const riotIdParts = RiotApi_1.RiotApi.parseRiotId(identifier);
        let analysis;
        if (riotIdParts) {
            // Modern Riot ID format (gameName#tagLine)
            loggerService_1.logger.info(`Using modern Riot ID format: ${riotIdParts.gameName}#${riotIdParts.tagLine}`);
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
                loggerService_1.logger.warn('Riot ID analysis failed, trying fallback methods:', riotIdError);
                throw riotIdError;
            }
        }
        else {
            // Legacy summoner name format
            loggerService_1.logger.info(`Using legacy summoner name format: ${identifier}`);
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
                loggerService_1.logger.warn('Enhanced analysis failed, falling back to basic:', enhancedError);
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
        loggerService_1.logger.error(`Comprehensive analysis error for ${req.params.identifier}:`, error);
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
        loggerService_1.logger.info(`Riot ID analysis request for ${gameName}#${tagLine} in ${region}`);
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
        loggerService_1.logger.error(`Riot ID analysis error for ${req.params.gameName}#${req.params.tagLine}:`, error);
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
// Mock demo endpoint
app.get('/api/mock/challenger-demo', (req, res) => {
    loggerService_1.logger.info('Challenger demo data requested');
    res.json({
        success: true,
        mockData: true,
        message: 'Mock challenger data for frontend/backend testing (Railway backend)',
        data: {
            analysis: [
                {
                    summonerId: 'mock-summoner-1',
                    summonerName: 'FakerKR',
                    rank: 1,
                    leaguePoints: 1247,
                    wins: 234,
                    losses: 45,
                    winRate: '83.9',
                    veteran: true,
                    hotStreak: true,
                    freshBlood: false,
                    smurfAnalysis: {
                        probability: 19.4,
                        confidence: 92.1,
                        indicators: ['Consistent high-level play', 'Established veteran account'],
                        verdict: 'Legitimate high-skill player'
                    }
                }
            ]
        }
    });
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
        loggerService_1.logger.error('Error getting analysis capabilities:', error);
        res.status(500).json({
            success: false,
            error: {
                type: 'CAPABILITIES_ERROR',
                message: 'Failed to get analysis capabilities'
            }
        });
    }
});
// Global error handler
app.use((error, req, res, next) => {
    loggerService_1.logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: {
            type: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString()
        }
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
    loggerService_1.logger.info('Received SIGTERM, shutting down gracefully...');
    await dataFetchingService.cleanup();
    process.exit(0);
});
process.on('SIGINT', async () => {
    loggerService_1.logger.info('Received SIGINT, shutting down gracefully...');
    await dataFetchingService.cleanup();
    process.exit(0);
});
app.listen(PORT, () => {
    loggerService_1.logger.info(`🚀 SmurfGuard API server running on port ${PORT}`);
    loggerService_1.logger.info(`📊 Features: OP.GG MCP Integration, Enhanced Analysis, Real-time Detection`);
    loggerService_1.logger.info(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    loggerService_1.logger.info(`⚡ Integration Status: http://localhost:${PORT}/api/integration/status`);
});
