import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { RiotApi } from './api/RiotApi';
import { DataFetchingService } from './services/DataFetchingService';
import { SmurfDetectionService } from './services/SmurfDetectionService';
import { logger } from './utils/loggerService';
import { createError } from './utils/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const riotApi = new RiotApi(process.env.RIOT_API_KEY || 'demo-key');
const dataFetchingService = new DataFetchingService();
const smurfDetectionService = new SmurfDetectionService(riotApi);

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
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
        opggEnabled: integrationStatus.opggMcp.enabled && integrationStatus.opggMcp.connected,
        serviceName: integrationStatus.opggMcp.connected 
          ? 'OP.GG MCP + Riot API Fallback' 
          : 'Riot API + Mock Data Fallback',
        features: integrationStatus.opggMcp.connected 
          ? ['Real OP.GG Data', 'Enhanced Analysis', 'Champion Statistics', 'Match History', 'Summoner Search']
          : ['Basic Analysis', 'Mock Data', 'Riot API Integration'],
        mcpTools: integrationStatus.opggMcp.tools,
        dataQuality: integrationStatus.opggMcp.connected ? 'High' : 'Limited',
        limitations: integrationStatus.opggMcp.connected ? [] : [
          'OP.GG MCP server not available',
          'Using fallback data sources'
        ]
      }
    });
  } catch (error) {
    logger.error('Error getting integration status:', error);
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
    const region = req.query.region as string || 'na1';

    logger.info(`Enhanced OP.GG analysis request for ${summonerName} in ${region}`);

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

  } catch (error) {
    logger.error(`Enhanced analysis error for ${req.params.summonerName}:`, error);
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
    const region = req.query.region as string || 'na1';

    logger.info(`Basic analysis request for ${summonerName} in ${region}`);

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

  } catch (error) {
    logger.error(`Basic analysis error for ${req.params.summonerName}:`, error);
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

// Comprehensive analysis endpoint
app.get('/api/analyze/comprehensive/:summonerName', async (req, res) => {
  try {
    const { summonerName } = req.params;
    const region = req.query.region as string || 'na1';

    logger.info(`Comprehensive analysis request for ${summonerName} in ${region}`);

    // Try enhanced analysis first, fall back to basic
    try {
      const enhancedAnalysis = await dataFetchingService.getEnhancedPlayerAnalysis(summonerName, region);
      res.json({
        success: true,
        data: enhancedAnalysis,
        metadata: {
          analysisType: 'comprehensive_enhanced',
          requestTimestamp: new Date().toISOString()
        }
      });
    } catch (enhancedError) {
      logger.warn('Enhanced analysis failed, falling back to basic:', enhancedError);
      const basicAnalysis = await dataFetchingService.fetchPlayerAnalysis(summonerName);
      res.json({
        success: true,
        data: basicAnalysis,
        metadata: {
          analysisType: 'comprehensive_basic_fallback',
          requestTimestamp: new Date().toISOString(),
          fallbackReason: 'Enhanced analysis unavailable'
        }
      });
    }

  } catch (error) {
    logger.error(`Comprehensive analysis error for ${req.params.summonerName}:`, error);
    res.status(403).json({
      success: false,
      error: 'API_ACCESS_FORBIDDEN',
      message: `Cannot access player data for "${req.params.summonerName}". This is likely due to API restrictions on famous players.`,
      details: 'Request failed with status code 403',
      suggestions: [
        'Try searching for a less well-known summoner name',
        'Visit the Demo tab to see working examples with challenger data',
        'Use the OP.GG Enhanced analysis for better results'
      ]
    });
  }
});

// Mock demo endpoint
app.get('/api/mock/challenger-demo', (req, res) => {
  logger.info('Challenger demo data requested');
  
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
  } catch (error) {
    logger.error('Error getting analysis capabilities:', error);
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
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  
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
        'GET /api/analyze/comprehensive/:summonerName',
        'GET /api/analyze/basic/:summonerName',
        'GET /api/mock/challenger-demo',
        'GET /api/analysis/capabilities'
      ]
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await dataFetchingService.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await dataFetchingService.cleanup();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`🚀 SmurfGuard API server running on port ${PORT}`);
  logger.info(`📊 Features: OP.GG MCP Integration, Enhanced Analysis, Real-time Detection`);
  logger.info(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`⚡ Integration Status: http://localhost:${PORT}/api/integration/status`);
}); 