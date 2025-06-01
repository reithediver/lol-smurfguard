import dotenv from 'dotenv';
import { RiotApi } from './api/RiotApi';
import { logger } from './utils/loggerService';
import { MatchParticipant } from './models/MatchHistory';

// Load environment variables
dotenv.config();

// Check for API key
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

async function testFullApiAccess() {
  logger.info('Testing full Riot API access with Personal API key...');
  
  const riotApi = new RiotApi(apiKey as string, 'na1');
  
  try {
    // 1. Test summoner data access
    logger.info('\n--- Testing Summoner API ---');
    const summonerName = 'Doublelift';
    logger.info(`Looking up summoner: ${summonerName}`);
    
    const summoner = await riotApi.getSummonerByName(summonerName);
    logger.info('✅ Summoner data access successful!');
    logger.info(`Name: ${summoner.name}`);
    logger.info(`Level: ${summoner.summonerLevel}`);
    logger.info(`ID: ${summoner.id}`);
    logger.info(`PUUID: ${summoner.puuid}`);
    
    // 2. Test match history access
    logger.info('\n--- Testing Match History API ---');
    logger.info(`Getting match history for ${summonerName}`);
    
    const matchIds = await riotApi.getMatchHistory(summoner.puuid);
    logger.info('✅ Match history access successful!');
    logger.info(`Found ${matchIds.length} recent matches`);
    
    if (matchIds.length > 0) {
      // 3. Test match details access
      logger.info('\n--- Testing Match Details API ---');
      const matchId = matchIds[0];
      logger.info(`Getting details for match: ${matchId}`);
      
      // Note: The actual response from Riot API may differ from our model
      // We'll work with the raw response for testing purposes
      const matchDetails = await riotApi.getMatchDetails(matchId);
      logger.info('✅ Match details access successful!');
      
      // Handle API response which might not match our model exactly
      const rawResponse = matchDetails as any;
      if (rawResponse.info) {
        logger.info(`Game duration: ${rawResponse.info.gameDuration} seconds`);
        logger.info(`Game mode: ${rawResponse.info.gameMode}`);
        logger.info(`Players: ${rawResponse.info.participants.length}`);
        
        // Find our player in the match
        const player = rawResponse.info.participants.find(
          (p: any) => p.puuid === summoner.puuid
        );
        
        if (player) {
          logger.info('\n--- Player Performance ---');
          logger.info(`Champion: ${player.championName}`);
          logger.info(`K/D/A: ${player.kills}/${player.deaths}/${player.assists}`);
          logger.info(`Position: ${player.teamPosition || 'Unknown'}`);
          logger.info(`Win: ${player.win ? 'Yes' : 'No'}`);
          
          // 4. Test champion mastery
          logger.info('\n--- Testing Champion Mastery API ---');
          logger.info(`Getting mastery data for ${player.championName} (ID: ${player.championId})`);
          
          try {
            const mastery = await riotApi.getChampionMastery(summoner.puuid, player.championId);
            logger.info('✅ Champion mastery access successful!');
            logger.info(`Mastery level: ${mastery.championLevel}`);
            logger.info(`Mastery points: ${mastery.championPoints}`);
            logger.info(`Last played: ${new Date(mastery.lastPlayTime).toLocaleDateString()}`);
          } catch (error) {
            logger.error('❌ Champion mastery access failed:', error);
          }
        }
      } else {
        // Fallback to our model structure if the response matches it
        logger.info(`Game duration: ${matchDetails.gameDuration} seconds`);
        logger.info(`Game mode: ${matchDetails.gameMode}`);
        logger.info(`Players: ${matchDetails.participants.length}`);
        
        // Find our player in the match
        const player = matchDetails.participants.find(
          (p: MatchParticipant) => p.puuid === summoner.puuid
        );
        
        if (player) {
          logger.info('\n--- Player Performance ---');
          logger.info(`Champion: ${player.championName}`);
          logger.info(`K/D/A: ${player.stats.kills}/${player.stats.deaths}/${player.stats.assists}`);
          logger.info(`Position: ${player.position || 'Unknown'}`);
          logger.info(`Win: ${player.stats.win ? 'Yes' : 'No'}`);
          
          // 4. Test champion mastery
          logger.info('\n--- Testing Champion Mastery API ---');
          logger.info(`Getting mastery data for ${player.championName} (ID: ${player.championId})`);
          
          try {
            const mastery = await riotApi.getChampionMastery(summoner.puuid, player.championId);
            logger.info('✅ Champion mastery access successful!');
            logger.info(`Mastery level: ${mastery.championLevel}`);
            logger.info(`Mastery points: ${mastery.championPoints}`);
            logger.info(`Last played: ${new Date(mastery.lastPlayTime).toLocaleDateString()}`);
          } catch (error) {
            logger.error('❌ Champion mastery access failed:', error);
          }
        }
      }
    }
    
    // 5. Test league entries
    logger.info('\n--- Testing League Entries API ---');
    logger.info(`Getting ranked data for ${summonerName}`);
    
    const leagueEntries = await riotApi.getLeagueEntries(summoner.id);
    logger.info('✅ League entries access successful!');
    
    if (leagueEntries.length > 0) {
      for (const entry of leagueEntries) {
        logger.info(`Queue: ${entry.queueType}`);
        logger.info(`Tier: ${entry.tier} ${entry.rank}`);
        logger.info(`LP: ${entry.leaguePoints}`);
        logger.info(`Win/Loss: ${entry.wins}W ${entry.losses}L (${Math.round(entry.wins / (entry.wins + entry.losses) * 100)}% winrate)`);
      }
    } else {
      logger.info('No ranked data found for this player');
    }
    
    logger.info('\n✅ All API tests passed successfully! Your Personal API key is working correctly.');
    
  } catch (error) {
    logger.error('\n❌ API test failed:', error);
    logger.error('Your API key may still be a Development key or may have expired.');
    logger.error('Please follow the instructions in docs/API_KEY_REQUIREMENTS.md to get a Personal API key.');
  }
}

testFullApiAccess().catch(error => {
  logger.error('Unhandled error during API test:', error);
}); 