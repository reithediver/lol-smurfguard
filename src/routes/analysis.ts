import { Router, Request, Response } from 'express';
import { UnifiedAnalysisService } from '../services/UnifiedAnalysisService';
import { OutlierGame } from '../services/OutlierGameDetectionService';
import { RiotApi } from '../api/RiotApi';

const router = Router();
const riotApi = new RiotApi(process.env.RIOT_API_KEY || '');
const unifiedAnalysisService = new UnifiedAnalysisService(riotApi);

router.get('/unified', async (req: Request, res: Response) => {
  try {
    const { summonerName, region } = req.query;

    if (!summonerName || !region) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get summoner info first to get PUUID
    const summoner = await riotApi.getSummonerByName(summonerName as string);
    
    const analysis = await unifiedAnalysisService.getUnifiedAnalysis(summoner.puuid, {
      region: region as string,
      riotId: `${summoner.gameName}#${summoner.tagLine}`
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

    res.json(transformedAnalysis);
  } catch (error) {
    console.error('Error in unified analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze player',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 