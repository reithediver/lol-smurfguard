export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  api: {
    port: number;
    baseUrl: string;
    corsOrigins: string[];
    rateLimiting: {
      windowMs: number;
      max: number;
    };
  };
  frontend: {
    buildPath: string;
    baseUrl: string;
  };
  monitoring: {
    healthCheckInterval: number;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableMetrics: boolean;
    enableErrorTracking: boolean;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  security: {
    enableHelmet: boolean;
    enableCors: boolean;
    trustProxy: boolean;
  };
}

const baseConfig: Omit<DeploymentConfig, 'environment' | 'api' | 'frontend'> = {
  monitoring: {
    healthCheckInterval: 30000, // 30 seconds
    logLevel: 'info',
    enableMetrics: true,
    enableErrorTracking: true,
  },
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 100,
  },
  security: {
    enableHelmet: true,
    enableCors: true,
    trustProxy: false,
  },
};

export const deploymentConfigs: Record<string, DeploymentConfig> = {
  development: {
    ...baseConfig,
    environment: 'development',
    api: {
      port: parseInt(process.env.PORT || '3001'),
      baseUrl: 'http://localhost:3001',
      corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // Very permissive for development
      },
    },
    frontend: {
      buildPath: '../frontend/build',
      baseUrl: 'http://localhost:3000',
    },
    monitoring: {
      ...baseConfig.monitoring,
      logLevel: 'debug',
      enableMetrics: false,
    },
  },

  staging: {
    ...baseConfig,
    environment: 'staging',
    api: {
      port: parseInt(process.env.PORT || '3001'),
      baseUrl: process.env.STAGING_API_URL || 'https://staging-api.league-smurf-detector.com',
      corsOrigins: [
        process.env.STAGING_FRONTEND_URL || 'https://staging.league-smurf-detector.com',
        'https://staging-api.league-smurf-detector.com',
      ],
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Moderate limiting for staging
      },
    },
    frontend: {
      buildPath: './frontend/build',
      baseUrl: process.env.STAGING_FRONTEND_URL || 'https://staging.league-smurf-detector.com',
    },
    monitoring: {
      ...baseConfig.monitoring,
      logLevel: 'info',
    },
    security: {
      ...baseConfig.security,
      trustProxy: true,
    },
  },

  production: {
    ...baseConfig,
    environment: 'production',
    api: {
      port: parseInt(process.env.PORT || '3001'),
      baseUrl: process.env.PRODUCTION_API_URL || 'https://api.league-smurf-detector.com',
      corsOrigins: [
        process.env.PRODUCTION_FRONTEND_URL || 'https://league-smurf-detector.com',
        'https://api.league-smurf-detector.com',
      ],
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50, // Strict limiting for production
      },
    },
    frontend: {
      buildPath: './frontend/build',
      baseUrl: process.env.PRODUCTION_FRONTEND_URL || 'https://league-smurf-detector.com',
    },
    monitoring: {
      ...baseConfig.monitoring,
      logLevel: 'warn',
      enableMetrics: true,
      enableErrorTracking: true,
    },
    security: {
      ...baseConfig.security,
      trustProxy: true,
    },
  },
};

export function getDeploymentConfig(): DeploymentConfig {
  const environment = (process.env.NODE_ENV || 'development') as keyof typeof deploymentConfigs;
  const config = deploymentConfigs[environment];
  
  if (!config) {
    throw new Error(`Invalid environment: ${environment}`);
  }
  
  return config;
}

export default getDeploymentConfig; 