"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables from .env file
dotenv_1.default.config();
async function testRiotApiKey() {
    // Check .env file content
    try {
        const envContent = fs_1.default.readFileSync('.env', 'utf8');
        console.log('Current .env file content:');
        console.log(envContent);
    }
    catch (err) {
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
        const response = await axios_1.default.get('https://na1.api.riotgames.com/lol/status/v4/platform-data', {
            headers: {
                'X-Riot-Token': apiKey
            }
        });
        console.log('Riot API status response:', JSON.stringify(response.data, null, 2));
        // Try a summoner lookup
        try {
            const summonerResponse = await axios_1.default.get('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Bjergsen', {
                headers: {
                    'X-Riot-Token': apiKey
                }
            });
            console.log('Summoner lookup successful:', JSON.stringify(summonerResponse.data, null, 2));
        }
        catch (summonerError) {
            console.error('Summoner lookup failed:', summonerError.response?.status, summonerError.response?.data || summonerError.message);
        }
        process.exit(0);
    }
    catch (error) {
        console.error('Riot API key test failed:', error.response?.status, error.response?.data || error.message);
        process.exit(1);
    }
}
testRiotApiKey();
