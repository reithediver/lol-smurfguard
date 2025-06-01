"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const loggerService_1 = require("./utils/loggerService");
const errorHandler_1 = require("./utils/errorHandler");
const health_check_1 = require("./utils/health-check");
const performance_monitor_1 = require("./utils/performance-monitor");
const LimitedAccessService_1 = require("./services/LimitedAccessService");
const RiotApi_1 = require("./api/RiotApi");
const SmurfDetectionService_1 = require("./services/SmurfDetectionService");
const ChampionService_1 = require("./services/ChampionService");
const ChallengerService_1 = require("./services/ChallengerService");
// Load environment variables
dotenv_1.default.config();
// Check for API key
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
    loggerService_1.logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
    process.exit(1);
}
// Initialize Express
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(performance_monitor_1.performanceMiddleware);
// Initialize services
const riotApi = new RiotApi_1.RiotApi(apiKey, 'na1');
const smurfDetectionService = new SmurfDetectionService_1.SmurfDetectionService(riotApi);
const limitedAccessService = new LimitedAccessService_1.LimitedAccessService(apiKey, 'na1');
const championService = new ChampionService_1.ChampionService(apiKey, 'na1');
const challengerService = new ChallengerService_1.ChallengerService(apiKey, 'na1');
// Setup API routes
app.get('/api/health', async (req, res, next) => {
    try {
        const healthResult = await health_check_1.healthChecker.performHealthCheck();
        const statusCode = healthResult.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(healthResult);
    }
    catch (error) {
        next(error);
    }
});
// Basic health endpoint for load balancers
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Performance metrics endpoints
app.get('/api/metrics', (req, res) => {
    const metrics = performance_monitor_1.performanceMonitor.getMetrics();
    const detailedStats = performance_monitor_1.performanceMonitor.getDetailedStats();
    res.json({
        ...metrics,
        detailedStats,
        timestamp: new Date().toISOString()
    });
});
// Prometheus-compatible metrics endpoint
app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(performance_monitor_1.performanceMonitor.getPrometheusMetrics());
});
// Main initialization function
async function initializeApp() {
    try {
        // Check API permissions
        loggerService_1.logger.info('Checking API key permissions...');
        const permissions = await limitedAccessService.checkApiAccess();
        // Add a check for Personal API Key vs Development API Key
        if (permissions.canAccessSummonerData) {
            loggerService_1.logger.info('🔑 You are using a Personal API Key with full permissions.');
        }
        else {
            loggerService_1.logger.warn('⚠️ You are using a Development API Key with limited permissions.');
            loggerService_1.logger.warn('To get full access, apply for a Personal API Key at: https://developer.riotgames.com/app-type');
        }
        // Set up appropriate routes based on permissions
        if (permissions.canAccessSummonerData && permissions.canAccessMatchData) {
            loggerService_1.logger.info('Full API access detected. Setting up smurf detection endpoints...');
            // Endpoint for analyzing a summoner
            app.get('/api/analyze/:summonerName', async (req, res, next) => {
                try {
                    const { summonerName } = req.params;
                    const analysis = await smurfDetectionService.analyzePlayer(summonerName);
                    res.json(analysis);
                }
                catch (error) {
                    next(error);
                }
            });
        }
        else {
            loggerService_1.logger.warn('Limited API access detected. Setting up alternative endpoints...');
            // Add informational endpoint about API limitations
            app.get('/api/limitations', (req, res) => {
                res.json({
                    message: 'Limited API access detected',
                    canAccessSummonerData: permissions.canAccessSummonerData,
                    canAccessMatchData: permissions.canAccessMatchData,
                    canAccessChallengerData: permissions.canAccessChallengerData,
                    canAccessChampionRotation: permissions.canAccessChampionRotation,
                    canAccessPlatformData: permissions.canAccessPlatformData,
                    howToFix: 'To enable full functionality, apply for a production API key at: https://developer.riotgames.com/app-type'
                });
            });
            // Champion rotation endpoints
            if (permissions.canAccessChampionRotation) {
                // Get current champion rotation
                app.get('/api/champions/rotation', async (req, res, next) => {
                    try {
                        const rotation = await championService.getChampionRotation();
                        res.json(rotation);
                    }
                    catch (error) {
                        next(error);
                    }
                });
                // Track champion rotation changes
                app.get('/api/champions/rotation/changes', async (req, res, next) => {
                    try {
                        const changes = await championService.trackRotationChanges();
                        res.json(changes);
                    }
                    catch (error) {
                        next(error);
                    }
                });
            }
            // Challenger league endpoints
            if (permissions.canAccessChallengerData) {
                // Get top challenger players
                app.get('/api/challengers/top', async (req, res, next) => {
                    try {
                        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                        const challengers = await challengerService.getTopChallengers(limit);
                        res.json(challengers);
                    }
                    catch (error) {
                        next(error);
                    }
                });
                // Track challenger movement
                app.get('/api/challengers/movement', async (req, res, next) => {
                    try {
                        const movement = await challengerService.trackChallengerMovement();
                        res.json(movement);
                    }
                    catch (error) {
                        next(error);
                    }
                });
                // Analyze a specific challenger player
                app.get('/api/challengers/player/:playerId', async (req, res, next) => {
                    try {
                        const { playerId } = req.params;
                        const analysis = await challengerService.analyzePlayer(playerId);
                        if (!analysis) {
                            return res.status(404).json({
                                error: 'Player not found',
                                message: 'The player ID provided was not found in the challenger league'
                            });
                        }
                        res.json(analysis);
                    }
                    catch (error) {
                        next(error);
                    }
                });
            }
            // Platform status endpoint
            if (permissions.canAccessPlatformData) {
                app.get('/api/platform', async (req, res, next) => {
                    try {
                        const platform = await limitedAccessService.getPlatformStatus();
                        res.json(platform);
                    }
                    catch (error) {
                        next(error);
                    }
                });
            }
            // Add placeholder for the analyze endpoint
            app.get('/api/analyze/:summonerName', (req, res) => {
                res.status(403).json({
                    error: 'API key limitations',
                    message: 'Your current API key does not have permission to analyze summoners',
                    summonerName: req.params.summonerName,
                    alternatives: [
                        { endpoint: '/api/challengers/top', description: 'View top challenger players' },
                        { endpoint: '/api/challengers/movement', description: 'Track movement in challenger league' },
                        { endpoint: '/api/champions/rotation', description: 'View free champion rotation' },
                        { endpoint: '/api/champions/rotation/changes', description: 'Track champion rotation changes' },
                        { endpoint: '/api/platform', description: 'View platform status' },
                        { endpoint: '/api/limitations', description: 'View current API key limitations' }
                    ]
                });
            });
        }
        // Error handling middleware
        app.use(errorHandler_1.errorHandler);
        // Start the server
        app.listen(PORT, () => {
            loggerService_1.logger.info(`Server running on port ${PORT}`);
            loggerService_1.logger.info(`Available API permissions:`);
            loggerService_1.logger.info(`- Platform Data: ${permissions.canAccessPlatformData ? '✅' : '❌'}`);
            loggerService_1.logger.info(`- Champion Rotation: ${permissions.canAccessChampionRotation ? '✅' : '❌'}`);
            loggerService_1.logger.info(`- Challenger Data: ${permissions.canAccessChallengerData ? '✅' : '❌'}`);
            loggerService_1.logger.info(`- Summoner Data: ${permissions.canAccessSummonerData ? '✅' : '❌'}`);
            loggerService_1.logger.info(`- Match Data: ${permissions.canAccessMatchData ? '✅' : '❌'}`);
            if (permissions.canAccessSummonerData && permissions.canAccessMatchData) {
                loggerService_1.logger.info(`Full smurf detection is available at: http://localhost:${PORT}/api/analyze/{summonerName}`);
            }
            else {
                loggerService_1.logger.info(`Limited functionality available at: http://localhost:${PORT}/api/limitations`);
                if (permissions.canAccessChampionRotation) {
                    loggerService_1.logger.info(`Champion rotation data available at: http://localhost:${PORT}/api/champions/rotation`);
                }
                if (permissions.canAccessChallengerData) {
                    loggerService_1.logger.info(`Challenger league data available at: http://localhost:${PORT}/api/challengers/top`);
                }
            }
        });
    }
    catch (error) {
        loggerService_1.logger.error('Error initializing application:', error);
        process.exit(1);
    }
}
// Initialize the application
initializeApp();
