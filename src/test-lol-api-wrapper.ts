import dotenv from 'dotenv';
import * as LeagueAPI from 'league-of-legends-api-wrapper';
import { logger } from './utils/loggerService';

// Load environment variables
dotenv.config();

const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

// Initialize the API wrapper with default export
const lolAPI = new LeagueAPI.default({
  token: apiKey,
  region: 'na1'
});

async function testApiAccess() {
  logger.info('Testing Riot API access with league-of-legends-api-wrapper...');

  try {
    // 1. Test platform status (should work with any key)
    logger.info('Testing platform status endpoint...');
    const statusData = await lolAPI.lolStatus.platformData();
    logger.info('✅ Platform status endpoint accessible!');
    logger.info(`Platform name: ${statusData.name}`);
  } catch (error) {
    logger.error('❌ Platform status endpoint failed:', error);
  }

  try {
    // 2. Test champion rotation (should work with any key)
    logger.info('\nTesting champion rotation endpoint...');
    const rotationData = await lolAPI.champion.all({ freeToPlay: true });
    logger.info('✅ Champion rotation endpoint accessible!');
    if (Array.isArray(rotationData)) {
      logger.info(`Free champion count: ${rotationData.length}`);
    } else {
      logger.info('Received champion rotation data');
    }
  } catch (error) {
    logger.error('❌ Champion rotation endpoint failed:', error);
  }

  try {
    // 3. Test league data (should work with any key)
    logger.info('\nTesting challenger league endpoint...');
    const leagueData = await lolAPI.league.challengerLeagues('RANKED_SOLO_5x5');
    logger.info('✅ Challenger league endpoint accessible!');
    logger.info(`League name: ${leagueData.name}`);
    logger.info(`Number of challenger players: ${leagueData.entries?.length}`);
  } catch (error) {
    logger.error('❌ Challenger league endpoint failed:', error);
  }

  try {
    // 4. Test summoner data (might not work with development key)
    logger.info('\nTesting summoner endpoint...');
    const summonerData = await lolAPI.summoner.getByName('Doublelift');
    logger.info('✅ Summoner endpoint accessible!');
    logger.info(`Summoner name: ${summonerData.name}, Level: ${summonerData.summonerLevel}`);
    
    // If we can access summoner data, try to get match history
    if (summonerData.puuid) {
      try {
        logger.info('\nTesting match history endpoint...');
        const matchIds = await lolAPI.match.getMatchIdsByPUUID(summonerData.puuid);
        logger.info('✅ Match history endpoint accessible!');
        logger.info(`Number of matches: ${matchIds.length}`);
      } catch (error) {
        logger.error('❌ Match history endpoint failed:', error);
      }
    }
  } catch (error) {
    logger.error('❌ Summoner endpoint failed:', error);
    logger.error('Your API key does not have permission to access summoner data.');
    logger.error('Consider applying for a personal API key at: https://developer.riotgames.com/app-type');
  }

  logger.info('\nAPI access test complete!');
}

testApiAccess().catch(error => {
  logger.error('Unhandled error during API test:', error);
}); 