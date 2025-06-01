import dotenv from 'dotenv';
import axios, { AxiosError } from 'axios';
import { logger } from './utils/loggerService';

// Load environment variables
dotenv.config();

const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

async function testApiAccess() {
  logger.info('Testing Riot API access with current key...');
  
  // 1. Test platform data (should work with any key)
  try {
    logger.info('Testing platform status endpoint...');
    const platformResponse = await axios.get('https://na1.api.riotgames.com/lol/status/v4/platform-data', {
      headers: {
        'X-Riot-Token': apiKey
      }
    });
    logger.info('✅ Platform status endpoint accessible!');
    logger.info(`Platform name: ${platformResponse.data.name}`);
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('❌ Platform status endpoint failed:', axiosError.response?.status, axiosError.response?.statusText);
  }

  // 2. Test champion rotation (should work with any key)
  try {
    logger.info('\nTesting champion rotation endpoint...');
    const rotationResponse = await axios.get('https://na1.api.riotgames.com/lol/platform/v3/champion-rotations', {
      headers: {
        'X-Riot-Token': apiKey
      }
    });
    logger.info('✅ Champion rotation endpoint accessible!');
    logger.info(`Free champion IDs: ${rotationResponse.data.freeChampionIds.slice(0, 3).join(', ')}...`);
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('❌ Champion rotation endpoint failed:', axiosError.response?.status, axiosError.response?.statusText);
  }

  // 3. Test challenger league (should work with any key)
  try {
    logger.info('\nTesting challenger league endpoint...');
    const challengerResponse = await axios.get('https://na1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5', {
      headers: {
        'X-Riot-Token': apiKey
      }
    });
    logger.info('✅ Challenger league endpoint accessible!');
    logger.info(`Number of challenger players: ${challengerResponse.data.entries.length}`);
    logger.info(`Top player: ${challengerResponse.data.entries[0].summonerName}`);
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('❌ Challenger league endpoint failed:', axiosError.response?.status, axiosError.response?.statusText);
  }

  // 4. Test summoner data (might not work with development key)
  try {
    logger.info('\nTesting summoner endpoint...');
    const summonerResponse = await axios.get('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Doublelift', {
      headers: {
        'X-Riot-Token': apiKey
      }
    });
    logger.info('✅ Summoner endpoint accessible!');
    logger.info(`Summoner name: ${summonerResponse.data.name}, Level: ${summonerResponse.data.summonerLevel}`);
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error('❌ Summoner endpoint failed:', axiosError.response?.status, axiosError.response?.statusText);
    if (axiosError.response?.status === 403) {
      logger.error('Your API key does not have permission to access summoner data.');
      logger.error('This is normal for development API keys. See API_KEY_LIMITATIONS.md for more information.');
    }
  }

  logger.info('\nAPI access test complete!');
}

testApiAccess().catch(error => {
  logger.error('Unhandled error during API test:', error);
}); 