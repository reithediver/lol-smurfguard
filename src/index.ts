import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/loggerService';
import { errorHandler } from './utils/errorHandler';
import { healthChecker } from './utils/health-check';
import { performanceMiddleware, performanceMonitor } from './utils/performance-monitor';
import { LimitedAccessService } from './services/LimitedAccessService';
import { RiotApi } from './api/RiotApi';
import { SmurfDetectionService } from './services/SmurfDetectionService';
import { ChampionService } from './services/ChampionService';
import { ChallengerService } from './services/ChallengerService';

// Load environment variables
dotenv.config();

// Check for API key
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(performanceMiddleware);

// Initialize services
const riotApi = new RiotApi(apiKey, 'na1');
const smurfDetectionService = new SmurfDetectionService(riotApi);
const limitedAccessService = new LimitedAccessService(apiKey, 'na1');
const championService = new ChampionService(apiKey, 'na1');
const challengerService = new ChallengerService(apiKey, 'na1');

// Setup API routes
app.get('/api/health', async (req, res, next) => {
  try {
    const healthResult = await healthChecker.performHealthCheck();
    const statusCode = healthResult.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthResult);
  } catch (error) {
    next(error);
  }
});

// Basic health endpoint for load balancers
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Performance metrics endpoints
app.get('/api/metrics', (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  const detailedStats = performanceMonitor.getDetailedStats();
  
  res.json({
    ...metrics,
    detailedStats,
    timestamp: new Date().toISOString()
  });
});

// Prometheus-compatible metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(performanceMonitor.getPrometheusMetrics());
});

// Main initialization function
async function initializeApp() {
  try {
    // Check API permissions
    logger.info('Checking API key permissions...');
    const permissions = await limitedAccessService.checkApiAccess();
    
    // Add a check for Personal API Key vs Development API Key
    if (permissions.canAccessSummonerData) {
      logger.info('🔑 You are using a Personal API Key with full permissions.');
    } else {
      logger.warn('⚠️ You are using a Development API Key with limited permissions.');
      logger.warn('To get full access, apply for a Personal API Key at: https://developer.riotgames.com/app-type');
    }
    
    // Set up appropriate routes based on permissions
    if (permissions.canAccessSummonerData && permissions.canAccessMatchData) {
      logger.info('Full API access detected. Setting up smurf detection endpoints...');
      
      // Endpoint for analyzing a summoner
      app.get('/api/analyze/:summonerName', async (req, res, next) => {
        try {
          const { summonerName } = req.params;
          const analysis = await smurfDetectionService.analyzePlayer(summonerName);
          res.json(analysis);
        } catch (error) {
          next(error);
        }
      });
      
    } else {
      logger.warn('Limited API access detected. Setting up alternative endpoints...');
      
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
          } catch (error) {
            next(error);
          }
        });
        
        // Track champion rotation changes
        app.get('/api/champions/rotation/changes', async (req, res, next) => {
          try {
            const changes = await championService.trackRotationChanges();
            res.json(changes);
          } catch (error) {
            next(error);
          }
        });
      }
      
      // Challenger league endpoints
      if (permissions.canAccessChallengerData) {
        // Get top challenger players
        app.get('/api/challengers/top', async (req, res, next) => {
          try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const challengers = await challengerService.getTopChallengers(limit);
            res.json(challengers);
          } catch (error) {
            next(error);
          }
        });
        
        // Track challenger movement
        app.get('/api/challengers/movement', async (req, res, next) => {
          try {
            const movement = await challengerService.trackChallengerMovement();
            res.json(movement);
          } catch (error) {
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
          } catch (error) {
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
          } catch (error) {
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
    app.use(errorHandler);
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Available API permissions:`);
      logger.info(`- Platform Data: ${permissions.canAccessPlatformData ? '✅' : '❌'}`);
      logger.info(`- Champion Rotation: ${permissions.canAccessChampionRotation ? '✅' : '❌'}`);
      logger.info(`- Challenger Data: ${permissions.canAccessChallengerData ? '✅' : '❌'}`);
      logger.info(`- Summoner Data: ${permissions.canAccessSummonerData ? '✅' : '❌'}`);
      logger.info(`- Match Data: ${permissions.canAccessMatchData ? '✅' : '❌'}`);
      
      if (permissions.canAccessSummonerData && permissions.canAccessMatchData) {
        logger.info(`Full smurf detection is available at: http://localhost:${PORT}/api/analyze/{summonerName}`);
      } else {
        logger.info(`Limited functionality available at: http://localhost:${PORT}/api/limitations`);
        if (permissions.canAccessChampionRotation) {
          logger.info(`Champion rotation data available at: http://localhost:${PORT}/api/champions/rotation`);
        }
        if (permissions.canAccessChallengerData) {
          logger.info(`Challenger league data available at: http://localhost:${PORT}/api/challengers/top`);
        }
      }
    });
    
  } catch (error) {
    logger.error('Error initializing application:', error);
    process.exit(1);
  }
}

// Initialize the application
initializeApp(); 