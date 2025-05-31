import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

async function testRiotApiKey() {
  // Check .env file content
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log('Current .env file content:');
    console.log(envContent);
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
  
  // Get the API key from environment variable
  const apiKey = process.env.RIOT_API_KEY;
  
  // Print a masked version of the key for debugging
  console.log(`Testing Riot API key: ${apiKey ? apiKey : 'undefined'}`);
  
  if (!apiKey) {
    console.error('No RIOT_API_KEY found in environment variables');
    process.exit(1);
  }
  
  try {
    // Simple test endpoint that doesn't require parameters
    const response = await axios.get('https://na1.api.riotgames.com/lol/status/v4/platform-data', {
      headers: {
        'X-Riot-Token': apiKey
      }
    });
    
    console.log('Riot API status response:', JSON.stringify(response.data, null, 2));
    
    // Try a summoner lookup
    try {
      const summonerResponse = await axios.get('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Bjergsen', {
        headers: {
          'X-Riot-Token': apiKey
        }
      });
      console.log('Summoner lookup successful:', JSON.stringify(summonerResponse.data, null, 2));
    } catch (summonerError: any) {
      console.error('Summoner lookup failed:', summonerError.response?.status, summonerError.response?.data || summonerError.message);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Riot API key test failed:', error.response?.status, error.response?.data || error.message);
    process.exit(1);
  }
}

testRiotApiKey(); 