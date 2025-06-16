"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyValidator = void 0;
const RiotApi_1 = require("../api/RiotApi");
const loggerService_1 = __importDefault(require("./loggerService"));
class ApiKeyValidator {
    constructor(apiKey) {
        this.testRegions = ['na1', 'euw1', 'kr', 'jp1'];
        this.riotApi = new RiotApi_1.RiotApi(apiKey, 'na1');
    }
    async validateApiKey() {
        loggerService_1.default.info('🔍 Starting comprehensive API key validation...');
        const result = {
            isValid: false,
            keyType: 'unknown',
            permissions: {
                summonerData: false,
                matchData: false,
                challengerData: false,
                championRotation: false,
                platformData: false,
                spectatorData: false
            },
            rateLimit: {
                personalLimit: 0,
                applicationLimit: 0
            },
            regions: [],
            validationTimestamp: new Date(),
            errors: [],
            warnings: [],
            recommendations: []
        };
        try {
            // Test basic connectivity
            await this.testBasicConnectivity(result);
            // Test permissions
            await this.testPermissions(result);
            // Detect rate limits
            await this.detectRateLimits(result);
            // Test regional access
            await this.testRegionalAccess(result);
            // Determine key type
            this.determineKeyType(result);
            // Generate recommendations
            this.generateRecommendations(result);
            loggerService_1.default.info(`✅ API key validation completed. Key type: ${result.keyType}`);
        }
        catch (error) {
            loggerService_1.default.error('❌ API key validation failed:', error);
            result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return result;
    }
    async testBasicConnectivity(result) {
        try {
            loggerService_1.default.info('Testing basic API connectivity...');
            // Test with a simple platform status call
            const platform = await this.riotApi.request('/lol/status/v4/platform-data');
            if (platform) {
                result.isValid = true;
                result.permissions.platformData = true;
                loggerService_1.default.info('✅ Basic connectivity successful');
            }
        }
        catch (error) {
            loggerService_1.default.error('❌ Basic connectivity failed:', error);
            result.errors.push('Failed basic connectivity test');
            throw error;
        }
    }
    async testPermissions(result) {
        loggerService_1.default.info('Testing API permissions...');
        // Test summoner data access
        try {
            await this.riotApi.request('/lol/summoner/v4/summoners/by-name/test');
            result.permissions.summonerData = true;
            loggerService_1.default.info('✅ Summoner data access confirmed');
        }
        catch (error) {
            if (error.status === 404) {
                result.permissions.summonerData = true; // 404 means we can access the endpoint
                loggerService_1.default.info('✅ Summoner data access confirmed (test summoner not found - expected)');
            }
            else if (error.status === 403) {
                result.permissions.summonerData = false;
                result.warnings.push('No access to summoner data endpoints');
                loggerService_1.default.warn('⚠️ No access to summoner data endpoints');
            }
        }
        // Test match data access
        try {
            await this.riotApi.request('/lol/match/v5/matches/test');
            result.permissions.matchData = true;
            loggerService_1.default.info('✅ Match data access confirmed');
        }
        catch (error) {
            if (error.status === 404) {
                result.permissions.matchData = true; // 404 means we can access the endpoint
                loggerService_1.default.info('✅ Match data access confirmed (test match not found - expected)');
            }
            else if (error.status === 403) {
                result.permissions.matchData = false;
                result.warnings.push('No access to match data endpoints');
                loggerService_1.default.warn('⚠️ No access to match data endpoints');
            }
        }
        // Test challenger data access
        try {
            await this.riotApi.request('/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5');
            result.permissions.challengerData = true;
            loggerService_1.default.info('✅ Challenger data access confirmed');
        }
        catch (error) {
            if (error.status === 403) {
                result.permissions.challengerData = false;
                result.warnings.push('No access to challenger league endpoints');
                loggerService_1.default.warn('⚠️ No access to challenger league endpoints');
            }
        }
        // Test champion rotation access
        try {
            await this.riotApi.request('/lol/platform/v3/champion-rotations');
            result.permissions.championRotation = true;
            loggerService_1.default.info('✅ Champion rotation access confirmed');
        }
        catch (error) {
            if (error.status === 403) {
                result.permissions.championRotation = false;
                result.warnings.push('No access to champion rotation endpoints');
                loggerService_1.default.warn('⚠️ No access to champion rotation endpoints');
            }
        }
        // Test spectator data access
        try {
            await this.riotApi.request('/lol/spectator/v4/featured-games');
            result.permissions.spectatorData = true;
            loggerService_1.default.info('✅ Spectator data access confirmed');
        }
        catch (error) {
            if (error.status === 403) {
                result.permissions.spectatorData = false;
                result.warnings.push('No access to spectator endpoints');
                loggerService_1.default.warn('⚠️ No access to spectator endpoints');
            }
        }
    }
    async detectRateLimits(result) {
        loggerService_1.default.info('Detecting rate limits...');
        // Make a test request and check response headers
        try {
            const response = await this.riotApi.requestWithHeaders('/lol/status/v4/platform-data');
            const personalRateLimit = response.headers['x-rate-limit-type'];
            const appRateLimit = response.headers['x-app-rate-limit'];
            const personalRateLimit2 = response.headers['x-personal-rate-limit'];
            if (personalRateLimit2) {
                const limits = personalRateLimit2.split(',');
                const personalLimit = limits[0]?.split(':')[1];
                if (personalLimit) {
                    result.rateLimit.personalLimit = parseInt(personalLimit);
                }
            }
            if (appRateLimit) {
                const limits = appRateLimit.split(',');
                const appLimit = limits[0]?.split(':')[1];
                if (appLimit) {
                    result.rateLimit.applicationLimit = parseInt(appLimit);
                }
            }
            loggerService_1.default.info(`📊 Rate limits detected - Personal: ${result.rateLimit.personalLimit}/s, App: ${result.rateLimit.applicationLimit}/s`);
        }
        catch (error) {
            loggerService_1.default.warn('Could not detect rate limits from response headers');
        }
    }
    async testRegionalAccess(result) {
        loggerService_1.default.info('Testing regional access...');
        for (const region of this.testRegions) {
            try {
                const regionalApi = new RiotApi_1.RiotApi(this.riotApi.apiKey, region);
                await regionalApi.request('/lol/status/v4/platform-data');
                result.regions.push(region);
                loggerService_1.default.info(`✅ Access confirmed for region: ${region}`);
            }
            catch (error) {
                loggerService_1.default.warn(`❌ No access to region: ${region}`);
            }
        }
    }
    determineKeyType(result) {
        const permissions = result.permissions;
        const rateLimit = result.rateLimit;
        if (permissions.summonerData && permissions.matchData && rateLimit.personalLimit >= 100) {
            result.keyType = 'production';
        }
        else if (permissions.summonerData && permissions.matchData && rateLimit.personalLimit >= 20) {
            result.keyType = 'personal';
        }
        else if (permissions.championRotation || permissions.challengerData) {
            result.keyType = 'development';
        }
        else {
            result.keyType = 'unknown';
        }
    }
    generateRecommendations(result) {
        const permissions = result.permissions;
        const keyType = result.keyType;
        if (keyType === 'development') {
            result.recommendations.push('Consider applying for a Personal API Key for full summoner and match data access', 'Visit https://developer.riotgames.com/app-type to apply for higher tier access');
        }
        if (keyType === 'personal') {
            result.recommendations.push('Your Personal API Key provides good access for development and testing', 'For production use with high traffic, consider applying for Production API Key');
        }
        if (!permissions.summonerData) {
            result.recommendations.push('Summoner data access required for smurf detection functionality', 'Current API key cannot access core features');
        }
        if (!permissions.matchData) {
            result.recommendations.push('Match data access required for comprehensive smurf analysis', 'Current API key has limited functionality');
        }
        if (result.regions.length < 2) {
            result.recommendations.push('Limited regional access detected', 'Consider testing with different regions if needed for your use case');
        }
        if (result.rateLimit.personalLimit < 20) {
            result.recommendations.push('Low rate limit detected - may impact performance with multiple users', 'Consider upgrading API key tier for better performance');
        }
    }
    // Quick validation for startup
    async quickValidation() {
        try {
            await this.riotApi.request('/lol/status/v4/platform-data');
            return { isValid: true, message: 'API key is valid and functional' };
        }
        catch (error) {
            return {
                isValid: false,
                message: `API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}
exports.ApiKeyValidator = ApiKeyValidator;
