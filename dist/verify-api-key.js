"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const loggerService_1 = require("./utils/loggerService");
// Load environment variables
dotenv_1.default.config();
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
    loggerService_1.logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
    process.exit(1);
}
async function checkApiKeyType() {
    loggerService_1.logger.info('====================================================');
    loggerService_1.logger.info('API Key Verification Tool');
    loggerService_1.logger.info('====================================================');
    loggerService_1.logger.info(`Current API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    try {
        // First, check if we can access basic endpoints
        loggerService_1.logger.info('\nChecking Platform Status endpoint (should work with any key)...');
        await axios_1.default.get('https://na1.api.riotgames.com/lol/status/v4/platform-data', {
            headers: { 'X-Riot-Token': apiKey }
        });
        loggerService_1.logger.info('✅ Platform Status: Working');
        try {
            // Now check if we can access summoner data (requires Personal API Key)
            loggerService_1.logger.info('\nChecking Summoner endpoint (requires Personal API Key)...');
            await axios_1.default.get('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/Doublelift', {
                headers: { 'X-Riot-Token': apiKey }
            });
            loggerService_1.logger.info('✅ Summoner Data: Working');
            loggerService_1.logger.info('\n✅✅✅ SUCCESS: You are using a Personal API Key! ✅✅✅');
            try {
                // Try match history which also requires Personal API Key
                loggerService_1.logger.info('\nChecking Match History endpoint (requires Personal API Key)...');
                const knownPuuid = "O7JD9TRWpWwS8TYnBKNPz9sE-FE6ZTGPZXBYnNypYfGfL8c7_HNAslnYKCIW5Yf56DXmcOu_N8yw8g";
                await axios_1.default.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${knownPuuid}/ids?start=0&count=1`, {
                    headers: { 'X-Riot-Token': apiKey }
                });
                loggerService_1.logger.info('✅ Match History: Working');
            }
            catch (error) {
                loggerService_1.logger.warn('⚠️ Match History: Not working, but Summoner data works');
                loggerService_1.logger.warn('This is unusual for a Personal API Key. You might have specific endpoint restrictions.');
            }
        }
        catch (error) {
            loggerService_1.logger.error('❌ Summoner Data: Not working');
            loggerService_1.logger.error('\n❌❌❌ ALERT: You are using a Development API Key! ❌❌❌');
            loggerService_1.logger.error('Development Keys expire after 24 hours and cannot access summoner or match data.');
            loggerService_1.logger.error('Apply for a Personal API Key at: https://developer.riotgames.com/');
        }
    }
    catch (error) {
        loggerService_1.logger.error('❌ Platform Status: Not working');
        loggerService_1.logger.error('\n⚠️⚠️⚠️ CRITICAL ERROR: Your API key is invalid or has expired! ⚠️⚠️⚠️');
        loggerService_1.logger.error('Get a new API key at: https://developer.riotgames.com/');
    }
    loggerService_1.logger.info('\n====================================================');
    loggerService_1.logger.info('API Key verification complete');
    loggerService_1.logger.info('====================================================');
}
checkApiKeyType().catch(error => {
    loggerService_1.logger.error('Unhandled error during API verification:', error);
});
