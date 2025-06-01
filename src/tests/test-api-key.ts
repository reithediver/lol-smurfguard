import dotenv from 'dotenv';
import { LimitedAccessService } from './services/LimitedAccessService';
import { logger } from './utils/loggerService';

// Load environment variables
dotenv.config();

// Check for API key
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

async function testApiPermissions() {
  logger.info('Testing API key permissions...');
  
  // Type assertion to ensure apiKey is string
  const limitedAccessService = new LimitedAccessService(apiKey as string, 'na1');
  
  try {
    const permissions = await limitedAccessService.checkApiAccess();
    
    logger.info('API Key Permission Test Results:');
    logger.info('-------------------------------');
    logger.info(`Platform Data: ${permissions.canAccessPlatformData ? '✅ Accessible' : '❌ Not accessible'}`);
    logger.info(`Champion Rotation: ${permissions.canAccessChampionRotation ? '✅ Accessible' : '❌ Not accessible'}`);
    logger.info(`Challenger Data: ${permissions.canAccessChallengerData ? '✅ Accessible' : '❌ Not accessible'}`);
    logger.info(`Summoner Data: ${permissions.canAccessSummonerData ? '✅ Accessible' : '❌ Not accessible'}`);
    logger.info(`Match Data: ${permissions.canAccessMatchData ? '✅ Accessible' : '❌ Not accessible'}`);
    logger.info('-------------------------------');
    
    // Determine API key type
    if (permissions.canAccessSummonerData && permissions.canAccessMatchData) {
      logger.info('🔑 You are using a Personal API Key with full permissions.');
    } else {
      logger.warn('⚠️ You are using a Development API Key with limited permissions.');
      logger.warn('To get full access, apply for a Personal API Key at: https://developer.riotgames.com/app-type');
    }
    
    // Test available data
    if (permissions.canAccessChallengerData) {
      logger.info('\nFetching top challenger players as an example:');
      const challengers = await limitedAccessService.getChallengerPlayers();
      const topPlayers = challengers
        .sort((a, b) => b.leaguePoints - a.leaguePoints)
        .slice(0, 5);
      
      for (const player of topPlayers) {
        logger.info(`${player.summonerName}: ${player.leaguePoints} LP, ${player.wins}W ${player.losses}L`);
      }
    }
    
    if (permissions.canAccessChampionRotation) {
      logger.info('\nFetching current champion rotation:');
      const rotation = await limitedAccessService.getChampionRotation();
      logger.info(`Free champions: ${rotation.freeChampionIds.length}`);
      logger.info(`Free champions for new players: ${rotation.freeChampionIdsForNewPlayers.length}`);
    }
    
  } catch (error) {
    logger.error('Error testing API permissions:', error);
  }
}

testApiPermissions().catch(error => {
  logger.error('Unhandled error during API test:', error);
}); 