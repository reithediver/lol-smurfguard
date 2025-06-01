"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
// Load environment variables from .env file
dotenv_1.default.config();
async function testSpecificAccount() {
    // Get the API key from environment variable
    const apiKey = process.env.RIOT_API_KEY;
    console.log(`Testing Riot API key: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined'}`);
    if (!apiKey) {
        console.error('No RIOT_API_KEY found in environment variables');
        process.exit(1);
    }
    const summonerName = "Reinegade";
    // Remove region tag if present (e.g., #Rei)
    const queryName = summonerName.split('#')[0];
    try {
        console.log(`Looking up summoner: ${summonerName} (querying as: ${queryName})`);
        const summonerResponse = await axios_1.default.get(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(queryName)}`, {
            headers: {
                'X-Riot-Token': apiKey
            }
        });
        console.log('Summoner lookup successful!');
        console.log('Summoner data:', JSON.stringify(summonerResponse.data, null, 2));
        // If successful, try to get match history
        try {
            const puuid = summonerResponse.data.puuid;
            console.log(`Getting match history for PUUID: ${puuid}`);
            const matchResponse = await axios_1.default.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=5`, {
                headers: {
                    'X-Riot-Token': apiKey
                }
            });
            console.log('Match history lookup successful!');
            console.log('Recent matches:', JSON.stringify(matchResponse.data, null, 2));
        }
        catch (matchError) {
            console.error('Match history lookup failed:', matchError.response?.status, matchError.response?.data || matchError.message);
        }
    }
    catch (summonerError) {
        console.error('Summoner lookup failed:', summonerError.response?.status, summonerError.response?.data || summonerError.message);
    }
}
testSpecificAccount();
