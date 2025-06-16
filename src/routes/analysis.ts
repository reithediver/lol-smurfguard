import { Router, Request, Response } from 'express';
import { UnifiedAnalysisService } from '../services/UnifiedAnalysisService';
import { OutlierGame } from '../services/OutlierGameDetectionService';
import { RiotApi } from '../api/RiotApi';
import { logger } from '../utils/loggerService';

const router = Router();
const riotApi = new RiotApi(process.env.RIOT_API_KEY || '');
const unifiedAnalysisService = new UnifiedAnalysisService(riotApi);

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
        outlierGames: analysis.outlierAnalysis.outlierGames.map((game: OutlierGame) => ({
          ...game,
          gameDate: new Date(game.gameDate),
          matchUrl: `https://www.op.gg/matches/${(region as string).toLowerCase()}/${game.matchId}`
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