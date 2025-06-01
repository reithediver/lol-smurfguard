// Application Configuration
export interface AppConfig {
  // Server Configuration
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };

  // Riot API Configuration
  riotApi: {
    apiKey: string;
    baseUrl: string;
    rateLimits: {
      appRateLimit: {
        requests: number;
        windowSeconds: number;
      };
      methodRateLimit: {
        requests: number;
        windowSeconds: number;
      };
    };
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };

  // Smurf Detection Configuration
  smurfDetection: {
    thresholds: {
      winRateThreshold: number;
      kdaThreshold: number;
      csPerMinuteThreshold: number;
      playtimeGapHours: number;
      minimumGamesForAnalysis: number;
    };
    weights: {
      playtimeGaps: number;
      championPerformance: number;
      summonerSpellUsage: number;
      playerAssociations: number;
      skillProgression: number;
    };
    analysis: {
      maxMatchesToAnalyze: number;
      maxDaysBack: number;
      includeNormalGames: boolean;
      includeRankedGames: boolean;
      includeAramGames: boolean;
    };
  };

  // Caching Configuration
  cache: {
    enabled: boolean;
    provider: 'memory' | 'redis';
    redis?: {
      host: string;
      port: number;
      password?: string;
      db: number;
    };
    ttl: {
      summonerData: number; // seconds
      matchData: number;
      championMastery: number;
      analysis: number;
    };
  };

  // Database Configuration
  database: {
    enabled: boolean;
    provider: 'sqlite' | 'postgres' | 'mysql';
    connection: {
      host?: string;
      port?: number;
      database: string;
      username?: string;
      password?: string;
      filename?: string; // for SQLite
    };
    pool: {
      min: number;
      max: number;
      acquireTimeoutMillis: number;
      idleTimeoutMillis: number;
    };
  };

  // Logging Configuration
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'simple';
    file: {
      enabled: boolean;
      filename: string;
      maxSize: string;
      maxFiles: number;
    };
    console: {
      enabled: boolean;
      colorize: boolean;
    };
  };

  // Security Configuration
  security: {
    apiKeyValidation: boolean;
    rateLimiting: {
      enabled: boolean;
      windowMs: number;
      maxRequests: number;
    };
    cors: {
      enabled: boolean;
      allowedOrigins: string[];
      allowedMethods: string[];
      allowedHeaders: string[];
    };
  };

  // Development Configuration
  development: {
    mockApiResponses: boolean;
    debugMode: boolean;
    hotReload: boolean;
    testDataEnabled: boolean;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
  },

  riotApi: {
    apiKey: process.env.RIOT_API_KEY || '',
    baseUrl: process.env.RIOT_API_BASE_URL || 'https://americas.api.riotgames.com',
    rateLimits: {
      appRateLimit: {
        requests: parseInt(process.env.RIOT_APP_RATE_LIMIT_REQUESTS || '20'),
        windowSeconds: parseInt(process.env.RIOT_APP_RATE_LIMIT_WINDOW || '1'),
      },
      methodRateLimit: {
        requests: parseInt(process.env.RIOT_METHOD_RATE_LIMIT_REQUESTS || '100'),
        windowSeconds: parseInt(process.env.RIOT_METHOD_RATE_LIMIT_WINDOW || '120'),
      },
    },
    timeout: parseInt(process.env.RIOT_API_TIMEOUT || '10000'),
    retryAttempts: parseInt(process.env.RIOT_API_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.RIOT_API_RETRY_DELAY || '1000'),
  },

  smurfDetection: {
    thresholds: {
      winRateThreshold: parseFloat(process.env.SMURF_WIN_RATE_THRESHOLD || '0.7'),
      kdaThreshold: parseFloat(process.env.SMURF_KDA_THRESHOLD || '3.0'),
      csPerMinuteThreshold: parseFloat(process.env.SMURF_CS_THRESHOLD || '8.0'),
      playtimeGapHours: parseInt(process.env.SMURF_GAP_HOURS || '168'), // 7 days
      minimumGamesForAnalysis: parseInt(process.env.SMURF_MIN_GAMES || '10'),
    },
    weights: {
      playtimeGaps: parseFloat(process.env.SMURF_WEIGHT_GAPS || '0.25'),
      championPerformance: parseFloat(process.env.SMURF_WEIGHT_PERFORMANCE || '0.35'),
      summonerSpellUsage: parseFloat(process.env.SMURF_WEIGHT_SPELLS || '0.15'),
      playerAssociations: parseFloat(process.env.SMURF_WEIGHT_ASSOCIATIONS || '0.15'),
      skillProgression: parseFloat(process.env.SMURF_WEIGHT_PROGRESSION || '0.10'),
    },
    analysis: {
      maxMatchesToAnalyze: parseInt(process.env.SMURF_MAX_MATCHES || '50'),
      maxDaysBack: parseInt(process.env.SMURF_MAX_DAYS_BACK || '90'),
      includeNormalGames: process.env.SMURF_INCLUDE_NORMAL !== 'false',
      includeRankedGames: process.env.SMURF_INCLUDE_RANKED !== 'false',
      includeAramGames: process.env.SMURF_INCLUDE_ARAM === 'true',
    },
  },

  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    provider: (process.env.CACHE_PROVIDER as 'memory' | 'redis') || 'memory',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    },
    ttl: {
      summonerData: parseInt(process.env.CACHE_TTL_SUMMONER || '300'), // 5 minutes
      matchData: parseInt(process.env.CACHE_TTL_MATCH || '86400'), // 24 hours
      championMastery: parseInt(process.env.CACHE_TTL_MASTERY || '3600'), // 1 hour
      analysis: parseInt(process.env.CACHE_TTL_ANALYSIS || '1800'), // 30 minutes
    },
  },

  database: {
    enabled: process.env.DATABASE_ENABLED === 'true',
    provider: (process.env.DATABASE_PROVIDER as 'sqlite' | 'postgres' | 'mysql') || 'sqlite',
    connection: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'smurf_detector.db',
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      filename: process.env.DATABASE_FILENAME || './storage/smurf_detector.db',
    },
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
      max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
      acquireTimeoutMillis: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '60000'),
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
    },
  },

  logging: {
    level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
    format: (process.env.LOG_FORMAT as 'json' | 'simple') || 'simple',
    file: {
      enabled: process.env.LOG_FILE_ENABLED !== 'false',
      filename: process.env.LOG_FILE_NAME || 'combined.log',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5'),
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
      colorize: process.env.LOG_CONSOLE_COLORIZE !== 'false',
    },
  },

  security: {
    apiKeyValidation: process.env.SECURITY_API_KEY_VALIDATION !== 'false',
    rateLimiting: {
      enabled: process.env.SECURITY_RATE_LIMIT_ENABLED !== 'false',
      windowMs: parseInt(process.env.SECURITY_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.SECURITY_RATE_LIMIT_MAX || '100'),
    },
    cors: {
      enabled: process.env.SECURITY_CORS_ENABLED !== 'false',
      allowedOrigins: process.env.SECURITY_CORS_ORIGINS?.split(',') || ['*'],
      allowedMethods: process.env.SECURITY_CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: process.env.SECURITY_CORS_HEADERS?.split(',') || ['Content-Type', 'Authorization'],
    },
  },

  development: {
    mockApiResponses: process.env.DEV_MOCK_API === 'true',
    debugMode: process.env.DEV_DEBUG === 'true' || process.env.NODE_ENV === 'development',
    hotReload: process.env.DEV_HOT_RELOAD === 'true',
    testDataEnabled: process.env.DEV_TEST_DATA === 'true',
  },
};

// Configuration validation
export function validateConfig(config: AppConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!config.riotApi.apiKey && !config.development.mockApiResponses) {
    errors.push('RIOT_API_KEY is required unless mock API responses are enabled');
  }

  // Validate rate limit weights sum to 1
  const weightSum = Object.values(config.smurfDetection.weights).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    errors.push(`Smurf detection weights must sum to 1.0, currently sum to ${weightSum}`);
  }

  // Validate thresholds are in valid ranges
  if (config.smurfDetection.thresholds.winRateThreshold < 0 || config.smurfDetection.thresholds.winRateThreshold > 1) {
    errors.push('Win rate threshold must be between 0 and 1');
  }

  if (config.smurfDetection.thresholds.kdaThreshold < 0) {
    errors.push('KDA threshold must be positive');
  }

  if (config.smurfDetection.thresholds.csPerMinuteThreshold < 0) {
    errors.push('CS per minute threshold must be positive');
  }

  // Validate cache configuration
  if (config.cache.enabled && config.cache.provider === 'redis' && !config.cache.redis?.host) {
    errors.push('Redis host is required when using Redis cache provider');
  }

  // Validate database configuration
  if (config.database.enabled) {
    if (config.database.provider !== 'sqlite' && (!config.database.connection.host || !config.database.connection.username)) {
      errors.push('Database host and username are required for non-SQLite databases');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Export the configuration
export const appConfig = defaultConfig;

// Runtime configuration validation
const validation = validateConfig(appConfig);
if (!validation.isValid) {
  console.error('Configuration validation failed:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

export default appConfig; 