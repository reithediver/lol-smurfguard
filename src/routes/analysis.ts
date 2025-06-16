import express from 'express';
import { Router, Request, Response } from 'express';
import { UnifiedAnalysisService } from '../services/UnifiedAnalysisService';
import { OutlierGame } from '../services/OutlierGameDetectionService';
import { RiotApi } from '../api/RiotApi';
import logger from '../utils/loggerService';
import { SmurfDetectionService } from '../services/SmurfDetectionService';
import { DataFetchingService } from '../services/DataFetchingService';
import { OutlierGameDetectionService } from '../services/OutlierGameDetectionService';

const router = express.Router();
const riotApi = new RiotApi(process.env.RIOT_API_KEY || 'demo-key');
const smurfDetectionService = new SmurfDetectionService(riotApi);
const dataFetchingService = new DataFetchingService();
const outlierGameDetectionService = new OutlierGameDetectionService();
const unifiedAnalysisService = new UnifiedAnalysisService(
    riotApi,
    smurfDetectionService,
    dataFetchingService,
    outlierGameDetectionService
);

router.get('/unified', async (req: Request, res: Response) => {
  try {
    const { summonerName, region } = req.query;

    logger.info(`[ANALYSIS] Received request for ${summonerName} in region ${region}`);

    if (!summonerName || !region) {
      logger.warn(`[ANALYSIS] Missing required parameters: summonerName=${summonerName}, region=${region}`);
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Parse Riot ID (GameName#Tag)
    let summoner;
    const summonerNameStr = summonerName as string;

    if (summonerNameStr.includes('#')) {
      logger.info(`[ANALYSIS] Parsing Riot ID: ${summonerNameStr}`);
      const [gameName, tagLine] = summonerNameStr.split('#');
      
      logger.info(`[ANALYSIS] Fetching summoner by Riot ID: ${gameName}#${tagLine}`);
      summoner = await riotApi.getSummonerByRiotId(gameName, tagLine);
    } else {
      // Fallback to legacy summoner name lookup
      logger.info(`[ANALYSIS] Fetching summoner by legacy name: ${summonerNameStr}`);
      summoner = await riotApi.getSummonerByName(summonerNameStr);
    }

    logger.info(`[ANALYSIS] Found summoner: ${JSON.stringify(summoner)}`);
    
    logger.info(`[ANALYSIS] Getting unified analysis for ${summoner.puuid}`);
    const analysis = await unifiedAnalysisService.getUnifiedAnalysis(summoner.puuid, {
      region: region as string,
      riotId: summoner.gameName && summoner.tagLine ? `${summoner.gameName}#${summoner.tagLine}` : summonerNameStr
    });

    // Transform the analysis to match the frontend interface
    const transformedAnalysis = {
      ...analysis,
      outlierAnalysis: analysis.outlierAnalysis ? {
        outlierGames: analysis.outlierAnalysis.outlierGames.map(game => ({
          ...game,
          gameDate: new Date(game.gameDate),
          matchUrl: `https://www.op.gg/matches/${(region as string).toLowerCase()}/${game.matchId}`,
          // Ensure all required fields are present
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
          gameCarried: game.gameCarried || false
        }))
      } : undefined
    };

    logger.info(`[ANALYSIS] Successfully analyzed player ${summonerName}`);
    res.json(transformedAnalysis);
  } catch (error) {
    logger.error(`[ANALYSIS] Error in unified analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logger.error(`[ANALYSIS] Stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    
    res.status(500).json({ 
      error: 'Failed to analyze player',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 