import dotenv from 'dotenv';
import { LimitedAccessService } from './services/LimitedAccessService';
import { logger } from './utils/loggerService';

// Load environment variables
dotenv.config();

const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

async function testLimitedAccessService() {
  logger.info('Testing Limited Access Service...');
  
  const limitedService = new LimitedAccessService(apiKey as string, 'na1');
  
  // First, check what permissions we have
  const permissions = await limitedService.checkApiAccess();
  logger.info('API Access Permissions:');
  logger.info(`- Platform Data: ${permissions.canAccessPlatformData ? '✅' : '❌'}`);
  logger.info(`- Champion Rotation: ${permissions.canAccessChampionRotation ? '✅' : '❌'}`);
  logger.info(`- Challenger Data: ${permissions.canAccessChallengerData ? '✅' : '❌'}`);
  logger.info(`- Summoner Data: ${permissions.canAccessSummonerData ? '✅' : '❌'}`);
  logger.info(`- Match Data: ${permissions.canAccessMatchData ? '✅' : '❌'}`);
  
  // Get platform data
  if (permissions.canAccessPlatformData) {
    logger.info('\nFetching platform status...');
    const platformData = await limitedService.getPlatformStatus();
    logger.info(`Platform: ${platformData.name}`);
    logger.info(`Status: ${platformData.status === 'online' ? 'Online' : 'Issues Detected'}`);
  }
  
  // Get champion rotation
  if (permissions.canAccessChampionRotation) {
    logger.info('\nFetching champion rotation...');
    const rotationData = await limitedService.getChampionRotation();
    logger.info(`Free Champions: ${rotationData.freeChampionIds.length} champions`);
    logger.info(`Free Champions for New Players: ${rotationData.freeChampionIdsForNewPlayers.length} champions`);
  }
  
  // Get challenger players
  if (permissions.canAccessChallengerData) {
    logger.info('\nFetching challenger players...');
    const players = await limitedService.getChallengerPlayers();
    logger.info(`Found ${players.length} challenger players`);
    
    if (players.length > 0) {
      // Display the top 5 players by LP
      const sortedPlayers = players.sort((a, b) => b.leaguePoints - a.leaguePoints).slice(0, 5);
      logger.info('\nTop 5 Challenger Players:');
      sortedPlayers.forEach((player, index) => {
        logger.info(`${index + 1}. ${player.summonerName || 'Unknown'} - ${player.leaguePoints} LP (${player.wins}W/${player.losses}L)`);
      });
    }
  }
  
  // Determine what functionality is available
  logger.info('\nApplication Status Based on API Key Permissions:');
  if (permissions.canAccessSummonerData && permissions.canAccessMatchData) {
    logger.info('✅ Full smurf detection is available!');
  } else {
    logger.info('⚠️ Limited functionality available:');
    if (permissions.canAccessChallengerData) {
      logger.info('  ✅ Can display top challenger players');
    }
    if (permissions.canAccessChampionRotation) {
      logger.info('  ✅ Can display free champion rotation');
    }
    if (permissions.canAccessPlatformData) {
      logger.info('  ✅ Can display platform status');
    }
    
    logger.info('\n❌ Smurf detection unavailable with current API key limitations.');
    logger.info('To enable full functionality, you need to apply for a production API key at:');
    logger.info('https://developer.riotgames.com/app-type');
  }
}

testLimitedAccessService().catch(error => {
  logger.error('Unhandled error during test:', error);
}); 