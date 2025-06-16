"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const loggerService_1 = __importDefault(require("./utils/loggerService"));
// Load environment variables
dotenv_1.default.config();
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
    loggerService_1.default.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
    process.exit(1);
}
async function checkApiKeyType() {
    loggerService_1.default.info('====================================================');
    loggerService_1.default.info('API Key Verification Tool - Enhanced Version');
    loggerService_1.default.info('====================================================');
    loggerService_1.default.info(`Current API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    try {
        // Check basic endpoint and analyze rate limits
        loggerService_1.default.info('\nChecking Platform Status endpoint and rate limits...');
        const response = await axios_1.default.get('https://na1.api.riotgames.com/lol/status/v4/platform-data', {
            headers: { 'X-Riot-Token': apiKey }
        });
        loggerService_1.default.info('✅ Platform Status: Working');
        // Analyze rate limits to determine key type
        const appLimit = response.headers['x-app-rate-limit'];
        const methodLimit = response.headers['x-method-rate-limit'];
        loggerService_1.default.info('\n📊 Rate Limit Analysis:');
        loggerService_1.default.info(`App Rate Limit: ${appLimit}`);
        loggerService_1.default.info(`Method Rate Limit: ${methodLimit}`);
        // Personal keys have higher rate limits
        if (appLimit && appLimit.includes('100:120')) {
            loggerService_1.default.info('\n✅✅✅ PERSONAL API KEY CONFIRMED! ✅✅✅');
            loggerService_1.default.info('🚀 You have access to all endpoints with high rate limits!');
            // Test modern account endpoint (Riot ID format)
            try {
                loggerService_1.default.info('\nTesting modern account lookup (Riot ID format)...');
                const accountResponse = await axios_1.default.get('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Faker/T1', {
                    headers: { 'X-Riot-Token': apiKey }
                });
                loggerService_1.default.info(`✅ Account Lookup: Success - ${accountResponse.data.gameName}#${accountResponse.data.tagLine}`);
                loggerService_1.default.info('🎯 Your API key is fully functional for real player analysis!');
            }
            catch (error) {
                if (error.response?.status === 404) {
                    loggerService_1.default.info('✅ Account endpoint accessible (test account not found, but endpoint works)');
                }
                else {
                    loggerService_1.default.warn('⚠️ Account lookup had issues, but this is normal for some regions/players');
                }
            }
        }
        else if (appLimit && appLimit.includes('20:1')) {
            loggerService_1.default.warn('\n⚠️⚠️⚠️ DEVELOPMENT API KEY DETECTED ⚠️⚠️⚠️');
            loggerService_1.default.warn('Development Keys expire after 24 hours and have limited access.');
            loggerService_1.default.warn('Apply for a Personal API Key at: https://developer.riotgames.com/');
        }
        else {
            loggerService_1.default.info('\n❓ Unable to determine key type from rate limits');
            loggerService_1.default.info(`Rate limit string: ${appLimit}`);
            loggerService_1.default.info('Your key appears to be working, but rate limit format is unexpected.');
        }
    }
    catch (error) {
        loggerService_1.default.error('❌ Platform Status: Not working');
        loggerService_1.default.error(`Error: ${error.response?.status} ${error.response?.statusText}`);
        loggerService_1.default.error('\n⚠️⚠️⚠️ CRITICAL ERROR: Your API key is invalid or has expired! ⚠️⚠️⚠️');
        loggerService_1.default.error('Get a new API key at: https://developer.riotgames.com/');
    }
    loggerService_1.default.info('\n====================================================');
    loggerService_1.default.info('API Key verification complete');
    loggerService_1.default.info('====================================================');
}
checkApiKeyType().catch(error => {
    loggerService_1.default.error('Unhandled error during API verification:', error);
});
