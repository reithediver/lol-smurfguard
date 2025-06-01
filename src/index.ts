import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/loggerService';
import { errorHandler } from './utils/errorHandler';
import { LimitedAccessService } from './services/LimitedAccessService';
import { RiotApi } from './api/RiotApi';
import { SmurfDetectionService } from './services/SmurfDetectionService';

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

// Initialize services
const riotApi = new RiotApi(apiKey, 'na1');
const smurfDetectionService = new SmurfDetectionService(riotApi);
const limitedAccessService = new LimitedAccessService(apiKey, 'na1');

// Setup API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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
      
      // Add available endpoints based on permissions
      if (permissions.canAccessChallengerData) {
        app.get('/api/challengers', async (req, res, next) => {
          try {
            const challengers = await limitedAccessService.getChallengerPlayers();
            res.json({
              count: challengers.length,
              players: challengers.sort((a, b) => b.leaguePoints - a.leaguePoints).slice(0, 20)
            });
          } catch (error) {
            next(error);
          }
        });
      }
      
      if (permissions.canAccessChampionRotation) {
        app.get('/api/rotation', async (req, res, next) => {
          try {
            const rotation = await limitedAccessService.getChampionRotation();
            res.json(rotation);
          } catch (error) {
            next(error);
          }
        });
      }
      
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
            { endpoint: '/api/challengers', description: 'View top challenger players' },
            { endpoint: '/api/rotation', description: 'View free champion rotation' },
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
        logger.info(`Limited functionality available. Access available endpoints at: http://localhost:${PORT}/api/limitations`);
      }
    });
    
  } catch (error) {
    logger.error('Error initializing application:', error);
    process.exit(1);
  }
}

// Initialize the application
initializeApp(); 