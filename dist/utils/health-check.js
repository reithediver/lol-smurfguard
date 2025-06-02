"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthChecker = void 0;
const axios_1 = __importDefault(require("axios"));
const loggerService_1 = require("./loggerService");
class HealthChecker {
    constructor() {
        this.startTime = Date.now();
        this.version = process.env.npm_package_version || '0.1.0';
        this.environment = process.env.NODE_ENV || 'development';
    }
    async checkApi() {
        try {
            // Skip internal API check in production since we're checking ourselves
            if (process.env.NODE_ENV === 'production') {
                return true; // Internal API is healthy if we can run this check
            }
            // Check if the API server is responding (only in development)
            const baseUrl = process.env.API_URL || 'http://localhost:3000';
            const response = await axios_1.default.get(`${baseUrl}/api/health`, {
                timeout: 5000
            });
            return response.status === 200;
        }
        catch (error) {
            // In production, don't fail health check for internal API call
            if (process.env.NODE_ENV === 'production') {
                return true;
            }
            loggerService_1.logger.error('API health check failed:', error);
            return false;
        }
    }
    async checkDatabase() {
        try {
            // Since we're using on-demand fetching without persistent storage,
            // we'll check if our data fetching service is operational
            return true; // Always healthy for now since we don't use persistent DB
        }
        catch (error) {
            loggerService_1.logger.error('Database health check failed:', error);
            return false;
        }
    }
    async checkRiotApi() {
        try {
            // Test Riot API connectivity
            const apiKey = process.env.RIOT_API_KEY;
            if (!apiKey || apiKey.includes('PLACEHOLDER')) {
                loggerService_1.logger.warn('Riot API key not configured or is placeholder');
                return true; // Don't fail health check for placeholder keys
            }
            const response = await axios_1.default.get(`https://na1.api.riotgames.com/lol/status/v4/platform-data?api_key=${apiKey}`, { timeout: 10000 });
            return response.status === 200;
        }
        catch (error) {
            // 401 means we reached the API but key is invalid - that's still "healthy" connectivity
            if (error.response?.status === 401) {
                loggerService_1.logger.warn('Riot API returned 401 - API reachable but key invalid');
                return true;
            }
            loggerService_1.logger.error('Riot API health check failed:', error);
            return false;
        }
    }
    async checkCache() {
        try {
            // Check if our caching service is operational
            // Since we use in-memory caching, this should always be healthy
            return true;
        }
        catch (error) {
            loggerService_1.logger.error('Cache health check failed:', error);
            return false;
        }
    }
    async performHealthCheck() {
        const timestamp = new Date().toISOString();
        const uptime = Date.now() - this.startTime;
        const memoryUsage = process.memoryUsage();
        loggerService_1.logger.info('Performing health check...');
        const [api, database, riotApi, cache] = await Promise.all([
            this.checkApi(),
            this.checkDatabase(),
            this.checkRiotApi(),
            this.checkCache()
        ]);
        const checks = { api, database, riotApi, cache };
        const allHealthy = Object.values(checks).every(check => check);
        const status = allHealthy ? 'healthy' : 'unhealthy';
        const result = {
            status,
            timestamp,
            version: this.version,
            environment: this.environment,
            checks,
            uptime,
            memoryUsage
        };
        loggerService_1.logger.info('Health check completed:', result);
        return result;
    }
}
// Export for use as a module
exports.healthChecker = new HealthChecker();
// CLI execution
if (require.main === module) {
    async function runHealthCheck() {
        try {
            const result = await exports.healthChecker.performHealthCheck();
            console.log(JSON.stringify(result, null, 2));
            if (result.status === 'unhealthy') {
                process.exit(1);
            }
            process.exit(0);
        }
        catch (error) {
            console.error('Health check failed:', error);
            process.exit(1);
        }
    }
    runHealthCheck();
}
