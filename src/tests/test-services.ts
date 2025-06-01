import dotenv from 'dotenv';
import { logger } from './utils/loggerService';
import { ChampionService } from './services/ChampionService';
import { ChallengerService } from './services/ChallengerService';

// Load environment variables
dotenv.config();

// Check for API key
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

async function testLimitedAccessServices() {
  logger.info('Testing services with limited API key...');
  
  // Initialize services
  const championService = new ChampionService(apiKey as string, 'na1');
  const challengerService = new ChallengerService(apiKey as string, 'na1');
  
  // Test ChampionService
  logger.info('\n==== Testing Champion Service ====');
  try {
    const rotation = await championService.getChampionRotation();
    logger.info('✅ Champion rotation data accessible!');
    logger.info(`Free champions: ${rotation.freeChampionIds.length}`);
    logger.info(`Free champions for new players: ${rotation.freeChampionIdsForNewPlayers.length}`);
    
    // Log some champion IDs
    logger.info('Free champion IDs:');
    rotation.freeChampionIds.slice(0, 5).forEach(id => logger.info(`- ${id}`));
    
    // Test rotation changes tracking
    logger.info('\nTesting rotation changes tracking...');
    const changes = await championService.trackRotationChanges();
    logger.info('✅ Rotation changes tracking working!');
    logger.info(`Current rotation size: ${changes.currentRotation.freeChampionIds.length}`);
    logger.info(`Newly added champions: ${changes.newlyAdded.length}`);
    logger.info(`Newly removed champions: ${changes.newlyRemoved.length}`);
    logger.info(`Unchanged champions: ${changes.unchanged.length}`);
  } catch (error) {
    logger.error('❌ Champion service test failed:', error);
  }
  
  // Test ChallengerService
  logger.info('\n==== Testing Challenger Service ====');
  try {
    const league = await challengerService.getChallengerLeague();
    logger.info('✅ Challenger league data accessible!');
    logger.info(`League name: ${league.name}`);
    logger.info(`Total players: ${league.entries.length}`);
    
    // Test top challengers
    logger.info('\nFetching top 5 challengers...');
    const topChallengers = await challengerService.getTopChallengers(5);
    logger.info('✅ Top challengers data retrieved!');
    
    for (const player of topChallengers) {
      logger.info(`${player.summonerName}: ${player.leaguePoints} LP, ${player.wins}W ${player.losses}L`);
    }
    
    // Test movement tracking
    logger.info('\nTesting challenger movement tracking...');
    const movement = await challengerService.trackChallengerMovement();
    logger.info('✅ Challenger movement tracking working!');
    logger.info(`New players: ${movement.newPlayers.length}`);
    logger.info(`Dropped players: ${movement.droppedPlayers.length}`);
    logger.info(`Improved players: ${movement.improved.length}`);
    logger.info(`Declined players: ${movement.declined.length}`);
    
    // Test player analysis if we have any players
    if (topChallengers.length > 0) {
      const player = topChallengers[0];
      logger.info(`\nAnalyzing player: ${player.summonerName}`);
      const analysis = await challengerService.analyzePlayer(player.summonerId);
      
      if (analysis) {
        logger.info('✅ Player analysis successful!');
        logger.info(`Win rate: ${analysis.winRate.toFixed(2)}%`);
        logger.info(`Total games: ${analysis.totalGames}`);
        logger.info(`Average LP gain: ${analysis.averageLpGain.toFixed(2)}`);
        logger.info(`Hot streak: ${analysis.isHotStreak ? 'Yes' : 'No'}`);
        logger.info(`Veteran: ${analysis.isVeteran ? 'Yes' : 'No'}`);
        logger.info(`Fresh blood: ${analysis.isFreshBlood ? 'Yes' : 'No'}`);
        logger.info(`Inactive: ${analysis.isInactive ? 'Yes' : 'No'}`);
      } else {
        logger.error('❌ Player analysis failed: Player not found');
      }
    }
  } catch (error) {
    logger.error('❌ Challenger service test failed:', error);
  }
  
  logger.info('\n==== All tests completed ====');
}

testLimitedAccessServices().catch(error => {
  logger.error('Unhandled error during tests:', error);
}); 