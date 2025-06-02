export interface EnhancedGameMetrics {
  // Core Performance (op.gg style)
  kda: {
    kills: number;
    deaths: number;
    assists: number;
    ratio: number;
    averageKDA: number;
  };
  
  csData: {
    total: number;
    perMinute: number;
    at10Minutes: number;
    at15Minutes: number;
    perfectCSMissed: number; // Smurf indicator
    csEfficiency: number; // Actual vs theoretical max
  };
  
  visionMetrics: {
    visionScore: number;
    wardsPlaced: number;
    wardsKilled: number;
    controlWardsPlaced: number;
    visionDensity: number; // Wards per area covered
  };
  
  damageMetrics: {
    totalDamage: number;
    damagePerMinute: number;
    damageShare: number; // % of team damage
    damageEfficiency: number; // Damage per gold spent
    damageToChampions: number;
    damageToObjectives: number;
  };
  
  goldMetrics: {
    totalGold: number;
    goldPerMinute: number;
    goldEfficiency: number;
    goldAdvantageAt10: number;
    goldAdvantageAt15: number;
  };
  
  objectiveControl: {
    dragonParticipation: number;
    baronParticipation: number;
    riftHeraldParticipation: number;
    turretDamage: number;
    epicMonsterSteals: number;
  };
}

export interface ChampionMasteryData {
  championId: number;
  championName: string;
  gamesPlayed: number;
  winRate: number;
  
  // Performance tracking
  performanceByGame: {
    gameNumber: number;
    kda: number;
    csPerMinute: number;
    damageShare: number;
    visionScore: number;
    gameLength: number;
    timestamp: Date;
  }[];
  
  // Smurf detection flags
  expertiseIndicators: {
    immediateHighPerformance: boolean; // High performance from game 1-3
    unusualBuildOptimization: boolean; // Perfect item builds immediately
    advancedMechanics: boolean; // Frame-perfect combos, etc.
    mapAwareness: boolean; // Advanced positioning/timing
    enemyTrackingKnowledge: boolean; // Knowing enemy positions/cooldowns
  };
  
  progression: {
    initialPerformance: number; // Games 1-5 average
    peakPerformance: number;
    consistencyScore: number; // Variance in performance
    learningRate: number; // How quickly they improve
  };
}

export interface HistoricalTimeline {
  // lolrewind style historical organization
  seasonData: {
    season: string;
    rank: {
      tier: string;
      division: string;
      lp: number;
      peakRank: string;
    };
    gamesPlayed: number;
    winRate: number;
    champions: ChampionMasteryData[];
    averagePerformance: number;
    monthlyBreakdown: {
      month: string;
      gamesPlayed: number;
      winRate: number;
      averagePerformance: number;
      newChampionsPlayed: number;
    }[];
  }[];
  
  // Account activity patterns
  activityAnalysis: {
    totalDaysActive: number;
    averageGamesPerDay: number;
    playTimeDistribution: {
      hourOfDay: Record<string, number>;
      dayOfWeek: Record<string, number>;
      monthOfYear: Record<string, number>;
    };
    
    // Gap analysis (crucial for smurf detection)
    inactivityGaps: {
      gapStart: Date;
      gapEnd: Date;
      durationDays: number;
      gapType: 'vacation' | 'break' | 'potential_account_switch' | 'suspicious';
      
      // Performance before vs after gap
      performanceBeforeGap: {
        averageKDA: number;
        averageCS: number;
        winRate: number;
        champions: string[];
        primaryRole: string;
      };
      
      performanceAfterGap: {
        averageKDA: number;
        averageCS: number;
        winRate: number;
        champions: string[];
        primaryRole: string;
        newChampionExpertise: boolean; // Playing new champs at high level
      };
      
      suspicionIndicators: {
        skillJump: number; // Performance improvement after gap
        roleShift: boolean; // Changed main role
        championPoolShift: boolean; // Completely different champions
        playstyleChange: boolean; // Different approach to game
        mechanicalImprovement: boolean; // Better mechanics immediately
        gameKnowledgeJump: boolean; // Better strategic decisions
      };
      
      suspicionScore: number; // 0-100 likelihood of account switching
    }[];
  };
}

export interface RankProgression {
  // Detailed rank tracking like op.gg
  currentRank: {
    tier: string;
    division: string;
    lp: number;
    promos?: {
      wins: number;
      losses: number;
      series: string;
    };
  };
  
  rankHistory: {
    timestamp: Date;
    tier: string;
    division: string;
    lp: number;
    change: number;
    gameOutcome: 'win' | 'loss';
    performance: EnhancedGameMetrics;
  }[];
  
  // Smurf detection from rank progression
  climbAnalysis: {
    winStreak: number;
    currentWinRate: number;
    climbSpeed: number; // LP gained per day
    skipDivisions: boolean; // Skipping divisions due to high MMR
    newAccountRapidClimb: boolean; // Climbing too fast for new player
    mmrDiscrepancy: boolean; // Playing against much higher ranks
  };
}

export interface BehavioralPatterns {
  // Social and behavioral indicators
  communicationPatterns: {
    chatFrequency: number;
    gameKnowledgeTerminology: boolean; // Using advanced terms
    strategicCallouts: boolean; // Making strategic calls
    flamePatterns: boolean; // Toxic behavior patterns
    coachingBehavior: boolean; // Teaching other players
  };
  
  gameplayPatterns: {
    riskTaking: number; // Calculated vs reckless plays
    adaptability: number; // Adapting builds/strategy mid-game
    teamFightPositioning: number; // Advanced positioning knowledge
    objectivePrioritization: number; // Knowing when to take objectives
    mapAwareness: number; // Reaction to off-screen events
  };
  
  duoAnalysis: {
    duoPartners: {
      summonerName: string;
      gamesPlayed: number;
      averageRankDifference: number;
      winRateWithDuo: number;
      suspiciousRankGap: boolean; // High rank player duo with low rank
    }[];
    soloVsDuoPerformance: {
      soloWinRate: number;
      duoWinRate: number;
      performanceDifference: number;
    };
  };
}

export interface SmurfDetectionMetrics {
  // Enhanced smurf probability calculation
  overallProbability: number; // 0-100
  confidenceLevel: number; // How confident we are
  
  categoryBreakdown: {
    performanceMetrics: {
      score: number; // 0-100
      weight: 0.35; // 35% of total score
      indicators: {
        unusuallyHighKDA: boolean;
        perfectCSEfficiency: boolean;
        expertDamageDealing: boolean;
        advancedVisionControl: boolean;
        objectiveControl: boolean;
      };
    };
    
    historicalAnalysis: {
      score: number;
      weight: 0.25; // 25% of total score  
      indicators: {
        newAccountHighPerformance: boolean;
        rapidRankProgression: boolean;
        mmrDiscrepancy: boolean;
        skipDivisions: boolean;
      };
    };
    
    championMastery: {
      score: number;
      weight: 0.20; // 20% of total score
      indicators: {
        immediateChampionExpertise: boolean;
        perfectBuildPaths: boolean;
        advancedMechanics: boolean;
        unusualChampionPool: boolean;
      };
    };
    
    gapAnalysis: {
      score: number;
      weight: 0.15; // 15% of total score
      indicators: {
        suspiciousGaps: boolean;
        performanceJumpsAfterGaps: boolean;
        roleShiftsAfterGaps: boolean;
        championPoolChanges: boolean;
      };
    };
    
    behavioralPatterns: {
      score: number;
      weight: 0.05; // 5% of total score
      indicators: {
        advancedGameKnowledge: boolean;
        strategicCommunication: boolean;
        unusualDuoPartners: boolean;
        coachingBehavior: boolean;
      };
    };
  };
  
  // Evidence strength and explanation
  evidenceLevel: 'weak' | 'moderate' | 'strong' | 'overwhelming';
  keyFindings: string[];
  redFlags: string[];
  comparisonToLegitPlayers: {
    percentileRanking: Record<string, number>; // Where they rank vs legitimate players
    statisticalOutliers: string[]; // Which metrics are statistical outliers
  };
}

export interface EnhancedPlayerAnalysis {
  // Basic info
  summoner: {
    name: string;
    level: number;
    profileIconId: number;
    region: string;
  };
  
  // Comprehensive data
  currentRank: RankProgression;
  historicalTimeline: HistoricalTimeline;
  recentGames: {
    gameId: string;
    timestamp: Date;
    champion: string;
    role: string;
    outcome: 'win' | 'loss';
    metrics: EnhancedGameMetrics;
    gameLength: number;
    queueType: string;
  }[];
  
  championMastery: ChampionMasteryData[];
  behavioralPatterns: BehavioralPatterns;
  
  // Smurf detection results
  smurfDetection: SmurfDetectionMetrics;
  
  // Analysis metadata
  analysisMetadata: {
    dataQuality: {
      gamesAnalyzed: number;
      timeSpanDays: number;
      missingDataPoints: string[];
      reliabilityScore: number; // 0-100
    };
    analysisTimestamp: Date;
    apiLimitations: string[];
    recommendedActions: string[];
  };
} 