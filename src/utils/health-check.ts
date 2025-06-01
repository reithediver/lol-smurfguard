import axios from 'axios';
import { logger } from './loggerService';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    api: boolean;
    database: boolean;
    riotApi: boolean;
    cache: boolean;
  };
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
}

class HealthChecker {
  private startTime: number;
  private version: string;
  private environment: string;

  constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '0.1.0';
    this.environment = process.env.NODE_ENV || 'development';
  }

  async checkApi(): Promise<boolean> {
    try {
      // Check if the API server is responding
      const baseUrl = process.env.API_URL || 'http://localhost:3001';
      const response = await axios.get(`${baseUrl}/api/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('API health check failed:', error);
      return false;
    }
  }

  async checkDatabase(): Promise<boolean> {
    try {
      // Since we're using on-demand fetching without persistent storage,
      // we'll check if our data fetching service is operational
      return true; // Always healthy for now since we don't use persistent DB
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  async checkRiotApi(): Promise<boolean> {
    try {
      // Test Riot API connectivity
      const apiKey = process.env.RIOT_API_KEY;
      if (!apiKey) {
        logger.warn('Riot API key not configured');
        return false;
      }

      const response = await axios.get(
        `https://na1.api.riotgames.com/lol/status/v4/platform-data?api_key=${apiKey}`,
        { timeout: 10000 }
      );
      return response.status === 200;
    } catch (error) {
      logger.error('Riot API health check failed:', error);
      return false;
    }
  }

  async checkCache(): Promise<boolean> {
    try {
      // Check if our caching service is operational
      // Since we use in-memory caching, this should always be healthy
      return true;
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();

    logger.info('Performing health check...');

    const [api, database, riotApi, cache] = await Promise.all([
      this.checkApi(),
      this.checkDatabase(),
      this.checkRiotApi(),
      this.checkCache()
    ]);

    const checks = { api, database, riotApi, cache };
    const allHealthy = Object.values(checks).every(check => check);
    const status = allHealthy ? 'healthy' : 'unhealthy';

    const result: HealthCheckResult = {
      status,
      timestamp,
      version: this.version,
      environment: this.environment,
      checks,
      uptime,
      memoryUsage
    };

    logger.info('Health check completed:', result);
    return result;
  }
}

// Export for use as a module
export const healthChecker = new HealthChecker();

// CLI execution
if (require.main === module) {
  async function runHealthCheck() {
    try {
      const result = await healthChecker.performHealthCheck();
      console.log(JSON.stringify(result, null, 2));
      
      if (result.status === 'unhealthy') {
        process.exit(1);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Health check failed:', error);
      process.exit(1);
    }
  }

  runHealthCheck();
} 