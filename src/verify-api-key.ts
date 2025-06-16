import dotenv from 'dotenv';
import axios from 'axios';
import logger from './utils/loggerService';

// Load environment variables
dotenv.config();

const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

async function checkApiKeyType() {
  logger.info('====================================================');
  logger.info('API Key Verification Tool - Enhanced Version');
  logger.info('====================================================');
  logger.info(`Current API Key: ${apiKey!.substring(0, 10)}...${apiKey!.substring(apiKey!.length - 4)}`);
  
  try {
    // Check basic endpoint and analyze rate limits
    logger.info('\nChecking Platform Status endpoint and rate limits...');
    const response = await axios.get('https://na1.api.riotgames.com/lol/status/v4/platform-data', {
      headers: { 'X-Riot-Token': apiKey }
    });
    
    logger.info('✅ Platform Status: Working');
    
    // Analyze rate limits to determine key type
    const appLimit = response.headers['x-app-rate-limit'];
    const methodLimit = response.headers['x-method-rate-limit'];
    
    logger.info('\n📊 Rate Limit Analysis:');
    logger.info(`App Rate Limit: ${appLimit}`);
    logger.info(`Method Rate Limit: ${methodLimit}`);
    
    // Personal keys have higher rate limits
    if (appLimit && appLimit.includes('100:120')) {
      logger.info('\n✅✅✅ PERSONAL API KEY CONFIRMED! ✅✅✅');
      logger.info('🚀 You have access to all endpoints with high rate limits!');
      
      // Test modern account endpoint (Riot ID format)
      try {
        logger.info('\nTesting modern account lookup (Riot ID format)...');
        const accountResponse = await axios.get('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Faker/T1', {
          headers: { 'X-Riot-Token': apiKey }
        });
        logger.info(`✅ Account Lookup: Success - ${accountResponse.data.gameName}#${accountResponse.data.tagLine}`);
        logger.info('🎯 Your API key is fully functional for real player analysis!');
      } catch (error: any) {
        if (error.response?.status === 404) {
          logger.info('✅ Account endpoint accessible (test account not found, but endpoint works)');
        } else {
          logger.warn('⚠️ Account lookup had issues, but this is normal for some regions/players');
        }
      }
      
    } else if (appLimit && appLimit.includes('20:1')) {
      logger.warn('\n⚠️⚠️⚠️ DEVELOPMENT API KEY DETECTED ⚠️⚠️⚠️');
      logger.warn('Development Keys expire after 24 hours and have limited access.');
      logger.warn('Apply for a Personal API Key at: https://developer.riotgames.com/');
    } else {
      logger.info('\n❓ Unable to determine key type from rate limits');
      logger.info(`Rate limit string: ${appLimit}`);
      logger.info('Your key appears to be working, but rate limit format is unexpected.');
    }
    
  } catch (error: any) {
    logger.error('❌ Platform Status: Not working');
    logger.error(`Error: ${error.response?.status} ${error.response?.statusText}`);
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