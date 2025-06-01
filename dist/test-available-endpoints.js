"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
// Load environment variables from .env file
dotenv_1.default.config();
async function testMultipleEndpoints() {
    // Get the API key from environment variable
    const apiKey = process.env.RIOT_API_KEY;
    console.log(`Testing Riot API key: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined'}`);
    if (!apiKey) {
        console.error('No RIOT_API_KEY found in environment variables');
        process.exit(1);
    }
    const headers = { 'X-Riot-Token': apiKey };
    // List of endpoints to test
    const endpoints = [
        {
            name: "Platform Data",
            url: "https://na1.api.riotgames.com/lol/status/v4/platform-data",
            method: "get",
            params: {}
        },
        {
            name: "Free Champion Rotation",
            url: "https://na1.api.riotgames.com/lol/platform/v3/champion-rotations",
            method: "get",
            params: {}
        },
        {
            name: "Summoner by Name (Bjergsen)",
            url: "https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Bjergsen",
            method: "get",
            params: {}
        },
        {
            name: "Summoner by Name (Reinegade)",
            url: "https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Reinegade",
            method: "get",
            params: {}
        },
        {
            name: "Featured Games",
            url: "https://na1.api.riotgames.com/lol/spectator/v4/featured-games",
            method: "get",
            params: {}
        },
        {
            name: "Challenger League",
            url: "https://na1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5",
            method: "get",
            params: {}
        }
    ];
    // Test each endpoint
    for (const endpoint of endpoints) {
        console.log(`\nTesting endpoint: ${endpoint.name}`);
        try {
            const response = await (0, axios_1.default)({
                method: endpoint.method,
                url: endpoint.url,
                headers,
                params: endpoint.params
            });
            console.log(`✅ SUCCESS (${response.status}): ${endpoint.name}`);
            // Print a brief summary of the response
            if (typeof response.data === 'object') {
                if (Array.isArray(response.data)) {
                    console.log(`  Response: Array with ${response.data.length} items`);
                }
                else {
                    console.log(`  Response: Object with keys ${Object.keys(response.data).join(', ')}`);
                }
            }
            else {
                console.log(`  Response: ${response.data}`);
            }
        }
        catch (error) {
            console.error(`❌ FAILED (${error.response?.status || 'unknown'}): ${endpoint.name}`);
            console.error(`  Error: ${error.response?.data?.status?.message || error.message}`);
        }
    }
}
testMultipleEndpoints();
