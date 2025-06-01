import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from './utils/loggerService';

// Load environment variables
dotenv.config();

const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

async function checkApiKeyType() {
  logger.info('====================================================');
  logger.info('API Key Verification Tool');
  logger.info('====================================================');
  logger.info(`Current API Key: ${apiKey!.substring(0, 10)}...${apiKey!.substring(apiKey!.length - 4)}`);
  
  try {
    // First, check if we can access basic endpoints
    logger.info('\nChecking Platform Status endpoint (should work with any key)...');
    await axios.get('https://na1.api.riotgames.com/lol/status/v4/platform-data', {
      headers: { 'X-Riot-Token': apiKey }
    });
    logger.info('✅ Platform Status: Working');
    
    try {
      // Now check if we can access summoner data (requires Personal API Key)
      logger.info('\nChecking Summoner endpoint (requires Personal API Key)...');
      await axios.get('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Doublelift', {
        headers: { 'X-Riot-Token': apiKey }
      });
      logger.info('✅ Summoner Data: Working');
      logger.info('\n✅✅✅ SUCCESS: You are using a Personal API Key! ✅✅✅');
      
      try {
        // Try match history which also requires Personal API Key
        logger.info('\nChecking Match History endpoint (requires Personal API Key)...');
        const knownPuuid = "O7JD9TRWpWwS8TYnBKNPz9sE-FE6ZTGPZXBYnNypYfGfL8c7_HNAslnYKCIW5Yf56DXmcOu_N8yw8g";
        await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${knownPuuid}/ids?start=0&count=1`, {
          headers: { 'X-Riot-Token': apiKey }
        });
        logger.info('✅ Match History: Working');
      } catch (error) {
        logger.warn('⚠️ Match History: Not working, but Summoner data works');
        logger.warn('This is unusual for a Personal API Key. You might have specific endpoint restrictions.');
      }
    } catch (error) {
      logger.error('❌ Summoner Data: Not working');
      logger.error('\n❌❌❌ ALERT: You are using a Development API Key! ❌❌❌');
      logger.error('Development Keys expire after 24 hours and cannot access summoner or match data.');
      logger.error('Apply for a Personal API Key at: https://developer.riotgames.com/');
    }
  } catch (error) {
    logger.error('❌ Platform Status: Not working');
    logger.error('\n⚠️⚠️⚠️ CRITICAL ERROR: Your API key is invalid or has expired! ⚠️⚠️⚠️');
    logger.error('Get a new API key at: https://developer.riotgames.com/');
  }
  
  logger.info('\n====================================================');
  logger.info('API Key verification complete');
  logger.info('====================================================');
}

checkApiKeyType().catch(error => {
  logger.error('Unhandled error during API verification:', error);
}); 