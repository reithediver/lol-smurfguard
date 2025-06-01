export interface AdvancedPerformanceMetrics {
  // Core Performance Indicators
  csPerMinute: {
    average: number;
    byRole: Record<string, number>;
    percentile: number; // Compared to rank average
    improvement: number; // Rate of improvement over time
    consistency: number; // Variance in performance
  };
  
  // Lane Dominance Metrics
  laneDominance: {
    goldAdvantage: {
      at10min: number;
      at15min: number;
      average: number;
    };
    csAdvantage: {
      at10min: number;
      at15min: number;
      average: number;
    };
    firstBlood: number; // Percentage of games with first blood
    soloKills: number; // Average solo kills per game
    laneKillParticipation: number;
  };

  // Vision and Map Control
  visionMetrics: {
    wardsPerMinute: number;
    visionScore: number;
    controlWardUsage: number;
    wardSurvivalTime: number;
  };

  // Champion Mastery Analysis
  championMastery: {
    championId: number;
    championName: string;
    gamesPlayed: number;
    winRate: number;
    averageKDA: number;
    csPerMinute: number;
    goldPerMinute: number;
    damageShare: number;
    firstTimePerformance: boolean; // First few games on champion
    masteryProgression: {
      gameNumber: number;
      performance: number;
    }[];
    suspiciousIndicators: {
      highInitialPerformance: boolean;
      inconsistentProgression: boolean;
      expertLevelPlay: boolean;
    };
  };
}

export interface HistoricalAnalysis {
  // Account Timeline
  accountAge: number; // Days since account creation
  playHistory: {
    season: string;
    rank: string;
    gamesPlayed: number;
    winRate: number;
    averagePerformance: number;
  }[];

  // Playtime Patterns
  playtimeAnalysis: {
    totalGames: number;
    daysActive: number;
    averageGamesPerDay: number;
    playPatterns: {
      dailyDistribution: Record<string, number>; // Hour of day
      weeklyDistribution: Record<string, number>; // Day of week
      seasonalActivity: Record<string, number>;
    };
    gaps: {
      gapStart: Date;
      gapEnd: Date;
      durationDays: number;
      gapCategory: string; // 'Minor Gap', 'Major Gap', 'Account Switch Likely', etc.
      contextualSuspicion: number; // Higher if gap coincides with rank resets, etc.
      performanceBeforeGap: number;
      performanceAfterGap: number;
      performanceImprovement: number;
      championsBefore: any[];
      championsAfter: any[];
      newChampionExpertise: number;
      roleShift: number;
      suspicionLevel: 'low' | 'medium' | 'high' | 'extreme';
      accountSwitchProbability: number; // 0-1 probability of account switching
      redFlags: string[]; // Array of red flag descriptions
    }[];
  };

  // Skill Progression Analysis
  skillProgression: {
    improvementRate: number; // How quickly skills improve
    consistencyScore: number; // Performance variance
    learningCurve: {
      gameNumber: number;
      skillLevel: number;
      timestamp: Date;
    }[];
    anomalies: {
      suddenImprovement: boolean;
      expertKnowledge: boolean;
      inconsistentMistakes: boolean;
    };
  };
}

export interface SuspiciousPatterns {
  // Behavioral Red Flags
  accountBehavior: {
    rapidRankClimb: boolean;
    newAccountHighPerformance: boolean;
    inconsistentGameKnowledge: boolean;
    expertMechanics: boolean;
  };

  // Performance Anomalies
  performanceFlags: {
    firstTimeChampionExpertise: ChampionExpertiseFlag[];
    unnaturalConsistency: boolean;
    perfectGameSense: boolean;
    advancedStrategies: boolean;
  };

  // Social Patterns
  socialIndicators: {
    duoWithHigherRanks: boolean;
    friendListAnalysis: {
      averageFriendRank: string;
      suspiciousConnections: number;
    };
    communicationPatterns: {
      knowledgeLevel: 'beginner' | 'intermediate' | 'expert';
      gameTerminology: boolean;
      strategicCalling: boolean;
    };
  };
}

export interface ChampionExpertiseFlag {
  championId: number;
  championName: string;
  gamesPlayed: number;
  winRate: number;
  averagePerformance: number;
  redFlags: {
    immediateExpertise: boolean; // High performance from game 1
    perfectBuildPaths: boolean;
    advancedMechanics: boolean;
    optimalSkillOrder: boolean;
    situationalAdaptation: boolean;
  };
  suspicionScore: number; // 0-100
}

export interface AdvancedSmurfAnalysis {
  // Basic Info
  summonerName: string;
  region: string;
  currentRank: string;
  accountLevel: number;
  
  // Historical Context
  historicalAnalysis: HistoricalAnalysis;
  
  // Performance Deep Dive
  performanceMetrics: AdvancedPerformanceMetrics[];
  
  // Suspicious Patterns
  suspiciousPatterns: SuspiciousPatterns;
  
  // Advanced Scoring
  smurfProbability: {
    overall: number; // 0-100
    confidence: number; // How confident we are in the assessment
    breakdown: {
      historicalData: number; // 30% weight
      performanceMetrics: number; // 40% weight
      behavioralPatterns: number; // 20% weight
      socialIndicators: number; // 10% weight
    };
    reasoning: string[];
    evidenceStrength: 'weak' | 'moderate' | 'strong' | 'overwhelming';
  };

  // Detailed Report
  detailedReport: {
    summary: string;
    keyFindings: string[];
    timeline: {
      date: Date;
      event: string;
      significance: string;
      suspicionImpact: number;
    }[];
    recommendations: string[];
    comparisonToLegitPlayers: {
      similarRankAverage: Record<string, number>;
      percentileRankings: Record<string, number>;
    };
  };

  // Metadata
  analysisTimestamp: Date;
  dataQuality: {
    gamesCovered: number;
    timeSpanDays: number;
    missingData: string[];
    reliabilityScore: number;
  };
} 