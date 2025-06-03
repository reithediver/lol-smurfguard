import { Router, Request, Response } from 'express';
import { AppError } from '../utils/errorHandler';
import { RiotApi } from './RiotApi';

const router = Router();
const riotApi = new RiotApi(process.env.RIOT_API_KEY || '');

// Get player analysis
router.get('/:summonerName', async (req: Request, res: Response) => {
  try {
    const { summonerName } = req.params;
    const summoner = await riotApi.getSummonerByName(summonerName);
    const matchHistory = await riotApi.getMatchHistory(summoner.puuid, 10);

    // TODO: Implement smurf detection logic
    res.status(200).json({
      summoner,
      recentMatches: matchHistory,
      smurfProbability: 0, // Placeholder for smurf detection algorithm
    });
  } catch (error) {
    throw new AppError('Error analyzing player', 500);
  }
});

// Get player match history
router.get('/:summonerName/matches', async (req: Request, res: Response) => {
  try {
    const { summonerName } = req.params;
    const summoner = await riotApi.getSummonerByName(summonerName);
    const matchIds = await riotApi.getMatchHistory(summoner.puuid);
    const matches = await Promise.all(
      matchIds.map((matchId: string) => riotApi.getMatchDetails(matchId))
    );

    res.status(200).json({
      matches,
    });
  } catch (error) {
    throw new AppError('Error fetching match history', 500);
  }
});

// Get player champion statistics
router.get('/:summonerName/champions', async (req: Request, res: Response) => {
  try {
    const { summonerName } = req.params;
    const summoner = await riotApi.getSummonerByName(summonerName);
    // Note: Champion mastery API would need additional endpoints
    
    res.status(200).json({
      summonerName: summoner.name,
      level: summoner.summonerLevel,
      message: 'Champion mastery requires additional API endpoints'
    });
  } catch (error) {
    throw new AppError('Error fetching champion statistics', 500);
  }
});

// Live analysis endpoint for real Riot API data
router.get('/live/:summonerName', async (req: Request, res: Response) => {
  try {
    let { summonerName } = req.params;
    console.log('Received request for summoner:', summonerName);
    
    // Remove region tag if present (e.g., #NA1) as Riot API doesn't use it in the URL
    if (summonerName.includes('#')) {
      summonerName = summonerName.split('#')[0];
      console.log('Removed region tag, using name:', summonerName);
    }
    
    try {
      console.log('Fetching summoner data for:', summonerName);
      const summoner = await riotApi.getSummonerByName(summonerName);
      console.log('Summoner data received:', summoner.id);
      
      // Fetch recent matches
      console.log('Fetching match history for:', summoner.puuid);
      const matchIds = await riotApi.getMatchHistory(summoner.puuid, 5); // Reduced to 5 to avoid rate limits
      console.log('Fetched match IDs:', matchIds);
      
      // Only fetch details for the first match to avoid rate limits during testing
      const matches = matchIds.length > 0 ? 
        [await riotApi.getMatchDetails(matchIds[0])] : [];
      
      // Compose a Player object (simplified for now)
      const player = {
        summonerId: summoner.id,
        accountId: summoner.accountId,
        puuid: summoner.puuid,
        name: summoner.name,
        profileIconId: summoner.profileIconId,
        summonerLevel: summoner.summonerLevel,
        revisionDate: summoner.revisionDate,
        smurfProbability: 0,
        suspiciousPatterns: [],
        matchHistory: matches,
        championStats: [], // TODO: Map match data to ChampionStats
        lastUpdated: new Date()
      };
      
      // Return the data
      res.status(200).json({
        player,
        message: 'Live data fetched successfully. Only one match loaded to avoid rate limits.'
      });
    } catch (apiError: any) {
      // Handle 403 errors with a more helpful message
      if (apiError.response?.status === 403) {
        console.error('API access forbidden - API key has insufficient permissions');
        
        res.status(403).json({
          error: 'Limited API access',
          message: 'Your API key does not have permission to access the requested data.',
          apiKeyLimited: true,
          summonerName: summonerName,
          howToFix: 'You need to apply for a Riot API key with higher permissions. Visit https://developer.riotgames.com/ to request a production API key.'
        });
      } else {
        throw apiError; // Re-throw other errors
      }
    }
  } catch (error) {
    const err = error as any;
    const status = err.response?.status || 500;
    const message = err.response?.data?.status?.message || err.message || 'Unknown error';
    
    console.error('API Error:', status, message);
    console.error('Error details:', err.response?.data || err.message);
    
    res.status(500).json({ 
      error: 'Failed to fetch live player data',
      details: message,
      status: status
    });
  }
});

export const playerRoutes = router; 