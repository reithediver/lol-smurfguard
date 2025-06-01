import { RiotApi } from '../api/RiotApi';
import { AdvancedSmurfAnalysis, HistoricalAnalysis, AdvancedPerformanceMetrics, SuspiciousPatterns, ChampionExpertiseFlag } from '../models/AdvancedPlayerAnalysis';
import { logger } from '../utils/loggerService';

export class AdvancedDataService {
  private riotApi: RiotApi;
  private readonly ANALYSIS_TIMESPAN_MONTHS = 60; // 5 years of data
  private readonly MIN_GAMES_FOR_ANALYSIS = 100; // Higher threshold for 5-year analysis
  private readonly CHAMPION_EXPERTISE_THRESHOLD = 3; // Games to determine expertise
  
  // Enhanced gap detection thresholds
  private readonly GAP_THRESHOLDS = {
    MINOR: 7,      // 1 week
    MODERATE: 21,  // 3 weeks  
    MAJOR: 60,     // 2 months
    EXTREME: 180,  // 6 months
    ACCOUNT_SWITCH: 365 // 1 year (likely account switching)
  };

  // Account switching indicators
  private readonly ACCOUNT_SWITCH_INDICATORS = {
    PERFORMANCE_JUMP: 0.4,        // 40% performance increase
    NEW_CHAMPION_EXPERTISE: 0.8,  // 80%+ win rate on new champions
    ROLE_MASTERY_CHANGE: 0.6,     // Sudden mastery of different roles
    PLAYSTYLE_SHIFT: 0.5          // Dramatic playstyle changes
  };

  constructor(riotApi: RiotApi) {
    this.riotApi = riotApi;
  }

  async analyzePlayerComprehensively(summonerName: string): Promise<AdvancedSmurfAnalysis> {
    logger.info(`🔍 Starting comprehensive analysis for: ${summonerName}`);

    try {
      // 1. Get summoner basic info
      const summoner = await this.riotApi.getSummonerByName(summonerName);
      
      // 2. Get all match history (going back 2 years)
      const extensiveMatchHistory = await this.getExtensiveMatchHistory(summoner.puuid);
      
      // 3. Analyze historical patterns
      const historicalAnalysis = await this.analyzeHistoricalPatterns(summoner, extensiveMatchHistory);
      
      // 4. Calculate advanced performance metrics
      const performanceMetrics = await this.calculateAdvancedMetrics(extensiveMatchHistory);
      
      // 5. Detect suspicious patterns
      const suspiciousPatterns = await this.detectSuspiciousPatterns(summoner, extensiveMatchHistory, performanceMetrics);
      
      // 6. Calculate final smurf probability
      const smurfProbability = this.calculateAdvancedSmurfProbability(historicalAnalysis, performanceMetrics, suspiciousPatterns);
      
      // 7. Generate detailed report
      const detailedReport = this.generateDetailedReport(summonerName, historicalAnalysis, performanceMetrics, suspiciousPatterns, smurfProbability);

      return {
        summonerName,
        region: 'na1', // TODO: Make dynamic
        currentRank: await this.getCurrentRank(summoner.id),
        accountLevel: summoner.summonerLevel,
        historicalAnalysis,
        performanceMetrics,
        suspiciousPatterns,
        smurfProbability,
        detailedReport,
        analysisTimestamp: new Date(),
        dataQuality: {
          gamesCovered: extensiveMatchHistory.length,
          timeSpanDays: this.calculateTimeSpan(extensiveMatchHistory),
          missingData: await this.assessDataQuality(extensiveMatchHistory),
          reliabilityScore: this.calculateReliabilityScore(extensiveMatchHistory)
        }
      };

    } catch (error) {
      logger.error(`Error in comprehensive analysis for ${summonerName}:`, error);
      throw error;
    }
  }

  private async getExtensiveMatchHistory(puuid: string): Promise<any[]> {
    logger.info('📚 Collecting ultra-extensive match history (up to 5 years)...');
    
    const allMatches: any[] = [];
    const startTime = Date.now() - (this.ANALYSIS_TIMESPAN_MONTHS * 30 * 24 * 60 * 60 * 1000);
    
    try {
      // Get match IDs in larger batches for 5-year analysis
      let start = 0;
      const count = 100;
      let hasMoreMatches = true;

      while (hasMoreMatches && allMatches.length < 5000) { // Cap at 5000 games for 5 years
        const matchIds = await this.riotApi.getMatchHistory(puuid, startTime, undefined);
        
        if (matchIds.length === 0) {
          hasMoreMatches = false;
          break;
        }

        // Get detailed match data with optimized rate limiting
        for (const matchId of matchIds) {
          try {
            const matchDetails = await this.riotApi.getMatchDetails(matchId);
            allMatches.push(matchDetails);
            
            // Reduced rate limiting for large datasets
            await new Promise(resolve => setTimeout(resolve, 25));
          } catch (error) {
            logger.warn(`Failed to get match details for ${matchId}:`, error);
          }
        }

        start += count;
        
        // Break if we have enough matches or if we're getting old matches
        const oldestMatch = allMatches[allMatches.length - 1];
        if (oldestMatch && oldestMatch.info.gameCreation < startTime) {
          hasMoreMatches = false;
        }

        // Progress logging for large datasets
        if (allMatches.length % 500 === 0) {
          logger.info(`📊 Collected ${allMatches.length} matches so far...`);
        }
      }

      logger.info(`📊 Collected ${allMatches.length} matches for ultra-comprehensive analysis`);
      return allMatches;

    } catch (error) {
      logger.error('Error collecting ultra-extensive match history:', error);
      return [];
    }
  }

  private async analyzeHistoricalPatterns(summoner: any, matches: any[]): Promise<HistoricalAnalysis> {
    logger.info('🕰️ Analyzing historical patterns...');

    // Calculate account age
    const accountCreation = new Date(summoner.revisionDate); // Approximation
    const accountAge = Math.floor((Date.now() - accountCreation.getTime()) / (24 * 60 * 60 * 1000));

    // Analyze play history by season
    const playHistory = this.analyzeSeasonalHistory(matches);

    // Analyze playtime patterns and gaps
    const playtimeAnalysis = this.analyzePlaytimePatterns(matches);

    // Analyze skill progression
    const skillProgression = this.analyzeSkillProgression(matches);

    return {
      accountAge,
      playHistory,
      playtimeAnalysis,
      skillProgression
    };
  }

  private analyzeSeasonalHistory(matches: any[]): any[] {
    const seasonalData: Record<string, any> = {};

    matches.forEach(match => {
      const gameDate = new Date(match.info.gameCreation);
      const season = this.determineSeason(gameDate);
      
      if (!seasonalData[season]) {
        seasonalData[season] = {
          gamesPlayed: 0,
          wins: 0,
          totalPerformance: 0
        };
      }

      const participant = this.findPlayerInMatch(match);
      if (participant) {
        seasonalData[season].gamesPlayed++;
        if (participant.win) seasonalData[season].wins++;
        seasonalData[season].totalPerformance += this.calculateMatchPerformance(participant);
      }
    });

    return Object.entries(seasonalData).map(([season, data]: [string, any]) => ({
      season,
      rank: 'Unknown', // TODO: Get historical rank data
      gamesPlayed: data.gamesPlayed,
      winRate: data.gamesPlayed > 0 ? (data.wins / data.gamesPlayed) * 100 : 0,
      averagePerformance: data.gamesPlayed > 0 ? data.totalPerformance / data.gamesPlayed : 0
    }));
  }

  private analyzePlaytimePatterns(matches: any[]): any {
    logger.info('⏰ Analyzing playtime patterns and gaps...');

    // Sort matches by date
    const sortedMatches = matches.sort((a, b) => a.info.gameCreation - b.info.gameCreation);

    // Calculate daily/weekly patterns
    const hourlyDistribution: Record<string, number> = {};
    const weeklyDistribution: Record<string, number> = {};
    
    sortedMatches.forEach(match => {
      const date = new Date(match.info.gameCreation);
      const hour = date.getHours().toString();
      const day = date.getDay().toString();
      
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      weeklyDistribution[day] = (weeklyDistribution[day] || 0) + 1;
    });

    // Detect gaps in play history
    const gaps = this.detectPlaytimeGaps(sortedMatches);

    // Calculate activity metrics
    const firstGame = new Date(sortedMatches[0]?.info.gameCreation || Date.now());
    const lastGame = new Date(sortedMatches[sortedMatches.length - 1]?.info.gameCreation || Date.now());
    const totalDays = Math.max(1, Math.floor((lastGame.getTime() - firstGame.getTime()) / (24 * 60 * 60 * 1000)));

    return {
      totalGames: matches.length,
      daysActive: totalDays,
      averageGamesPerDay: matches.length / totalDays,
      playPatterns: {
        dailyDistribution: hourlyDistribution,
        weeklyDistribution: weeklyDistribution,
        seasonalActivity: {} // TODO: Implement seasonal activity
      },
      gaps
    };
  }

  private detectPlaytimeGaps(sortedMatches: any[]): any[] {
    logger.info('🕳️ Detecting comprehensive playtime gaps (weeks to years)...');
    
    const gaps: any[] = [];

    for (let i = 1; i < sortedMatches.length; i++) {
      const currentGame = new Date(sortedMatches[i].info.gameCreation);
      const previousGame = new Date(sortedMatches[i - 1].info.gameCreation);
      
      const gapDays = Math.floor((currentGame.getTime() - previousGame.getTime()) / (24 * 60 * 60 * 1000));
      
      // Only analyze significant gaps (7+ days)
      if (gapDays >= this.GAP_THRESHOLDS.MINOR) {
        // Analyze performance and champion usage before/after gap
        const performanceBefore = this.calculatePerformanceAroundIndex(sortedMatches, i - 1, -10, 0);
        const performanceAfter = this.calculatePerformanceAroundIndex(sortedMatches, i, 0, 10);
        
        // Analyze champion usage patterns around the gap
        const championsBefore = this.getChampionUsageAroundIndex(sortedMatches, i - 1, -10, 0);
        const championsAfter = this.getChampionUsageAroundIndex(sortedMatches, i, 0, 10);
        
        // Calculate suspicion metrics
        const performanceImprovement = performanceAfter - performanceBefore;
        const newChampionExpertise = this.calculateNewChampionExpertise(championsBefore, championsAfter);
        const roleShift = this.calculateRoleShift(sortedMatches, i - 1, i);
        
        // Determine gap category and suspicion level
        const gapCategory = this.categorizeGap(gapDays);
        const suspicionLevel = this.calculateGapSuspicionLevel(
          gapDays, 
          performanceImprovement, 
          newChampionExpertise, 
          roleShift
        );

        // Account switching probability
        const accountSwitchProbability = this.calculateAccountSwitchProbability(
          gapDays,
          performanceImprovement,
          newChampionExpertise,
          roleShift
        );

        gaps.push({
          gapStart: previousGame,
          gapEnd: currentGame,
          durationDays: gapDays,
          gapCategory,
          contextualSuspicion: this.calculateContextualSuspicion(previousGame, currentGame),
          performanceBeforeGap: performanceBefore,
          performanceAfterGap: performanceAfter,
          performanceImprovement,
          championsBefore,
          championsAfter,
          newChampionExpertise,
          roleShift,
          suspicionLevel,
          accountSwitchProbability,
          redFlags: this.identifyGapRedFlags(gapDays, performanceImprovement, newChampionExpertise, roleShift)
        });
      }
    }

    // Sort gaps by suspicion level (most suspicious first)
    gaps.sort((a, b) => {
      const aSuspicion = a.accountSwitchProbability + (a.suspicionLevel === 'extreme' ? 1 : 0);
      const bSuspicion = b.accountSwitchProbability + (b.suspicionLevel === 'extreme' ? 1 : 0);
      return bSuspicion - aSuspicion;
    });

    logger.info(`🕳️ Detected ${gaps.length} significant gaps, ${gaps.filter(g => g.suspicionLevel === 'extreme' || g.accountSwitchProbability > 0.7).length} highly suspicious`);
    
    return gaps;
  }

  private categorizeGap(gapDays: number): string {
    if (gapDays >= this.GAP_THRESHOLDS.ACCOUNT_SWITCH) return 'Account Switch Likely';
    if (gapDays >= this.GAP_THRESHOLDS.EXTREME) return 'Extreme Gap';
    if (gapDays >= this.GAP_THRESHOLDS.MAJOR) return 'Major Gap';
    if (gapDays >= this.GAP_THRESHOLDS.MODERATE) return 'Moderate Gap';
    return 'Minor Gap';
  }

  private calculateGapSuspicionLevel(
    gapDays: number, 
    performanceImprovement: number, 
    newChampionExpertise: number,
    roleShift: number
  ): 'low' | 'medium' | 'high' | 'extreme' {
    
    let suspicionScore = 0;
    
    // Gap duration scoring
    if (gapDays >= this.GAP_THRESHOLDS.ACCOUNT_SWITCH) suspicionScore += 4;
    else if (gapDays >= this.GAP_THRESHOLDS.EXTREME) suspicionScore += 3;
    else if (gapDays >= this.GAP_THRESHOLDS.MAJOR) suspicionScore += 2;
    else if (gapDays >= this.GAP_THRESHOLDS.MODERATE) suspicionScore += 1;
    
    // Performance improvement scoring
    if (performanceImprovement >= this.ACCOUNT_SWITCH_INDICATORS.PERFORMANCE_JUMP) suspicionScore += 3;
    else if (performanceImprovement >= 0.3) suspicionScore += 2;
    else if (performanceImprovement >= 0.2) suspicionScore += 1;
    
    // New champion expertise scoring
    if (newChampionExpertise >= this.ACCOUNT_SWITCH_INDICATORS.NEW_CHAMPION_EXPERTISE) suspicionScore += 3;
    else if (newChampionExpertise >= 0.6) suspicionScore += 2;
    else if (newChampionExpertise >= 0.4) suspicionScore += 1;
    
    // Role shift scoring
    if (roleShift >= this.ACCOUNT_SWITCH_INDICATORS.ROLE_MASTERY_CHANGE) suspicionScore += 2;
    else if (roleShift >= 0.4) suspicionScore += 1;
    
    // Determine final suspicion level
    if (suspicionScore >= 8) return 'extreme';
    if (suspicionScore >= 6) return 'high';
    if (suspicionScore >= 3) return 'medium';
    return 'low';
  }

  private calculateAccountSwitchProbability(
    gapDays: number,
    performanceImprovement: number,
    newChampionExpertise: number,
    roleShift: number
  ): number {
    let probability = 0;
    
    // Base probability from gap duration
    if (gapDays >= this.GAP_THRESHOLDS.ACCOUNT_SWITCH) probability += 0.4;
    else if (gapDays >= this.GAP_THRESHOLDS.EXTREME) probability += 0.3;
    else if (gapDays >= this.GAP_THRESHOLDS.MAJOR) probability += 0.2;
    else if (gapDays >= this.GAP_THRESHOLDS.MODERATE) probability += 0.1;
    
    // Performance improvement factor
    probability += Math.min(0.3, performanceImprovement * 0.75);
    
    // New champion expertise factor
    probability += Math.min(0.2, newChampionExpertise * 0.25);
    
    // Role shift factor
    probability += Math.min(0.1, roleShift * 0.17);
    
    return Math.min(1.0, probability);
  }

  private getChampionUsageAroundIndex(matches: any[], index: number, before: number, after: number): any[] {
    const startIndex = Math.max(0, index + before);
    const endIndex = Math.min(matches.length - 1, index + after);
    
    const champions: any[] = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      const participant = this.findPlayerInMatch(matches[i]);
      if (participant) {
        champions.push({
          championId: participant.championId,
          championName: participant.championName || `Champion${participant.championId}`,
          performance: this.calculateMatchPerformance(participant),
          win: participant.win,
          role: participant.teamPosition || participant.role
        });
      }
    }
    
    return champions;
  }

  private calculateNewChampionExpertise(championsBefore: any[], championsAfter: any[]): number {
    if (championsAfter.length === 0) return 0;
    
    const beforeChampions = new Set(championsBefore.map(c => c.championId));
    const newChampions = championsAfter.filter(c => !beforeChampions.has(c.championId));
    
    if (newChampions.length === 0) return 0;
    
    // Calculate win rate and performance on new champions
    const newChampionWinRate = newChampions.reduce((sum, c) => sum + (c.win ? 1 : 0), 0) / newChampions.length;
    const newChampionPerformance = newChampions.reduce((sum, c) => sum + c.performance, 0) / newChampions.length;
    
    // High win rate and performance on new champions is suspicious
    return (newChampionWinRate * 0.6) + (Math.min(newChampionPerformance / 10, 1) * 0.4);
  }

  private calculateRoleShift(matches: any[], beforeIndex: number, afterIndex: number): number {
    const beforeRoles = this.getRoleDistribution(matches, Math.max(0, beforeIndex - 10), beforeIndex);
    const afterRoles = this.getRoleDistribution(matches, afterIndex, Math.min(matches.length - 1, afterIndex + 10));
    
    // Calculate role distribution difference
    const allRoles = new Set([...Object.keys(beforeRoles), ...Object.keys(afterRoles)]);
    let totalDifference = 0;
    
    allRoles.forEach(role => {
      const beforePercentage = beforeRoles[role] || 0;
      const afterPercentage = afterRoles[role] || 0;
      totalDifference += Math.abs(afterPercentage - beforePercentage);
    });
    
    return totalDifference / 2; // Normalize to 0-1 range
  }

  private getRoleDistribution(matches: any[], startIndex: number, endIndex: number): Record<string, number> {
    const roles: Record<string, number> = {};
    let totalGames = 0;
    
    for (let i = startIndex; i <= endIndex; i++) {
      const participant = this.findPlayerInMatch(matches[i]);
      if (participant) {
        const role = participant.teamPosition || participant.role || 'UNKNOWN';
        roles[role] = (roles[role] || 0) + 1;
        totalGames++;
      }
    }
    
    // Convert to percentages
    Object.keys(roles).forEach(role => {
      roles[role] = roles[role] / totalGames;
    });
    
    return roles;
  }

  private identifyGapRedFlags(
    gapDays: number, 
    performanceImprovement: number, 
    newChampionExpertise: number,
    roleShift: number
  ): string[] {
    const redFlags: string[] = [];
    
    if (gapDays >= this.GAP_THRESHOLDS.ACCOUNT_SWITCH) {
      redFlags.push('Year+ gap suggests account switching');
    }
    
    if (performanceImprovement >= this.ACCOUNT_SWITCH_INDICATORS.PERFORMANCE_JUMP) {
      redFlags.push('Massive performance improvement after gap');
    }
    
    if (newChampionExpertise >= this.ACCOUNT_SWITCH_INDICATORS.NEW_CHAMPION_EXPERTISE) {
      redFlags.push('Immediate expertise on new champions');
    }
    
    if (roleShift >= this.ACCOUNT_SWITCH_INDICATORS.ROLE_MASTERY_CHANGE) {
      redFlags.push('Sudden mastery of different roles');
    }
    
    if (gapDays >= this.GAP_THRESHOLDS.MAJOR && performanceImprovement >= 0.3) {
      redFlags.push('Suspicious skill retention after long break');
    }
    
    if (gapDays >= this.GAP_THRESHOLDS.EXTREME && newChampionExpertise >= 0.6) {
      redFlags.push('Expert play on new champions after extreme gap');
    }
    
    return redFlags;
  }

  private async calculateAdvancedMetrics(matches: any[]): Promise<AdvancedPerformanceMetrics[]> {
    logger.info('📊 Calculating advanced performance metrics...');

    const championMetrics: Record<number, any> = {};

    matches.forEach(match => {
      const participant = this.findPlayerInMatch(match);
      if (!participant) return;

      const championId = participant.championId;
      if (!championMetrics[championId]) {
        championMetrics[championId] = {
          championId,
          championName: participant.championName || `Champion${championId}`,
          games: [],
          totalCS: 0,
          totalGold: 0,
          totalDamage: 0,
          wins: 0
        };
      }

      const gameMetrics = {
        gameDate: new Date(match.info.gameCreation),
        cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
        gold: participant.goldEarned,
        damage: participant.totalDamageDealtToChampions,
        gameDuration: match.info.gameDuration,
        kda: (participant.kills + participant.assists) / Math.max(1, participant.deaths),
        win: participant.win,
        position: participant.teamPosition || participant.role
      };

      championMetrics[championId].games.push(gameMetrics);
      championMetrics[championId].totalCS += gameMetrics.cs;
      championMetrics[championId].totalGold += gameMetrics.gold;
      championMetrics[championId].totalDamage += gameMetrics.damage;
      if (gameMetrics.win) championMetrics[championId].wins++;
    });

    // Convert to advanced metrics format
    return Object.values(championMetrics).map((data: any) => {
      const gamesPlayed = data.games.length;
      const avgGameDuration = data.games.reduce((sum: number, game: any) => sum + game.gameDuration, 0) / gamesPlayed / 60; // Convert to minutes

      return {
        csPerMinute: {
          average: (data.totalCS / gamesPlayed) / avgGameDuration,
          byRole: this.calculateCSByRole(data.games),
          percentile: 75, // TODO: Calculate actual percentile vs rank average
          improvement: this.calculateCSImprovement(data.games),
          consistency: this.calculateCSConsistency(data.games)
        },
        laneDominance: this.calculateLaneDominance(data.games),
        visionMetrics: this.calculateVisionMetrics(data.games),
        championMastery: {
          championId: data.championId,
          championName: data.championName,
          gamesPlayed,
          winRate: (data.wins / gamesPlayed) * 100,
          averageKDA: data.games.reduce((sum: number, game: any) => sum + game.kda, 0) / gamesPlayed,
          csPerMinute: (data.totalCS / gamesPlayed) / avgGameDuration,
          goldPerMinute: (data.totalGold / gamesPlayed) / avgGameDuration,
          damageShare: 25, // TODO: Calculate actual damage share
          firstTimePerformance: gamesPlayed <= this.CHAMPION_EXPERTISE_THRESHOLD,
          masteryProgression: data.games.map((game: any, index: number) => ({
            gameNumber: index + 1,
            performance: this.calculateMatchPerformance(game)
          })),
          suspiciousIndicators: this.analyzeSuspiciousIndicators(data.games)
        }
      };
    });
  }

  private async detectSuspiciousPatterns(summoner: any, matches: any[], performanceMetrics: AdvancedPerformanceMetrics[]): Promise<SuspiciousPatterns> {
    logger.info('🚩 Detecting suspicious patterns...');

    // Analyze account behavior
    const accountBehavior = {
      rapidRankClimb: this.detectRapidRankClimb(matches),
      newAccountHighPerformance: this.detectNewAccountHighPerformance(summoner, performanceMetrics),
      inconsistentGameKnowledge: this.detectInconsistentGameKnowledge(matches),
      expertMechanics: this.detectExpertMechanics(performanceMetrics)
    };

    // Analyze performance anomalies
    const performanceFlags = {
      firstTimeChampionExpertise: this.detectFirstTimeChampionExpertise(performanceMetrics),
      unnaturalConsistency: this.detectUnnaturalConsistency(performanceMetrics),
      perfectGameSense: this.detectPerfectGameSense(matches),
      advancedStrategies: this.detectAdvancedStrategies(matches)
    };

    // Analyze social indicators (limited without friends list API)
    const socialIndicators = {
      duoWithHigherRanks: this.detectDuoWithHigherRanks(matches),
      friendListAnalysis: {
        averageFriendRank: 'Unknown',
        suspiciousConnections: 0
      },
      communicationPatterns: {
        knowledgeLevel: this.assessKnowledgeLevel(matches) as 'beginner' | 'intermediate' | 'expert',
        gameTerminology: true,
        strategicCalling: false
      }
    };

    return {
      accountBehavior,
      performanceFlags,
      socialIndicators
    };
  }

  // Helper methods for calculations
  private findPlayerInMatch(match: any): any {
    // Find the player we're analyzing in the match participants
    return match.info.participants[0]; // Simplified - need to match by puuid
  }

  private calculateMatchPerformance(participant: any): number {
    // Simplified performance calculation
    if (!participant) return 0;
    
    const kda = (participant.kills + participant.assists) / Math.max(1, participant.deaths);
    const winMultiplier = participant.win ? 1.2 : 0.8;
    
    return Math.min(10, kda * winMultiplier);
  }

  private determineSeason(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Simplified season determination
    if (month >= 0 && month <= 10) return `Season ${year}`;
    return `Preseason ${year + 1}`;
  }

  private calculateCSByRole(games: any[]): Record<string, number> {
    const roleCS: Record<string, number[]> = {};
    
    games.forEach(game => {
      const role = game.position || 'UNKNOWN';
      if (!roleCS[role]) roleCS[role] = [];
      roleCS[role].push(game.cs / (game.gameDuration / 60));
    });

    const avgByRole: Record<string, number> = {};
    Object.entries(roleCS).forEach(([role, csValues]) => {
      avgByRole[role] = csValues.reduce((sum, cs) => sum + cs, 0) / csValues.length;
    });

    return avgByRole;
  }

  private calculateCSImprovement(games: any[]): number {
    if (games.length < 5) return 0;
    
    const early = games.slice(0, Math.min(5, games.length));
    const recent = games.slice(-5);
    
    const earlyAvg = early.reduce((sum, game) => sum + (game.cs / (game.gameDuration / 60)), 0) / early.length;
    const recentAvg = recent.reduce((sum, game) => sum + (game.cs / (game.gameDuration / 60)), 0) / recent.length;
    
    return recentAvg - earlyAvg;
  }

  private calculateCSConsistency(games: any[]): number {
    const csValues = games.map(game => game.cs / (game.gameDuration / 60));
    const mean = csValues.reduce((sum, cs) => sum + cs, 0) / csValues.length;
    const variance = csValues.reduce((sum, cs) => sum + Math.pow(cs - mean, 2), 0) / csValues.length;
    
    return Math.sqrt(variance);
  }

  // Additional helper methods would be implemented here...
  private calculateLaneDominance(games: any[]): any {
    return {
      goldAdvantage: { at10min: 0, at15min: 0, average: 0 },
      csAdvantage: { at10min: 0, at15min: 0, average: 0 },
      firstBlood: 0,
      soloKills: 0,
      laneKillParticipation: 0
    };
  }

  private calculateVisionMetrics(games: any[]): any {
    return {
      wardsPerMinute: 0,
      visionScore: 0,
      controlWardUsage: 0,
      wardSurvivalTime: 0
    };
  }

  // Implement remaining helper methods...
  private analyzeSuspiciousIndicators(games: any[]): any {
    return {
      highInitialPerformance: false,
      inconsistentProgression: false,
      expertLevelPlay: false
    };
  }

  private calculateAdvancedSmurfProbability(historical: HistoricalAnalysis, performance: AdvancedPerformanceMetrics[], patterns: SuspiciousPatterns): any {
    // Advanced probability calculation with new weighting
    let score = 0;
    const reasoning: string[] = [];

    // Historical Data Analysis (30% weight)
    const historicalScore = this.scoreHistoricalData(historical);
    score += historicalScore * 0.3;
    if (historicalScore > 0.7) reasoning.push('Suspicious historical patterns detected');

    // Performance Metrics (40% weight) 
    const performanceScore = this.scorePerformanceMetrics(performance);
    score += performanceScore * 0.4;
    if (performanceScore > 0.7) reasoning.push('Anomalous performance metrics');

    // Behavioral Patterns (20% weight)
    const behavioralScore = this.scoreBehavioralPatterns(patterns);
    score += behavioralScore * 0.2;
    if (behavioralScore > 0.7) reasoning.push('Suspicious behavioral patterns');

    // Social Indicators (10% weight)
    const socialScore = this.scoreSocialIndicators(patterns);
    score += socialScore * 0.1;
    if (socialScore > 0.7) reasoning.push('Suspicious social patterns');

    const overallScore = Math.min(100, score * 100);
    
    return {
      overall: overallScore,
      confidence: this.calculateConfidence(historical, performance),
      breakdown: {
        historicalData: historicalScore * 100,
        performanceMetrics: performanceScore * 100,
        behavioralPatterns: behavioralScore * 100,
        socialIndicators: socialScore * 100
      },
      reasoning,
      evidenceStrength: this.determineEvidenceStrength(overallScore, reasoning.length)
    };
  }

  // Implement remaining methods...
  private scoreHistoricalData(historical: HistoricalAnalysis): number { return 0; }
  private scorePerformanceMetrics(performance: AdvancedPerformanceMetrics[]): number { return 0; }
  private scoreBehavioralPatterns(patterns: SuspiciousPatterns): number { return 0; }
  private scoreSocialIndicators(patterns: SuspiciousPatterns): number { return 0; }
  private calculateConfidence(historical: HistoricalAnalysis, performance: AdvancedPerformanceMetrics[]): number { return 85; }
  private determineEvidenceStrength(score: number, reasoningCount: number): 'weak' | 'moderate' | 'strong' | 'overwhelming' { return 'moderate'; }
  
  private generateDetailedReport(summonerName: string, historical: HistoricalAnalysis, performance: AdvancedPerformanceMetrics[], patterns: SuspiciousPatterns, probability: any): any {
    return {
      summary: `Comprehensive analysis of ${summonerName} reveals ${probability.evidenceStrength} evidence of smurf activity`,
      keyFindings: [
        `Account analyzed across ${historical.playtimeAnalysis.totalGames} games`,
        `Performance metrics show ${probability.breakdown.performanceMetrics}% suspicion`,
        `${historical.playtimeAnalysis.gaps.length} significant playtime gaps detected`
      ],
      timeline: [],
      recommendations: [
        'Monitor for continued suspicious patterns',
        'Verify with additional data sources if possible',
        'Consider manual review for tournament eligibility'
      ],
      comparisonToLegitPlayers: {
        similarRankAverage: {},
        percentileRankings: {}
      }
    };
  }

  // Additional helper method implementations would go here...
  private detectRapidRankClimb(matches: any[]): boolean { return false; }
  private detectNewAccountHighPerformance(summoner: any, performance: AdvancedPerformanceMetrics[]): boolean { return false; }
  private detectInconsistentGameKnowledge(matches: any[]): boolean { return false; }
  private detectExpertMechanics(performance: AdvancedPerformanceMetrics[]): boolean { return false; }
  private detectFirstTimeChampionExpertise(performance: AdvancedPerformanceMetrics[]): ChampionExpertiseFlag[] { return []; }
  private detectUnnaturalConsistency(performance: AdvancedPerformanceMetrics[]): boolean { return false; }
  private detectPerfectGameSense(matches: any[]): boolean { return false; }
  private detectAdvancedStrategies(matches: any[]): boolean { return false; }
  private detectDuoWithHigherRanks(matches: any[]): boolean { return false; }
  private assessKnowledgeLevel(matches: any[]): string { return 'intermediate'; }
  
  private calculateTimeSpan(matches: any[]): number {
    if (matches.length === 0) return 0;
    const oldest = Math.min(...matches.map(m => m.info.gameCreation));
    const newest = Math.max(...matches.map(m => m.info.gameCreation));
    return Math.floor((newest - oldest) / (24 * 60 * 60 * 1000));
  }

  private async assessDataQuality(matches: any[]): Promise<string[]> {
    const missing: string[] = [];
    if (matches.length < this.MIN_GAMES_FOR_ANALYSIS) {
      missing.push('Insufficient match history');
    }
    return missing;
  }

  private calculateReliabilityScore(matches: any[]): number {
    return Math.min(100, (matches.length / this.MIN_GAMES_FOR_ANALYSIS) * 100);
  }

  private async getCurrentRank(summonerId: string): Promise<string> {
    try {
      const entries = await this.riotApi.getLeagueEntries(summonerId);
      const ranked = entries.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5');
      return ranked ? `${ranked.tier} ${ranked.rank}` : 'Unranked';
    } catch {
      return 'Unknown';
    }
  }

  private calculatePerformanceAroundIndex(matches: any[], index: number, before: number, after: number): number {
    const startIndex = Math.max(0, index + before);
    const endIndex = Math.min(matches.length - 1, index + after);
    
    let totalPerformance = 0;
    let count = 0;
    
    for (let i = startIndex; i <= endIndex; i++) {
      const participant = this.findPlayerInMatch(matches[i]);
      if (participant) {
        totalPerformance += this.calculateMatchPerformance(participant);
        count++;
      }
    }
    
    return count > 0 ? totalPerformance / count : 0;
  }

  private calculateContextualSuspicion(gapStart: Date, gapEnd: Date): number {
    // Higher suspicion if gap coincides with season resets, major patches, etc.
    // Simplified implementation
    return 0.5;
  }

  private analyzeSkillProgression(matches: any[]): any {
    logger.info('📈 Analyzing skill progression patterns...');

    if (matches.length < 10) {
      return {
        improvementRate: 0,
        consistencyScore: 0,
        learningCurve: [],
        anomalies: {
          suddenImprovement: false,
          expertKnowledge: false,
          inconsistentMistakes: false
        }
      };
    }

    // Sort matches chronologically
    const sortedMatches = matches.sort((a, b) => a.info.gameCreation - b.info.gameCreation);
    
    // Calculate performance trend over time
    const learningCurve = sortedMatches.map((match, index) => {
      const participant = this.findPlayerInMatch(match);
      return {
        gameNumber: index + 1,
        skillLevel: this.calculateMatchPerformance(participant),
        timestamp: new Date(match.info.gameCreation)
      };
    });

    // Calculate improvement rate (linear regression slope)
    const improvementRate = this.calculateImprovementRate(learningCurve);
    
    // Calculate consistency (variance in performance)
    const performances = learningCurve.map(point => point.skillLevel);
    const mean = performances.reduce((sum, perf) => sum + perf, 0) / performances.length;
    const variance = performances.reduce((sum, perf) => sum + Math.pow(perf - mean, 2), 0) / performances.length;
    const consistencyScore = 100 - Math.min(100, Math.sqrt(variance) * 10); // Higher = more consistent

    // Detect anomalies
    const anomalies = {
      suddenImprovement: this.detectSuddenImprovement(learningCurve),
      expertKnowledge: this.detectExpertKnowledge(sortedMatches),
      inconsistentMistakes: this.detectInconsistentMistakes(sortedMatches)
    };

    return {
      improvementRate,
      consistencyScore,
      learningCurve,
      anomalies
    };
  }

  private calculateImprovementRate(learningCurve: any[]): number {
    if (learningCurve.length < 5) return 0;

    // Simple linear regression to find slope
    const n = learningCurve.length;
    const sumX = learningCurve.reduce((sum, point) => sum + point.gameNumber, 0);
    const sumY = learningCurve.reduce((sum, point) => sum + point.skillLevel, 0);
    const sumXY = learningCurve.reduce((sum, point) => sum + (point.gameNumber * point.skillLevel), 0);
    const sumXX = learningCurve.reduce((sum, point) => sum + (point.gameNumber * point.gameNumber), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private detectSuddenImprovement(learningCurve: any[]): boolean {
    // Look for sudden jumps in performance that are uncommon for natural learning
    for (let i = 5; i < learningCurve.length - 5; i++) {
      const before = learningCurve.slice(i - 5, i).reduce((sum, point) => sum + point.skillLevel, 0) / 5;
      const after = learningCurve.slice(i, i + 5).reduce((sum, point) => sum + point.skillLevel, 0) / 5;
      
      if (after - before > 2.0) { // Sudden jump of 2+ performance points
        return true;
      }
    }
    return false;
  }

  private detectExpertKnowledge(matches: any[]): boolean {
    // Look for signs of expert game knowledge inconsistent with account history
    // This is a simplified implementation - in reality would analyze build paths, 
    // skill orders, positioning, etc.
    return false;
  }

  private detectInconsistentMistakes(matches: any[]): boolean {
    // Look for patterns where player makes beginner mistakes inconsistently
    // with otherwise expert play
    return false;
  }
} 