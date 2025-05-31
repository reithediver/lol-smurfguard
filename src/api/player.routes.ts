import { Router, Request, Response } from 'express';
import { AppError } from '../utils/errorHandler';
import { riotService } from '../services/riot.service';

const router = Router();

// Get player analysis
router.get('/:summonerName', async (req: Request, res: Response) => {
  try {
    const { summonerName } = req.params;
    const summoner = await riotService.getSummonerByName(summonerName);
    const leagueEntries = await riotService.getLeagueEntries(summoner.id);
    const championMastery = await riotService.getChampionMastery(summoner.puuid);
    const recentMatches = await riotService.getMatchHistory(summoner.puuid, undefined, 10);

    // TODO: Implement smurf detection logic
    res.status(200).json({
      summoner,
      leagueEntries,
      championMastery,
      recentMatches,
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
    const summoner = await riotService.getSummonerByName(summonerName);
    const matchIds = await riotService.getMatchHistory(summoner.puuid);
    const matches = await Promise.all(
      matchIds.map((matchId: string) => riotService.getMatchDetails(matchId))
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
    const summoner = await riotService.getSummonerByName(summonerName);
    const championMastery = await riotService.getChampionMastery(summoner.puuid);

    res.status(200).json({
      championMastery,
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
    console.log('RIOT_API_KEY status:', process.env.RIOT_API_KEY ? 'Key present (starts with ' + process.env.RIOT_API_KEY.substring(0, 8) + '...)' : 'Key missing');
    
    // Remove region tag if present (e.g., #NA1) as Riot API doesn't use it in the URL
    if (summonerName.includes('#')) {
      summonerName = summonerName.split('#')[0];
      console.log('Removed region tag, using name:', summonerName);
    }
    
    // Check if the API key has the necessary permissions
    try {
      // First try to get league data which might be accessible
      const leagueData = await riotService.getChallengersLeague();
      console.log('League data successfully retrieved, API key has some permissions');
      
      // Try to fetch summoner data
      console.log('Fetching summoner data for:', summonerName);
      const summoner = await riotService.getSummonerByName(summonerName);
      console.log('Summoner data received:', summoner.id);
      
      // Continue with the existing functionality...
      // Fetch league entries
      console.log('Fetching league entries for:', summoner.id);
      const leagueEntries = await riotService.getLeagueEntries(summoner.id);
      
      // Fetch champion mastery
      console.log('Fetching champion mastery for:', summoner.id);
      const championMastery = await riotService.getChampionMastery(summoner.id);
      
      // Fetch recent matches
      console.log('Fetching match history for:', summoner.puuid);
      const matchIds = await riotService.getMatchHistory(summoner.puuid, undefined, 5); // Reduced to 5 to avoid rate limits
      console.log('Fetched match IDs:', matchIds);
      
      // Only fetch details for the first match to avoid rate limits during testing
      const matches = matchIds.length > 0 ? 
        [await riotService.getMatchDetails(matchIds[0])] : [];
      
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
        championStats: [], // TODO: Map championMastery and match data to ChampionStats
        leagueEntries,
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
        
        // Try to get some usable data that's accessible
        try {
          const challengerLeague = await riotService.getChallengersLeague();
          const championRotation = await riotService.getChampionRotation();
          
          res.status(200).json({
            error: 'Limited API access',
            message: 'Your API key does not have permission to access the requested data. Here is some available data instead.',
            apiKeyLimited: true,
            summonerName: summonerName,
            availableData: {
              challengerLeague: {
                tier: challengerLeague.tier,
                queue: challengerLeague.queue,
                name: challengerLeague.name,
                topPlayers: challengerLeague.entries.slice(0, 5)
              },
              championRotation
            },
            howToFix: 'You need to apply for a Riot API key with higher permissions. Visit https://developer.riotgames.com/ to request a production API key.'
          });
        } catch (fallbackError) {
          throw new AppError('API key has insufficient permissions. Apply for a production key at https://developer.riotgames.com/', 403);
        }
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