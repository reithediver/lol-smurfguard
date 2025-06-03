import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/loggerService';
import { errorHandler } from './utils/errorHandler';
import { healthChecker } from './utils/health-check';
import { performanceMiddleware, performanceMonitor } from './utils/performance-monitor';
import { ApiKeyValidator } from './utils/api-key-validator';
import { LimitedAccessService } from './services/LimitedAccessService';
import { RiotApi } from './api/RiotApi';
import { SmurfDetectionService } from './services/SmurfDetectionService';
import { ChampionService } from './services/ChampionService';
import { ChallengerService } from './services/ChallengerService';
import { AdvancedDataService } from './services/AdvancedDataService';
import { RankBenchmarkService } from './services/RankBenchmarkService';
import { PlaystyleAnalysisService } from './services/PlaystyleAnalysisService';
import { HybridAnalysisService } from './services/HybridAnalysisService';
import { DataFetchingService } from './services/DataFetchingService';
import { OpggDataAdapter } from './services/OpggDataAdapter';
// import { EnhancedAnalysisService } from './services/EnhancedAnalysisService'; // Temporarily disabled due to TypeScript errors

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
const apiKeyValidator = new ApiKeyValidator(apiKey);

// Initialize the new advanced analysis services
const rankBenchmarkService = new RankBenchmarkService();
const playstyleAnalysisService = new PlaystyleAnalysisService();
const hybridAnalysisService = new HybridAnalysisService(apiKey);

// Initialize OP.GG integration services
const dataFetchingService = new DataFetchingService(riotApi);
const opggAdapter = new OpggDataAdapter();

// Log OP.GG integration status
const opggStatus = dataFetchingService.getIntegrationStatus();
logger.info(`OP.GG Integration Status: ${opggStatus.serviceName}`);
logger.info(`OP.GG Features: ${opggStatus.features.join(', ')}`);
if (opggStatus.limitations.length > 0) {
  logger.warn(`OP.GG Limitations: ${opggStatus.limitations.join(', ')}`);
}

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

// API Key validation endpoints
app.get('/api/validate-key', async (req, res, next) => {
  try {
    logger.info('🔍 API key validation requested');
    const validation = await apiKeyValidator.validateApiKey();
    res.json(validation);
  } catch (error) {
    next(error);
  }
});

// Quick API key validation for monitoring
app.get('/api/validate-key/quick', async (req, res, next) => {
  try {
    const validation = await apiKeyValidator.quickValidation();
    res.json(validation);
  } catch (error) {
    next(error);
  }
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

// Advanced Smurf Analysis with Rank Benchmarking and Playstyle Detection
app.get('/api/analyze/advanced-smurf/:summonerName', async (req, res) => {
  const { summonerName } = req.params;
  const { analysisType = 'hybrid' } = req.query; // 'quick', 'deep', or 'hybrid'
  const startTime = Date.now();

  try {
    logger.info(`🔍 Advanced smurf analysis requested for: ${summonerName} (${analysisType} mode)`);
    
    // Get basic summoner info
    const summoner = await riotApi.getSummonerByName(summonerName);
    const matchHistory = await riotApi.getMatchHistory(summoner.puuid, 100);
    
    // Perform the advanced analysis based on requested type
    let analysisResult;
    switch (analysisType) {
      case 'quick':
        analysisResult = await hybridAnalysisService.performQuickAnalysis(summonerName, 'na1');
        break;
      case 'deep':
        analysisResult = await hybridAnalysisService.performDeepAnalysis(summonerName, 'na1');
        break;
      case 'hybrid':
      default:
        analysisResult = await hybridAnalysisService.performHybridAnalysis(summonerName, 'na1');
        break;
    }

    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, false);
    
    res.json({
      success: true,
      data: {
        summonerName,
        level: summoner.summonerLevel,
        ...analysisResult,
        analysisMetadata: {
          analysisType,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          gamesAnalyzed: matchHistory.length,
          features: [
            'Rank-based performance benchmarking',
            'Role-specific suspicious behavior detection',
            'Playstyle evolution tracking',
            'Account switching pattern analysis',
            'Champion mastery anomaly detection',
            'Performance outlier identification'
          ]
        }
      }
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, true);
    
    logger.error(`Error in advanced smurf analysis for ${summonerName}:`, error);
    
    // Use the specific status code from the service error, or default to 500
    const statusCode = error.statusCode || error.response?.status || 500;
    const errorMessage = error.message || 'Failed to perform advanced smurf analysis';
    
    // Map error codes to user-friendly responses
    let userMessage = errorMessage;
    let errorCode = 'ADVANCED_SMURF_ANALYSIS_FAILED';
    
    switch (statusCode) {
      case 403:
        errorCode = 'API_ACCESS_FORBIDDEN';
        userMessage = `Cannot access player data for "${summonerName}". The Development API key has restrictions on famous players.`;
        break;
      case 404:
        errorCode = 'PLAYER_NOT_FOUND';
        userMessage = `Player "${summonerName}" not found. Please check the spelling and ensure they exist in the NA region.`;
        break;
      case 429:
        errorCode = 'RATE_LIMIT_EXCEEDED';
        userMessage = 'API rate limit exceeded. Please wait a moment and try again.';
        break;
      case 503:
        errorCode = 'SERVICE_UNAVAILABLE';
        userMessage = 'Riot API is currently unavailable. Please try again later.';
        break;
      default:
        userMessage = 'Advanced analysis failed due to an unexpected error.';
        break;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: userMessage,
      details: errorMessage,
      suggestions: statusCode === 403 ? [
        'Try searching for a less well-known summoner name',
        'Visit the Demo tab to see the analysis system working',
        'Famous players (Faker, Doublelift, etc.) are restricted by Riot API'
      ] : undefined
    });
  }
});

// Detailed Champion Performance Analysis with Outlier Detection
app.get('/api/analyze/champion-outliers/:summonerName', async (req, res) => {
  const { summonerName } = req.params;
  const startTime = Date.now();

  try {
    logger.info(`🎯 Champion outlier analysis requested for: ${summonerName}`);
    
    const summoner = await riotApi.getSummonerByName(summonerName);
    const matchHistory = await riotApi.getMatchHistory(summoner.puuid, 200);
    
    // Get basic player metrics for rank comparison
    const recentMatches = matchHistory.slice(0, 50);
    const playerMetrics = {
      csPerMin: 0,
      kda: 0,
      killParticipation: 0,
      visionScore: 0,
      primaryRole: 'MIDDLE' // Default, would be determined from match data
    };
    
    // Calculate metrics from recent matches
    if (recentMatches.length > 0) {
      let totalCs = 0, totalKDA = 0, totalKP = 0, totalVision = 0, totalMinutes = 0;
      
      recentMatches.forEach((match: any) => {
        const participant = match.info?.participants?.find((p: any) => p.puuid === summoner.puuid);
        if (participant) {
          const gameDuration = match.info.gameDuration / 60;
          totalCs += (participant.totalMinionsKilled + participant.neutralMinionsKilled);
          totalKDA += participant.deaths > 0 ? (participant.kills + participant.assists) / participant.deaths : participant.kills + participant.assists;
          totalKP += participant.challenges?.killParticipation || 0;
          totalVision += participant.visionScore || 0;
          totalMinutes += gameDuration;
        }
      });
      
      playerMetrics.csPerMin = totalMinutes > 0 ? totalCs / totalMinutes : 0;
      playerMetrics.kda = totalKDA / recentMatches.length;
      playerMetrics.killParticipation = (totalKP / recentMatches.length) * 100;
      playerMetrics.visionScore = totalVision / recentMatches.length;
    }
    
    // Analyze each champion's performance vs rank benchmarks
    const championAnalysis = rankBenchmarkService.comparePlayerToRank(
      playerMetrics,
      playerMetrics.primaryRole,
      'GOLD' // Default rank, would be fetched from ranked data
    );
    
    const playstyleEvolution = await playstyleAnalysisService.analyzePlaystyleEvolution(matchHistory);
    
    // Combine and identify outliers
    const outlierAnalysis = {
      performanceOutliers: championAnalysis.filter((comparison: any) => 
        comparison.suspiciousLevel > 70 || comparison.percentile > 95
      ),
      playstyleShifts: playstyleEvolution.playstyleShifts.filter((shift: any) => 
        shift.type === 'dramatic' || shift.type === 'sudden'
      ),
      championMasteryAnomalies: playstyleEvolution.championEvolution.filter((champion: any) =>
        champion.suspicionFlags.tooGoodTooFast || 
        champion.suspicionFlags.suddenExpertise
      ),
      summary: {
        totalChampionsAnalyzed: playstyleEvolution.championEvolution.length,
        suspiciousPerformanceCount: championAnalysis.filter((c: any) => c.suspiciousLevel > 70).length,
        outlierPerformanceCount: championAnalysis.filter((c: any) => c.percentile > 95).length,
        dramaticShiftsDetected: playstyleEvolution.playstyleShifts.filter((s: any) => s.type === 'dramatic').length,
        overallSuspicionScore: playstyleEvolution.overallSuspicionScore
      }
    };

    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, false);
    
    res.json({
      success: true,
      data: outlierAnalysis,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        analysisDepth: 'comprehensive-outlier-detection'
      }
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, true);
    
    logger.error(`Error in champion outlier analysis for ${summonerName}:`, error);
    
    // Use the specific status code from the service error, or default to 500
    const statusCode = error.statusCode || error.response?.status || 500;
    const errorMessage = error.message || 'Failed to perform champion outlier analysis';
    
    // Map error codes to user-friendly responses
    let userMessage = errorMessage;
    let errorCode = 'CHAMPION_OUTLIER_ANALYSIS_FAILED';
    
    switch (statusCode) {
      case 403:
        errorCode = 'API_ACCESS_FORBIDDEN';
        userMessage = `Cannot access player data for "${summonerName}". The Development API key has restrictions on famous players.`;
        break;
      case 404:
        errorCode = 'PLAYER_NOT_FOUND';
        userMessage = `Player "${summonerName}" not found. Please check the spelling and ensure they exist in the NA region.`;
        break;
      case 429:
        errorCode = 'RATE_LIMIT_EXCEEDED';
        userMessage = 'API rate limit exceeded. Please wait a moment and try again.';
        break;
      case 503:
        errorCode = 'SERVICE_UNAVAILABLE';
        userMessage = 'Riot API is currently unavailable. Please try again later.';
        break;
      default:
        userMessage = 'Champion outlier analysis failed due to an unexpected error.';
        break;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: userMessage,
      details: errorMessage,
      suggestions: statusCode === 403 ? [
        'Try searching for a less well-known summoner name',
        'Visit the Demo tab to see the analysis system working',
        'Famous players (Faker, Doublelift, etc.) are restricted by Riot API'
      ] : undefined
    });
  }
});

// Quick Analysis Endpoint (for current development API key)
app.get('/api/analyze/basic/:summonerName', async (req, res) => {
  const { summonerName } = req.params;
  const startTime = Date.now();

  try {
    logger.info(`🔍 Basic analysis requested for: ${summonerName}`);
    
    // Use existing SmurfDetectionService for basic analysis
    const basicAnalysis = await smurfDetectionService.analyzePlayer(summonerName);
    
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, false);
    
    res.json({
      success: true,
      data: basicAnalysis,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        analysisType: 'basic',
        note: 'Upgrade to Personal API key for comprehensive analysis'
      }
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, true);
    
    logger.error(`Error in basic analysis for ${summonerName}:`, error);
    
    // Use the specific status code from the service error, or default to 500
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || 'Failed to perform basic analysis';
    
    // Map error codes to user-friendly responses
    let userMessage = errorMessage;
    let errorCode = 'BASIC_ANALYSIS_FAILED';
    
    switch (statusCode) {
      case 403:
        errorCode = 'API_ACCESS_FORBIDDEN';
        userMessage = `Cannot access player data for "${summonerName}". The Development API key has restrictions on famous players.`;
        break;
      case 404:
        errorCode = 'PLAYER_NOT_FOUND';
        userMessage = `Player "${summonerName}" not found. Please check the spelling and ensure they exist in the NA region.`;
        break;
      case 429:
        errorCode = 'RATE_LIMIT_EXCEEDED';
        userMessage = 'API rate limit exceeded. Please wait a moment and try again.';
        break;
      case 503:
        errorCode = 'SERVICE_UNAVAILABLE';
        userMessage = 'Riot API is currently unavailable. Please try again later.';
        break;
      default:
        userMessage = 'Analysis failed due to an unexpected error.';
        break;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: userMessage,
      details: errorMessage,
      suggestions: statusCode === 403 ? [
        'Try searching for a less well-known summoner name',
        'Visit the Demo tab to see the analysis system working',
        'Famous players (Faker, Doublelift, etc.) are restricted by Riot API'
      ] : undefined
    });
  }
});

// Historical Data Analysis Endpoint
app.get('/api/analyze/historical/:summonerName', async (req, res) => {
  const { summonerName } = req.params;
  const { timespan = '12' } = req.query; // months
  const startTime = Date.now();

  try {
    logger.info(`📚 Historical analysis requested for: ${summonerName} (${timespan} months)`);
    logger.info('🕳️ Focusing on enhanced gap analysis and account switching detection...');
    
    const advancedService = new AdvancedDataService(riotApi);
    const analysis = await advancedService.analyzePlayerComprehensively(summonerName);
    
    // Focus on historical aspects with enhanced gap analysis
    const historicalReport = {
      summonerName,
      timespan: `${timespan} months`,
      accountAge: analysis.historicalAnalysis.accountAge,
      playHistory: analysis.historicalAnalysis.playHistory,
      enhancedGapAnalysis: {
        totalGaps: analysis.historicalAnalysis.playtimeAnalysis.gaps.length,
        suspiciousGaps: analysis.historicalAnalysis.playtimeAnalysis.gaps.filter(gap => 
          gap.suspicionLevel === 'high' || gap.suspicionLevel === 'extreme'
        ),
        accountSwitchingProbability: analysis.historicalAnalysis.playtimeAnalysis.gaps.reduce((max, gap) => 
          Math.max(max, gap.accountSwitchProbability || 0), 0
        ),
        gapCategories: {
          minor: analysis.historicalAnalysis.playtimeAnalysis.gaps.filter(g => g.gapCategory === 'Minor Gap').length,
          moderate: analysis.historicalAnalysis.playtimeAnalysis.gaps.filter(g => g.gapCategory === 'Moderate Gap').length,
          major: analysis.historicalAnalysis.playtimeAnalysis.gaps.filter(g => g.gapCategory === 'Major Gap').length,
          extreme: analysis.historicalAnalysis.playtimeAnalysis.gaps.filter(g => g.gapCategory === 'Extreme Gap').length,
          accountSwitch: analysis.historicalAnalysis.playtimeAnalysis.gaps.filter(g => g.gapCategory === 'Account Switch Likely').length
        }
      },
      skillProgression: analysis.historicalAnalysis.skillProgression,
      keyInsights: [
        `Account is ${analysis.historicalAnalysis.accountAge} days old`,
        `${analysis.dataQuality.gamesCovered} games analyzed across ${analysis.dataQuality.timeSpanDays} days`,
        `${analysis.historicalAnalysis.playtimeAnalysis.gaps.length} total gaps detected`,
        `${analysis.historicalAnalysis.playtimeAnalysis.gaps.filter(g => g.suspicionLevel === 'extreme').length} extreme gaps with account switching indicators`,
        `Skill improvement rate: ${analysis.historicalAnalysis.skillProgression.improvementRate.toFixed(3)}`
      ]
    };
    
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, false);
    
    res.json({
      success: true,
      data: historicalReport,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        analysisDepth: '5-year historical with account switching detection'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, true);
    
    logger.error(`Error in historical analysis for ${summonerName}:`, error);
    res.status(500).json({
      success: false,
      error: 'HISTORICAL_ANALYSIS_FAILED',
      message: 'Failed to perform historical analysis'
    });
  }
});

// Champion Performance Deep Dive
app.get('/api/analyze/champions/:summonerName', async (req, res) => {
  const { summonerName } = req.params;
  const { champion } = req.query; // Optional: specific champion
  const startTime = Date.now();

  try {
    logger.info(`🏆 Champion analysis requested for: ${summonerName}`);
    
    const advancedService = new AdvancedDataService(riotApi);
    const analysis = await advancedService.analyzePlayerComprehensively(summonerName);
    
    let championData = analysis.performanceMetrics;
    
    if (champion) {
      championData = championData.filter(data => 
        data.championMastery.championName.toLowerCase() === (champion as string).toLowerCase()
      );
    }

    // Sort by suspicion level (most suspicious first)
    championData.sort((a, b) => {
      const aSuspicious = a.championMastery.suspiciousIndicators;
      const bSuspicious = b.championMastery.suspiciousIndicators;
      const aScore = (aSuspicious.highInitialPerformance ? 1 : 0) + 
                    (aSuspicious.inconsistentProgression ? 1 : 0) + 
                    (aSuspicious.expertLevelPlay ? 1 : 0);
      const bScore = (bSuspicious.highInitialPerformance ? 1 : 0) + 
                    (bSuspicious.inconsistentProgression ? 1 : 0) + 
                    (bSuspicious.expertLevelPlay ? 1 : 0);
      return bScore - aScore;
    });

    const championReport = {
      summonerName,
      totalChampions: analysis.performanceMetrics.length,
      analyzedChampions: championData.length,
      mostSuspiciousChampions: championData.slice(0, 5),
      postGapExpertise: {
        championsWithPostGapExpertise: championData.filter(c => 
          c.championMastery.suspiciousIndicators.highInitialPerformance && 
          c.championMastery.firstTimePerformance
        ).length,
        accountSwitchingIndicators: championData.filter(c => 
          c.championMastery.suspiciousIndicators.expertLevelPlay
        ).length
      },
      performanceOverview: {
        averageWinRate: championData.reduce((sum, data) => sum + data.championMastery.winRate, 0) / championData.length,
        averageCSPerMinute: championData.reduce((sum, data) => sum + data.championMastery.csPerMinute, 0) / championData.length,
        averageKDA: championData.reduce((sum, data) => sum + data.championMastery.averageKDA, 0) / championData.length
      }
    };
    
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, false);
    
    res.json({
      success: true,
      data: championReport,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        analysisType: 'champion-focused'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, true);
    
    logger.error(`Error in champion analysis for ${summonerName}:`, error);
    res.status(500).json({
      success: false,
      error: 'CHAMPION_ANALYSIS_FAILED',
      message: 'Failed to perform champion analysis'
    });
  }
});

// Comprehensive Analysis Endpoint (Ultra-Deep Analysis)
app.get('/api/analyze/comprehensive/:summonerName', async (req, res) => {
  const { summonerName } = req.params;
  const startTime = Date.now();

  try {
    logger.info(`🔍 Ultra-comprehensive analysis requested for: ${summonerName}`);
    logger.info('📊 Performing 5+ year historical analysis with account switching detection...');
    
    const advancedService = new AdvancedDataService(riotApi);
    const analysis = await advancedService.analyzePlayerComprehensively(summonerName);
    
    const comprehensiveReport = {
      summonerName,
      overallSmurfProbability: analysis.smurfProbability.overall,
      riskLevel: analysis.smurfProbability.evidenceStrength,
      evidenceStrength: analysis.smurfProbability.evidenceStrength,
      
      // Full comprehensive data
      historicalAnalysis: analysis.historicalAnalysis,
      performanceMetrics: analysis.performanceMetrics,
      suspiciousPatterns: analysis.suspiciousPatterns,
      accountSwitchingDetection: {
        probability: analysis.historicalAnalysis.playtimeAnalysis.gaps.reduce((max, gap) => 
          Math.max(max, gap.accountSwitchProbability || 0), 0
        ),
        suspiciousGaps: analysis.historicalAnalysis.playtimeAnalysis.gaps.filter(gap => 
          gap.suspicionLevel === 'high' || gap.suspicionLevel === 'extreme'
        ),
        expertiseAfterGaps: analysis.performanceMetrics.filter(p => 
          p.championMastery.suspiciousIndicators.highInitialPerformance && 
          p.championMastery.firstTimePerformance
        ).length
      },
      
      keyFindings: [
        `Account age: ${analysis.historicalAnalysis.accountAge} days`,
        `Total games analyzed: ${analysis.dataQuality.gamesCovered}`,
        `Time span covered: ${analysis.dataQuality.timeSpanDays} days`,
        `Playtime gaps detected: ${analysis.historicalAnalysis.playtimeAnalysis.gaps.length}`,
        `Champions with suspicious first-time performance: ${analysis.performanceMetrics.filter(p => 
          p.championMastery.suspiciousIndicators.highInitialPerformance
        ).length}`,
        `Overall smurf probability: ${analysis.smurfProbability.overall.toFixed(1)}%`
      ],
      
      dataQuality: analysis.dataQuality,
      detailedReport: analysis.detailedReport
    };
    
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, false);
    
    res.json({
      success: true,
      data: comprehensiveReport,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        analysisDepth: 'ultra-comprehensive-5-year-historical'
      }
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, true);
    
    logger.error(`Error in comprehensive analysis for ${summonerName}:`, error);
    
    // Use the specific status code from the service error, or default to 500
    const statusCode = error.statusCode || error.response?.status || 500;
    const errorMessage = error.message || 'Failed to perform comprehensive analysis';
    
    // Map error codes to user-friendly responses
    let userMessage = errorMessage;
    let errorCode = 'COMPREHENSIVE_ANALYSIS_FAILED';
    
    switch (statusCode) {
      case 403:
        errorCode = 'API_ACCESS_FORBIDDEN';
        userMessage = `Cannot access player data for "${summonerName}". This is likely due to API restrictions on famous players.`;
        break;
      case 404:
        errorCode = 'SUMMONER_NOT_FOUND';
        userMessage = `Summoner "${summonerName}" not found. Please check the spelling and try again.`;
        break;
      case 429:
        errorCode = 'RATE_LIMITED';
        userMessage = 'Too many requests. Please wait a moment and try again.';
        break;
      case 503:
        errorCode = 'SERVICE_UNAVAILABLE';
        userMessage = 'Riot API is currently unavailable. Please try again later.';
        break;
      default:
        userMessage = 'Comprehensive analysis failed due to an unexpected error.';
        break;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: userMessage,
      details: errorMessage,
      suggestions: statusCode === 403 ? [
        'Try searching for a less well-known summoner name',
        'Visit the Demo tab to see the analysis system working',
        'Famous players (Faker, Doublelift, etc.) are restricted by Riot API'
      ] : undefined
    });
  }
});

// OP.GG Enhanced Player Analysis - Real Data Integration
app.get('/api/analyze/opgg-enhanced/:summonerName', async (req, res) => {
  const { summonerName } = req.params;
  const { region = 'na1' } = req.query;
  const startTime = Date.now();

  try {
    logger.info(`🌟 OP.GG Enhanced analysis requested for: ${summonerName} in ${region}`);
    
    // Use enhanced data fetching with OP.GG integration
    const enhancedAnalysis = await dataFetchingService.fetchEnhancedPlayerAnalysis(summonerName, region as string);
    
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, false);
    
    res.json({
      success: true,
      data: enhancedAnalysis,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        analysisType: 'opgg-enhanced',
        dataSource: enhancedAnalysis.analysisMetadata.apiLimitations.includes('OP.GG data unavailable') ? 'Riot API Fallback' : 'OP.GG MCP',
        features: [
          'Real summoner data via OP.GG',
          'Enhanced match history analysis',
          'Champion mastery verification',
          'Professional-grade UI integration',
          'Meta comparison capabilities'
        ]
      }
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, true);
    
    logger.error(`Error in OP.GG enhanced analysis for ${summonerName}:`, error);
    
    const statusCode = error.statusCode || 500;
    let userMessage = error.message || 'Failed to perform OP.GG enhanced analysis';
    let errorCode = 'OPGG_ENHANCED_ANALYSIS_FAILED';
    
    switch (statusCode) {
      case 404:
        errorCode = 'SUMMONER_NOT_FOUND';
        userMessage = `Summoner "${summonerName}" not found in ${region}. Please check the spelling and region.`;
        break;
      case 429:
        errorCode = 'RATE_LIMIT_EXCEEDED';
        userMessage = 'OP.GG API rate limit exceeded. Please wait a moment and try again.';
        break;
      case 503:
        errorCode = 'OPGG_SERVICE_UNAVAILABLE';
        userMessage = 'OP.GG service is currently unavailable. Falling back to Riot API data.';
        break;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: userMessage,
      details: error.message,
      fallbackAvailable: true,
      suggestions: [
        'Try again in a few moments',
        'Check if summoner name is spelled correctly',
        'Verify the correct region is selected'
      ]
    });
  }
});

// OP.GG Data Refresh Endpoint
app.post('/api/refresh/:summonerName', async (req, res) => {
  const { summonerName } = req.params;
  const { region = 'na1' } = req.body;
  const startTime = Date.now();

  try {
    logger.info(`🔄 Data refresh requested for: ${summonerName} in ${region}`);
    
    await dataFetchingService.refreshSummonerData(summonerName, region);
    
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, false);
    
    res.json({
      success: true,
      message: `Successfully refreshed data for ${summonerName}`,
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        refreshedSummoner: summonerName,
        region: region
      }
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, true);
    
    logger.error(`Error refreshing data for ${summonerName}:`, error);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: 'DATA_REFRESH_FAILED',
      message: error.message || 'Failed to refresh summoner data',
      fallbackNote: statusCode === 400 ? 'OP.GG integration may not be enabled' : undefined
    });
  }
});

// OP.GG Integration Status Endpoint
app.get('/api/integration/status', (req, res) => {
  try {
    const integrationStatus = dataFetchingService.getIntegrationStatus();
    const cacheStats = dataFetchingService.getCacheStats();
    
    res.json({
      success: true,
      integration: integrationStatus,
      cache: cacheStats,
      metadata: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/integration/status'
      }
    });
  } catch (error: any) {
    logger.error('Error getting integration status:', error);
    res.status(500).json({
      success: false,
      error: 'INTEGRATION_STATUS_ERROR',
      message: 'Failed to get integration status'
    });
  }
});

// Cache Management Endpoint
app.delete('/api/cache/clear', (req, res) => {
  try {
    dataFetchingService.clearCache();
    
    res.json({
      success: true,
      message: 'All caches cleared successfully',
      metadata: {
        timestamp: new Date().toISOString(),
        clearedCaches: ['basic', 'enhanced', 'opgg']
      }
    });
  } catch (error: any) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'CACHE_CLEAR_ERROR',
      message: 'Failed to clear cache'
    });
  }
});

// Analysis capabilities endpoint
app.get('/api/analysis/capabilities', (req, res) => {
  try {
    const integrationStatus = dataFetchingService.getIntegrationStatus();
    
    const capabilities = {
      basicAnalysis: {
        available: true,
        endpoint: '/api/analyze/basic/:summonerName',
        description: 'Basic smurf detection using Riot API',
        dataSource: 'Riot API'
      },
      enhancedAnalysis: {
        available: integrationStatus.opggEnabled,
        endpoint: '/api/analyze/opgg-enhanced/:summonerName',
        description: 'Enhanced analysis with real OP.GG data',
        dataSource: integrationStatus.opggEnabled ? 'OP.GG MCP + Riot API Fallback' : 'Riot API Only'
      },
      advancedFeatures: {
        dataRefresh: integrationStatus.opggEnabled,
        realTimeData: integrationStatus.opggEnabled,
        championAnalysis: integrationStatus.opggEnabled,
        metaComparison: integrationStatus.opggEnabled
      },
      regions: ['na1', 'euw1', 'kr', 'br1', 'eun1', 'jp1', 'lan', 'las', 'oc1', 'tr1', 'ru'],
      limitations: integrationStatus.limitations
    };
    
    res.json({
      success: true,
      capabilities,
      metadata: {
        timestamp: new Date().toISOString(),
        integrationEnabled: integrationStatus.opggEnabled
      }
    });
  } catch (error: any) {
    logger.error('Error getting analysis capabilities:', error);
    res.status(500).json({
      success: false,
      error: 'CAPABILITIES_ERROR',
      message: 'Failed to get analysis capabilities'
    });
  }
});

// Challenger Smurf Analysis Demo Endpoint
app.get('/api/demo/challenger-analysis', async (req, res) => {
  const startTime = Date.now();

  try {
    logger.info('🎮 Challenger smurf analysis demo requested');
    
    // Get challenger data
    const challengers = await challengerService.getTopChallengers(20);
    const platform = await limitedAccessService.getPlatformStatus();
    const rotation = await championService.getChampionRotation();
    
    // Create mock smurf analysis for demonstration
    const demoAnalysis = challengers.map((challenger, index) => {
      // Create realistic but fake smurf probabilities for demo
      const mockSmurfProbability = Math.random() * 100;
      const riskLevel = mockSmurfProbability > 80 ? 'Very High' : 
                       mockSmurfProbability > 60 ? 'High' : 
                       mockSmurfProbability > 40 ? 'Moderate' : 
                       mockSmurfProbability > 20 ? 'Low' : 'Very Low';
      
      return {
        summonerId: challenger.summonerId,
        summonerName: challenger.summonerName,
        rank: challenger.rank,
        leaguePoints: challenger.leaguePoints,
        wins: challenger.wins,
        losses: challenger.losses,
        winRate: challenger.winRate,
        veteran: challenger.veteran,
        hotStreak: challenger.hotStreak,
        freshBlood: challenger.freshBlood,
        smurfAnalysis: {
          probability: parseFloat(mockSmurfProbability.toFixed(1)),
          riskLevel,
          factors: {
            championPerformance: {
              weight: 65,
              score: Math.random() * 100,
              details: "First-time champion performance analysis"
            },
            summonerSpells: {
              weight: 25, 
              score: Math.random() * 100,
              details: "Summoner spell placement patterns"
            },
            playtimeGaps: {
              weight: 10,
              score: Math.random() * 100,
              details: "Account activity gap analysis"
            }
          },
          
          // Demonstration features available with full API access
          enhancedFeatures: {
            "5+ Year Analysis": "Historical performance patterns over years",
            "Account Switching Detection": "Gaps in play followed by skill spikes", 
            "Champion Expertise Analysis": "First-time champion mastery detection",
            "Role Mastery Changes": "Sudden expertise in new roles",
            "Performance Anomaly Detection": "Abnormal skill progression"
          }
        },
        
        // Real data we can actually access
        realData: {
          currentLP: challenger.leaguePoints,
          seasonWins: challenger.wins,
          seasonLosses: challenger.losses,
          veteran: challenger.veteran,
          hotStreak: challenger.hotStreak,
          freshBlood: challenger.freshBlood
        }
      };
    });

    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, false);
    
    res.json({
      success: true,
      demoMode: true,
      message: "This is a demonstration using available challenger data. Full smurf detection requires summoner/match data access.",
      
      // Demo data
      data: {
        analysis: demoAnalysis.slice(0, 10), // Top 10 for demo
        platformStatus: {
          region: platform.name,
          incidents: platform.incidents?.length || 0,
          maintenances: platform.maintenances?.length || 0
        },
        championRotation: {
          freeChampions: rotation.freeChampionIds.length,
          newPlayerChampions: rotation.freeChampionIdsForNewPlayers.length
        }
      },
      
      // System capabilities
      systemInfo: {
        currentApiAccess: {
          challengerData: true,
          championRotation: true,
          platformData: true,
          summonerData: false,
          matchData: false
        },
        
        fullCapabilities: {
          "Real Smurf Detection": "Requires summoner + match data access",
          "5+ Year Historical Analysis": "Deep account history analysis",
          "Champion Performance Tracking": "First-time champion mastery detection", 
          "Account Switching Detection": "Gap analysis with skill spikes",
          "Tournament-Grade Accuracy": "Professional esports integrity"
        },
        
        demoFeatures: [
          "🏆 Challenger leaderboard integration",
          "📊 Performance monitoring system", 
          "🎯 Risk assessment algorithms",
          "📈 Data visualization capabilities",
          "🔧 Production-ready infrastructure"
        ]
      },
      
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        totalChallengers: challengers.length,
        apiKeyStatus: "Development - Challenger/Platform/Rotation access only"
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    performanceMonitor.recordRequest(responseTime, true);
    
    logger.error('Error in challenger demo analysis:', error);
    res.status(500).json({
      success: false,
      error: 'DEMO_ANALYSIS_FAILED',
      message: 'Failed to generate challenger smurf analysis demo'
    });
  }
});

// Mock Challenger Data Endpoint (For testing frontend without API access)
app.get('/api/mock/challenger-demo', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('🎮 Mock challenger demo data requested');
    
    // Static mock data that works without any API permissions
    const mockChallengers = [
      {
        summonerId: "mock-summoner-1",
        summonerName: "FakerKR",
        rank: 1,
        leaguePoints: 1247,
        wins: 234,
        losses: 45,
        winRate: "83.9",
        veteran: true,
        hotStreak: true,
        freshBlood: false,
        inactive: false
      },
      {
        summonerId: "mock-summoner-2", 
        summonerName: "ShowMaker",
        rank: 2,
        leaguePoints: 1189,
        wins: 198,
        losses: 67,
        winRate: "74.7",
        veteran: true,
        hotStreak: false,
        freshBlood: false,
        inactive: false
      },
      {
        summonerId: "mock-summoner-3",
        summonerName: "SuspiciousPlayer",
        rank: 3,
        leaguePoints: 1156,
        wins: 89,
        losses: 12,
        winRate: "88.1",
        veteran: false,
        hotStreak: true,
        freshBlood: true,
        inactive: false
      },
      {
        summonerId: "mock-summoner-4",
        summonerName: "NewProdigy",
        rank: 4,
        leaguePoints: 1134,
        wins: 156,
        losses: 23,
        winRate: "87.2",
        veteran: false,
        hotStreak: false,
        freshBlood: true,
        inactive: false
      },
      {
        summonerId: "mock-summoner-5",
        summonerName: "MidLaneGod",
        rank: 5,
        leaguePoints: 1098,
        wins: 267,
        losses: 89,
        winRate: "75.0",
        veteran: true,
        hotStreak: false,
        freshBlood: false,
        inactive: false
      },
      {
        summonerId: "mock-summoner-6",
        summonerName: "SmurfAlert",
        rank: 6,
        leaguePoints: 1067,
        wins: 78,
        losses: 8,
        winRate: "90.7",
        veteran: false,
        hotStreak: true,
        freshBlood: true,
        inactive: false
      },
      {
        summonerId: "mock-summoner-7",
        summonerName: "VeteranPlayer",
        rank: 7,
        leaguePoints: 1045,
        wins: 289,
        losses: 134,
        winRate: "68.3",
        veteran: true,
        hotStreak: false,
        freshBlood: false,
        inactive: false
      },
      {
        summonerId: "mock-summoner-8",
        summonerName: "SkillJumper",
        rank: 8,
        leaguePoints: 1023,
        wins: 123,
        losses: 18,
        winRate: "87.2",
        veteran: false,
        hotStreak: true,
        freshBlood: true,
        inactive: false
      },
      {
        summonerId: "mock-summoner-9",
        summonerName: "LegitPlayer",
        rank: 9,
        leaguePoints: 998,
        wins: 201,
        losses: 87,
        winRate: "69.8",
        veteran: true,
        hotStreak: false,
        freshBlood: false,
        inactive: false
      },
      {
        summonerId: "mock-summoner-10",
        summonerName: "AltAccount",
        rank: 10,
        leaguePoints: 976,
        wins: 67,
        losses: 11,
        winRate: "85.9",
        veteran: false,
        hotStreak: false,
        freshBlood: true,
        inactive: false
      }
    ];
    
    // Generate realistic smurf analysis for each player
    const analysisData = mockChallengers.map((challenger) => {
      // Create smurf probability based on player characteristics
      let smurfProbability = 0;
      
      // High win rate increases smurf probability
      const winRate = parseFloat(challenger.winRate);
      if (winRate > 85) smurfProbability += 40;
      else if (winRate > 80) smurfProbability += 25;
      else if (winRate > 75) smurfProbability += 15;
      else smurfProbability += 5;
      
      // Low game count with high win rate increases probability
      const totalGames = challenger.wins + challenger.losses;
      if (totalGames < 100 && winRate > 80) smurfProbability += 30;
      else if (totalGames < 150 && winRate > 75) smurfProbability += 20;
      else if (totalGames < 200) smurfProbability += 10;
      
      // Fresh blood with high performance indicates smurf
      if (challenger.freshBlood && winRate > 80) smurfProbability += 25;
      
      // Veteran players are less likely to be smurfs
      if (challenger.veteran) smurfProbability -= 15;
      
      // Add some randomness but cap at 95%
      smurfProbability += Math.random() * 10;
      smurfProbability = Math.min(95, Math.max(5, smurfProbability));
      
      const riskLevel = smurfProbability > 80 ? 'Very High' : 
                       smurfProbability > 60 ? 'High' : 
                       smurfProbability > 40 ? 'Moderate' : 
                       smurfProbability > 20 ? 'Low' : 'Very Low';
      
      return {
        summonerId: challenger.summonerId,
        summonerName: challenger.summonerName,
        rank: challenger.rank,
        leaguePoints: challenger.leaguePoints,
        wins: challenger.wins,
        losses: challenger.losses,
        winRate: challenger.winRate,
        veteran: challenger.veteran,
        hotStreak: challenger.hotStreak,
        freshBlood: challenger.freshBlood,
        smurfAnalysis: {
          probability: parseFloat(smurfProbability.toFixed(1)),
          riskLevel,
          factors: {
            championPerformance: {
              weight: 65,
              score: Math.random() * 100,
              details: "Champion mastery vs account age analysis"
            },
            accountActivity: {
              weight: 25, 
              score: Math.random() * 100,
              details: "Playtime patterns and gaps analysis"
            },
            winRateAnomaly: {
              weight: 10,
              score: winRate > 85 ? 90 : winRate > 75 ? 70 : 40,
              details: `${challenger.winRate}% win rate analysis`
            }
          },
          insights: {
            totalGames,
            averageLP: Math.round(challenger.leaguePoints / totalGames * 10) / 10,
            accountFlags: [
              ...(challenger.freshBlood ? ['Fresh Account'] : []),
              ...(challenger.veteran ? ['Veteran Player'] : []),
              ...(challenger.hotStreak ? ['Current Hot Streak'] : []),
              ...(winRate > 85 ? ['Exceptional Win Rate'] : []),
              ...(totalGames < 100 ? ['Low Game Count'] : [])
            ]
          }
        },
        // Add the realData structure that the frontend expects
        realData: {
          currentLP: challenger.leaguePoints,
          seasonWins: challenger.wins,
          seasonLosses: challenger.losses,
          veteran: challenger.veteran,
          hotStreak: challenger.hotStreak,
          freshBlood: challenger.freshBlood
        }
      };
    });
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      mockData: true,
      message: "Mock challenger data for frontend/backend testing (Railway backend)",
      data: {
        analysis: analysisData.slice(0, 5), // Top 5 for demo like static file
        summary: {
          totalPlayers: analysisData.length,
          highRiskPlayers: analysisData.filter(p => p.smurfAnalysis.riskLevel === 'Very High' || p.smurfAnalysis.riskLevel === 'High').length,
          averageWinRate: (analysisData.reduce((sum, p) => sum + parseFloat(p.winRate), 0) / analysisData.length).toFixed(1),
          veteranCount: analysisData.filter(p => p.veteran).length,
          freshBloodCount: analysisData.filter(p => p.freshBlood).length
        },
        platformStatus: {
          region: "NA1",
          incidents: 0,
          maintenances: 0
        },
        championRotation: {
          freeChampions: 14,
          newPlayerChampions: 10
        }
      },
      systemInfo: {
        currentApiAccess: {
          challengerData: true,
          championRotation: true,
          platformData: true,
          summonerData: false,
          matchData: false
        },
        fullCapabilities: {
          "Real Smurf Detection": "Requires summoner + match data access",
          "5+ Year Historical Analysis": "Deep account history analysis",
          "Champion Performance Tracking": "First-time champion mastery detection", 
          "Account Switching Detection": "Gap analysis with skill spikes",
          "Tournament-Grade Accuracy": "Professional esports integrity"
        },
        demoFeatures: [
          "🏆 Challenger leaderboard integration",
          "📊 Performance monitoring system", 
          "🎯 Risk assessment algorithms",
          "📈 Data visualization capabilities",
          "🔧 Production-ready infrastructure"
        ]
      },
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        endpoint: "/api/mock/challenger-demo (Railway backend)",
        dataSource: "Railway backend mock data"
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Error in mock challenger demo:', error);
    res.status(500).json({
      success: false,
      error: 'MOCK_DATA_FAILED',
      message: 'Failed to generate mock challenger demo data'
    });
  }
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