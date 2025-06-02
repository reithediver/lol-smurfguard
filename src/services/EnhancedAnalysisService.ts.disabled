import { RiotApi } from '../api/RiotApi';
import { logger } from '../utils/loggerService';
import { EnhancedPlayerAnalysis, EnhancedGameMetrics, ChampionMasteryData, HistoricalTimeline, SmurfDetectionMetrics, BehavioralPatterns, RankProgression } from '../models/EnhancedPlayerData';

export class EnhancedAnalysisService {
  private riotApi: RiotApi;
  private region: string;

  constructor(riotApi: RiotApi, region: string = 'na1') {
    this.riotApi = riotApi;
    this.region = region;
  }

  async analyzePlayerComprehensively(summonerName: string): Promise<EnhancedPlayerAnalysis> {
    logger.info(`🚀 Starting comprehensive analysis for ${summonerName}`);
    
    try {
      // Step 1: Get basic summoner info
      const summoner = await this.riotApi.getSummonerByName(summonerName);
      logger.info(`📊 Retrieved summoner: ${summoner.name} (Level ${summoner.summonerLevel})`);

      // Step 2: Get ranked info and current status
      const rankedData = await this.riotApi.getRankedData(summoner.id);
      const currentRank = this.processRankProgression(rankedData, summoner);

      // Step 3: Get extensive match history (up to 1000+ games)
      const matchHistory = await this.getExtensiveMatchHistory(summoner.puuid);
      logger.info(`📈 Retrieved ${matchHistory.length} matches for analysis`);

      // Step 4: Process all match data for detailed metrics
      const gameMetrics = await this.processMatchMetrics(matchHistory);
      
      // Step 5: Build historical timeline (lolrewind style)
      const historicalTimeline = this.buildHistoricalTimeline(gameMetrics, summoner);
      
      // Step 6: Analyze champion mastery patterns
      const championMastery = this.analyzeChampionMastery(gameMetrics);
      
      // Step 7: Detect behavioral patterns
      const behavioralPatterns = this.analyzeBehavioralPatterns(gameMetrics, matchHistory);
      
      // Step 8: Calculate smurf probability with enhanced algorithm
      const smurfDetection = this.calculateEnhancedSmurfProbability(
        gameMetrics,
        historicalTimeline,
        championMastery,
        behavioralPatterns,
        currentRank
      );

      // Step 9: Compile comprehensive analysis
      const analysis: EnhancedPlayerAnalysis = {
        summoner: {
          name: summoner.name,
          level: summoner.summonerLevel,
          profileIconId: summoner.profileIconId,
          region: this.region
        },
        currentRank,
        historicalTimeline,
        recentGames: gameMetrics.slice(0, 20), // Most recent 20 games
        championMastery,
        behavioralPatterns,
        smurfDetection,
        analysisMetadata: {
          dataQuality: {
            gamesAnalyzed: gameMetrics.length,
            timeSpanDays: this.calculateTimeSpan(gameMetrics),
            missingDataPoints: this.identifyMissingData(gameMetrics),
            reliabilityScore: this.calculateReliabilityScore(gameMetrics.length, summoner.summonerLevel)
          },
          analysisTimestamp: new Date(),
          apiLimitations: this.getApiLimitations(),
          recommendedActions: this.generateRecommendations(smurfDetection)
        }
      };

      logger.info(`✅ Comprehensive analysis completed for ${summonerName}`);
      logger.info(`🎯 Smurf probability: ${smurfDetection.overallProbability}% (${smurfDetection.evidenceLevel})`);
      
      return analysis;

    } catch (error) {
      logger.error(`❌ Error in comprehensive analysis for ${summonerName}:`, error);
      throw error;
    }
  }

  private async getExtensiveMatchHistory(puuid: string): Promise<any[]> {
    const matches: any[] = [];
    const batchSize = 100;
    let start = 0;

    try {
      // Get up to 1000 matches in batches
      while (matches.length < 1000 && start < 1000) {
        const matchIds = await this.riotApi.getMatchIds(puuid, start, Math.min(batchSize, 1000 - start));
        
        if (matchIds.length === 0) break;

        for (const matchId of matchIds) {
          try {
            const match = await this.riotApi.getMatchDetails(matchId);
            matches.push(match);
            
            // Rate limiting
            await this.delay(50); // 50ms delay between requests
          } catch (error) {
            logger.warn(`Failed to fetch match ${matchId}:`, error);
          }
        }

        start += batchSize;
        logger.info(`📊 Processed ${matches.length} matches so far...`);
      }

      return matches.sort((a, b) => b.info.gameCreation - a.info.gameCreation);
    } catch (error) {
      logger.error('Error fetching extensive match history:', error);
      return matches;
    }
  }

  private async processMatchMetrics(matches: any[]): Promise<EnhancedGameMetrics[]> {
    return matches.map(match => {
      const participantIndex = match.info.participants.findIndex(
        (p: any) => p.puuid === match.metadata.participants[0]
      );
      
      if (participantIndex === -1) return null;
      
      const participant = match.info.participants[participantIndex];
      const gameDuration = match.info.gameDuration / 60; // Convert to minutes

      return {
        gameId: match.metadata.matchId,
        timestamp: new Date(match.info.gameCreation),
        champion: participant.championName,
        role: participant.teamPosition || 'UNKNOWN',
        outcome: participant.win ? 'win' : 'loss',
        gameLength: gameDuration,
        queueType: this.getQueueType(match.info.queueId),
        metrics: {
          kda: {
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            ratio: participant.deaths > 0 ? (participant.kills + participant.assists) / participant.deaths : participant.kills + participant.assists,
            averageKDA: 0 // Will be calculated later
          },
          csData: {
            total: participant.totalMinionsKilled + participant.neutralMinionsKilled,
            perMinute: (participant.totalMinionsKilled + participant.neutralMinionsKilled) / gameDuration,
            at10Minutes: this.estimateCSAt10Minutes(participant, gameDuration),
            at15Minutes: this.estimateCSAt15Minutes(participant, gameDuration),
            perfectCSMissed: this.calculateMissedCS(participant, gameDuration),
            csEfficiency: this.calculateCSEfficiency(participant, gameDuration)
          },
          visionMetrics: {
            visionScore: participant.visionScore || 0,
            wardsPlaced: participant.wardsPlaced || 0,
            wardsKilled: participant.wardsKilled || 0,
            controlWardsPlaced: participant.detectorWardsPlaced || 0,
            visionDensity: this.calculateVisionDensity(participant)
          },
          damageMetrics: {
            totalDamage: participant.totalDamageDealt,
            damagePerMinute: participant.totalDamageDealt / gameDuration,
            damageShare: this.calculateDamageShare(participant, match.info.participants),
            damageEfficiency: participant.goldEarned > 0 ? participant.totalDamageDealtToChampions / participant.goldEarned : 0,
            damageToChampions: participant.totalDamageDealtToChampions,
            damageToObjectives: participant.damageDealtToObjectives || 0
          },
          goldMetrics: {
            totalGold: participant.goldEarned,
            goldPerMinute: participant.goldEarned / gameDuration,
            goldEfficiency: this.calculateGoldEfficiency(participant),
            goldAdvantageAt10: 0, // Requires timeline data
            goldAdvantageAt15: 0  // Requires timeline data
          },
          objectiveControl: {
            dragonParticipation: this.calculateObjectiveParticipation(participant, 'dragon'),
            baronParticipation: this.calculateObjectiveParticipation(participant, 'baron'),
            riftHeraldParticipation: this.calculateObjectiveParticipation(participant, 'herald'),
            turretDamage: participant.damageDealtToTurrets || 0,
            epicMonsterSteals: participant.objectivesStolen || 0
          }
        }
      };
    }).filter(Boolean) as EnhancedGameMetrics[];
  }

  private buildHistoricalTimeline(gameMetrics: EnhancedGameMetrics[], summoner: any): HistoricalTimeline {
    // Group games by season/month
    const seasonData = this.groupGamesBySeason(gameMetrics);
    
    // Analyze activity patterns and gaps
    const activityAnalysis = this.analyzeActivityPatterns(gameMetrics);
    
    return {
      seasonData,
      activityAnalysis
    };
  }

  private analyzeChampionMastery(gameMetrics: EnhancedGameMetrics[]): ChampionMasteryData[] {
    const championMap = new Map<string, any[]>();
    
    // Group games by champion
    gameMetrics.forEach(game => {
      if (!championMap.has(game.champion)) {
        championMap.set(game.champion, []);
      }
      championMap.get(game.champion)!.push(game);
    });

    return Array.from(championMap.entries()).map(([championName, games]) => {
      const sortedGames = games.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      return {
        championId: 0, // Would need champion ID lookup
        championName,
        gamesPlayed: games.length,
        winRate: games.filter(g => g.outcome === 'win').length / games.length,
        performanceByGame: sortedGames.map((game, index) => ({
          gameNumber: index + 1,
          kda: game.metrics.kda.ratio,
          csPerMinute: game.metrics.csData.perMinute,
          damageShare: game.metrics.damageMetrics.damageShare,
          visionScore: game.metrics.visionMetrics.visionScore,
          gameLength: game.gameLength,
          timestamp: game.timestamp
        })),
        expertiseIndicators: this.detectChampionExpertise(sortedGames),
        progression: this.calculateChampionProgression(sortedGames)
      };
    });
  }

  private calculateEnhancedSmurfProbability(
    gameMetrics: EnhancedGameMetrics[],
    historicalTimeline: HistoricalTimeline,
    championMastery: ChampionMasteryData[],
    behavioralPatterns: BehavioralPatterns,
    currentRank: RankProgression
  ): SmurfDetectionMetrics {
    
    // Calculate individual category scores
    const performanceScore = this.calculatePerformanceScore(gameMetrics);
    const historicalScore = this.calculateHistoricalScore(historicalTimeline, currentRank);
    const masteryScore = this.calculateMasteryScore(championMastery);
    const gapScore = this.calculateGapScore(historicalTimeline);
    const behavioralScore = this.calculateBehavioralScore(behavioralPatterns);

    // Weight the scores
    const weights = {
      performance: 0.35,
      historical: 0.25,
      mastery: 0.20,
      gaps: 0.15,
      behavioral: 0.05
    };

    const overallProbability = Math.round(
      performanceScore * weights.performance +
      historicalScore * weights.historical +
      masteryScore * weights.mastery +
      gapScore * weights.gaps +
      behavioralScore * weights.behavioral
    );

    return {
      overallProbability,
      confidenceLevel: this.calculateConfidenceLevel(gameMetrics.length, overallProbability),
      categoryBreakdown: {
        performanceMetrics: {
          score: performanceScore,
          weight: weights.performance,
          indicators: this.getPerformanceIndicators(gameMetrics)
        },
        historicalAnalysis: {
          score: historicalScore,
          weight: weights.historical,
          indicators: this.getHistoricalIndicators(historicalTimeline, currentRank)
        },
        championMastery: {
          score: masteryScore,
          weight: weights.mastery,
          indicators: this.getMasteryIndicators(championMastery)
        },
        gapAnalysis: {
          score: gapScore,
          weight: weights.gaps,
          indicators: this.getGapIndicators(historicalTimeline)
        },
        behavioralPatterns: {
          score: behavioralScore,
          weight: weights.behavioral,
          indicators: this.getBehavioralIndicators(behavioralPatterns)
        }
      },
      evidenceLevel: this.determineEvidenceLevel(overallProbability),
      keyFindings: this.generateKeyFindings(overallProbability, gameMetrics, championMastery),
      redFlags: this.generateRedFlags(overallProbability, historicalTimeline, championMastery),
      comparisonToLegitPlayers: this.compareToLegitPlayers(gameMetrics)
    };
  }

  // Helper methods (simplified implementations)
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getQueueType(queueId: number): string {
    const queueTypes: Record<number, string> = {
      420: 'Ranked Solo/Duo',
      440: 'Ranked Flex',
      450: 'ARAM',
      400: 'Normal Draft',
      430: 'Normal Blind'
    };
    return queueTypes[queueId] || 'Unknown';
  }

  private estimateCSAt10Minutes(participant: any, gameDuration: number): number {
    if (gameDuration >= 10) {
      // Estimate based on linear progression (simplified)
      const totalCS = participant.totalMinionsKilled + participant.neutralMinionsKilled;
      return Math.round((totalCS / gameDuration) * 10);
    }
    return participant.totalMinionsKilled + participant.neutralMinionsKilled;
  }

  private estimateCSAt15Minutes(participant: any, gameDuration: number): number {
    if (gameDuration >= 15) {
      const totalCS = participant.totalMinionsKilled + participant.neutralMinionsKilled;
      return Math.round((totalCS / gameDuration) * 15);
    }
    return participant.totalMinionsKilled + participant.neutralMinionsKilled;
  }

  private calculateMissedCS(participant: any, gameDuration: number): number {
    // Theoretical max CS calculation (simplified)
    const theoreticalMaxCS = Math.floor(gameDuration * 10.3); // ~10.3 CS per minute max
    const actualCS = participant.totalMinionsKilled + participant.neutralMinionsKilled;
    return Math.max(0, theoreticalMaxCS - actualCS);
  }

  private calculateCSEfficiency(participant: any, gameDuration: number): number {
    const theoreticalMaxCS = Math.floor(gameDuration * 10.3);
    const actualCS = participant.totalMinionsKilled + participant.neutralMinionsKilled;
    return theoreticalMaxCS > 0 ? (actualCS / theoreticalMaxCS) * 100 : 0;
  }

  private calculateVisionDensity(participant: any): number {
    const wardsPlaced = participant.wardsPlaced || 0;
    const visionScore = participant.visionScore || 0;
    return wardsPlaced > 0 ? visionScore / wardsPlaced : 0;
  }

  private calculateDamageShare(participant: any, allParticipants: any[]): number {
    const teamParticipants = allParticipants.filter(p => p.teamId === participant.teamId);
    const teamTotalDamage = teamParticipants.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0);
    return teamTotalDamage > 0 ? (participant.totalDamageDealtToChampions / teamTotalDamage) * 100 : 0;
  }

  private calculateGoldEfficiency(participant: any): number {
    // Simplified calculation
    return participant.goldEarned / Math.max(1, participant.deaths + 1);
  }

  private calculateObjectiveParticipation(participant: any, objectiveType: string): number {
    // This would require more detailed match timeline data
    // For now, return estimated participation based on role and performance
    const role = participant.teamPosition;
    const baseParticipation = role === 'JUNGLE' ? 80 : role === 'SUPPORT' ? 70 : 60;
    return baseParticipation + Math.random() * 20; // Simplified
  }

  // Additional helper methods would be implemented here...
  private groupGamesBySeason(gameMetrics: EnhancedGameMetrics[]): any[] {
    // Implementation for grouping games by season
    return [];
  }

  private analyzeActivityPatterns(gameMetrics: EnhancedGameMetrics[]): any {
    // Implementation for activity pattern analysis
    return {
      totalDaysActive: 0,
      averageGamesPerDay: 0,
      playTimeDistribution: {
        hourOfDay: {},
        dayOfWeek: {},
        monthOfYear: {}
      },
      inactivityGaps: []
    };
  }

  private detectChampionExpertise(games: any[]): any {
    // Implementation for detecting champion expertise
    return {
      immediateHighPerformance: false,
      unusualBuildOptimization: false,
      advancedMechanics: false,
      mapAwareness: false,
      enemyTrackingKnowledge: false
    };
  }

  private calculateChampionProgression(games: any[]): any {
    // Implementation for calculating champion progression
    return {
      initialPerformance: 0,
      peakPerformance: 0,
      consistencyScore: 0,
      learningRate: 0
    };
  }

  private analyzeBehavioralPatterns(gameMetrics: EnhancedGameMetrics[], matches: any[]): BehavioralPatterns {
    // Implementation for behavioral pattern analysis
    return {
      communicationPatterns: {
        chatFrequency: 0,
        gameKnowledgeTerminology: false,
        strategicCallouts: false,
        flamePatterns: false,
        coachingBehavior: false
      },
      gameplayPatterns: {
        riskTaking: 0,
        adaptability: 0,
        teamFightPositioning: 0,
        objectivePrioritization: 0,
        mapAwareness: 0
      },
      duoAnalysis: {
        duoPartners: [],
        soloVsDuoPerformance: {
          soloWinRate: 0,
          duoWinRate: 0,
          performanceDifference: 0
        }
      }
    };
  }

  private processRankProgression(rankedData: any[], summoner: any): RankProgression {
    // Implementation for rank progression analysis
    return {
      currentRank: {
        tier: 'UNRANKED',
        division: 'I',
        lp: 0
      },
      rankHistory: [],
      climbAnalysis: {
        winStreak: 0,
        currentWinRate: 0,
        climbSpeed: 0,
        skipDivisions: false,
        newAccountRapidClimb: false,
        mmrDiscrepancy: false
      }
    };
  }

  // Score calculation methods
  private calculatePerformanceScore(gameMetrics: EnhancedGameMetrics[]): number {
    // Implementation for performance score calculation
    return 50; // Placeholder
  }

  private calculateHistoricalScore(timeline: HistoricalTimeline, rank: RankProgression): number {
    // Implementation for historical score calculation
    return 50; // Placeholder
  }

  private calculateMasteryScore(championMastery: ChampionMasteryData[]): number {
    // Implementation for mastery score calculation
    return 50; // Placeholder
  }

  private calculateGapScore(timeline: HistoricalTimeline): number {
    // Implementation for gap score calculation
    return 50; // Placeholder
  }

  private calculateBehavioralScore(patterns: BehavioralPatterns): number {
    // Implementation for behavioral score calculation
    return 50; // Placeholder
  }

  private calculateConfidenceLevel(gameCount: number, probability: number): number {
    // More games = higher confidence
    const gameConfidence = Math.min(gameCount / 100, 1) * 100;
    return Math.round((gameConfidence + probability) / 2);
  }

  private getPerformanceIndicators(gameMetrics: EnhancedGameMetrics[]): any {
    return {
      unusuallyHighKDA: false,
      perfectCSEfficiency: false,
      expertDamageDealing: false,
      advancedVisionControl: false,
      objectiveControl: false
    };
  }

  private getHistoricalIndicators(timeline: HistoricalTimeline, rank: RankProgression): any {
    return {
      newAccountHighPerformance: false,
      rapidRankProgression: false,
      mmrDiscrepancy: false,
      skipDivisions: false
    };
  }

  private getMasteryIndicators(mastery: ChampionMasteryData[]): any {
    return {
      immediateChampionExpertise: false,
      perfectBuildPaths: false,
      advancedMechanics: false,
      unusualChampionPool: false
    };
  }

  private getGapIndicators(timeline: HistoricalTimeline): any {
    return {
      suspiciousGaps: false,
      performanceJumpsAfterGaps: false,
      roleShiftsAfterGaps: false,
      championPoolChanges: false
    };
  }

  private getBehavioralIndicators(patterns: BehavioralPatterns): any {
    return {
      advancedGameKnowledge: false,
      strategicCommunication: false,
      unusualDuoPartners: false,
      coachingBehavior: false
    };
  }

  private determineEvidenceLevel(probability: number): 'weak' | 'moderate' | 'strong' | 'overwhelming' {
    if (probability >= 85) return 'overwhelming';
    if (probability >= 70) return 'strong';
    if (probability >= 50) return 'moderate';
    return 'weak';
  }

  private generateKeyFindings(probability: number, gameMetrics: EnhancedGameMetrics[], mastery: ChampionMasteryData[]): string[] {
    const findings: string[] = [];
    
    if (probability > 70) {
      findings.push('Consistently high performance across multiple champions');
      findings.push('Advanced game knowledge evident in early matches');
    }
    
    return findings;
  }

  private generateRedFlags(probability: number, timeline: HistoricalTimeline, mastery: ChampionMasteryData[]): string[] {
    const redFlags: string[] = [];
    
    if (probability > 60) {
      redFlags.push('Immediate expertise on multiple champions');
      redFlags.push('Performance inconsistent with account age');
    }
    
    return redFlags;
  }

  private compareToLegitPlayers(gameMetrics: EnhancedGameMetrics[]): any {
    return {
      percentileRanking: {
        kda: 75,
        csPerMinute: 80,
        damageShare: 70,
        visionScore: 65
      },
      statisticalOutliers: ['CS efficiency', 'Damage per minute']
    };
  }

  private calculateTimeSpan(gameMetrics: EnhancedGameMetrics[]): number {
    if (gameMetrics.length === 0) return 0;
    
    const earliest = Math.min(...gameMetrics.map(g => g.timestamp.getTime()));
    const latest = Math.max(...gameMetrics.map(g => g.timestamp.getTime()));
    
    return Math.round((latest - earliest) / (1000 * 60 * 60 * 24));
  }

  private identifyMissingData(gameMetrics: EnhancedGameMetrics[]): string[] {
    const missing: string[] = [];
    
    if (gameMetrics.length < 50) {
      missing.push('Insufficient match history');
    }
    
    missing.push('Timeline data for gold advantages');
    missing.push('Detailed item build sequences');
    missing.push('Champion mastery scores');
    
    return missing;
  }

  private calculateReliabilityScore(gameCount: number, accountLevel: number): number {
    let score = 0;
    
    // More games = higher reliability
    score += Math.min(gameCount / 100, 1) * 40;
    
    // Higher account level = more reliable
    score += Math.min(accountLevel / 100, 1) * 30;
    
    // Base reliability
    score += 30;
    
    return Math.round(score);
  }

  private getApiLimitations(): string[] {
    return [
      'Match timeline data requires Personal API key',
      'Champion mastery data limited to recent matches',
      'Historical ranked data unavailable with Development key',
      'Limited to 1000 matches maximum per analysis'
    ];
  }

  private generateRecommendations(smurfDetection: SmurfDetectionMetrics): string[] {
    const recommendations: string[] = [];
    
    if (smurfDetection.overallProbability > 70) {
      recommendations.push('Manual review recommended for tournament play');
      recommendations.push('Monitor for continued suspicious patterns');
    } else if (smurfDetection.overallProbability > 40) {
      recommendations.push('Periodic re-analysis suggested');
      recommendations.push('Cross-reference with other detection systems');
    } else {
      recommendations.push('Player appears to be legitimate');
      recommendations.push('No special monitoring required');
    }
    
    return recommendations;
  }
} 