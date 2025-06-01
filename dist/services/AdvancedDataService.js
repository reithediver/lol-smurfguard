"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedDataService = void 0;
const loggerService_1 = require("../utils/loggerService");
class AdvancedDataService {
    constructor(riotApi) {
        this.ANALYSIS_TIMESPAN_MONTHS = 24; // 2 years of data
        this.MIN_GAMES_FOR_ANALYSIS = 50;
        this.CHAMPION_EXPERTISE_THRESHOLD = 3; // Games to determine expertise
        this.riotApi = riotApi;
    }
    async analyzePlayerComprehensively(summonerName) {
        loggerService_1.logger.info(`🔍 Starting comprehensive analysis for: ${summonerName}`);
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
        }
        catch (error) {
            loggerService_1.logger.error(`Error in comprehensive analysis for ${summonerName}:`, error);
            throw error;
        }
    }
    async getExtensiveMatchHistory(puuid) {
        loggerService_1.logger.info('📚 Collecting extensive match history (up to 2 years)...');
        const allMatches = [];
        const startTime = Date.now() - (this.ANALYSIS_TIMESPAN_MONTHS * 30 * 24 * 60 * 60 * 1000);
        try {
            // Get match IDs in batches
            let start = 0;
            const count = 100;
            let hasMoreMatches = true;
            while (hasMoreMatches && allMatches.length < 2000) { // Cap at 2000 games
                const matchIds = await this.riotApi.getMatchHistory(puuid, startTime, undefined);
                if (matchIds.length === 0) {
                    hasMoreMatches = false;
                    break;
                }
                // Get detailed match data
                for (const matchId of matchIds) {
                    try {
                        const matchDetails = await this.riotApi.getMatchDetails(matchId);
                        allMatches.push(matchDetails);
                        // Rate limiting
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    catch (error) {
                        loggerService_1.logger.warn(`Failed to get match details for ${matchId}:`, error);
                    }
                }
                start += count;
                // Break if we have enough matches or if we're getting old matches
                const oldestMatch = allMatches[allMatches.length - 1];
                if (oldestMatch && oldestMatch.info.gameCreation < startTime) {
                    hasMoreMatches = false;
                }
            }
            loggerService_1.logger.info(`📊 Collected ${allMatches.length} matches for analysis`);
            return allMatches;
        }
        catch (error) {
            loggerService_1.logger.error('Error collecting extensive match history:', error);
            return [];
        }
    }
    async analyzeHistoricalPatterns(summoner, matches) {
        loggerService_1.logger.info('🕰️ Analyzing historical patterns...');
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
    analyzeSeasonalHistory(matches) {
        const seasonalData = {};
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
                if (participant.win)
                    seasonalData[season].wins++;
                seasonalData[season].totalPerformance += this.calculateMatchPerformance(participant);
            }
        });
        return Object.entries(seasonalData).map(([season, data]) => ({
            season,
            rank: 'Unknown', // TODO: Get historical rank data
            gamesPlayed: data.gamesPlayed,
            winRate: data.gamesPlayed > 0 ? (data.wins / data.gamesPlayed) * 100 : 0,
            averagePerformance: data.gamesPlayed > 0 ? data.totalPerformance / data.gamesPlayed : 0
        }));
    }
    analyzePlaytimePatterns(matches) {
        loggerService_1.logger.info('⏰ Analyzing playtime patterns and gaps...');
        // Sort matches by date
        const sortedMatches = matches.sort((a, b) => a.info.gameCreation - b.info.gameCreation);
        // Calculate daily/weekly patterns
        const hourlyDistribution = {};
        const weeklyDistribution = {};
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
    detectPlaytimeGaps(sortedMatches) {
        const gaps = [];
        const GAP_THRESHOLD_DAYS = 7; // Consider gaps of 7+ days
        for (let i = 1; i < sortedMatches.length; i++) {
            const currentGame = new Date(sortedMatches[i].info.gameCreation);
            const previousGame = new Date(sortedMatches[i - 1].info.gameCreation);
            const gapDays = Math.floor((currentGame.getTime() - previousGame.getTime()) / (24 * 60 * 60 * 1000));
            if (gapDays >= GAP_THRESHOLD_DAYS) {
                // Analyze performance before and after gap
                const performanceBefore = this.calculatePerformanceAroundIndex(sortedMatches, i - 1, -5, 0);
                const performanceAfter = this.calculatePerformanceAroundIndex(sortedMatches, i, 0, 5);
                // Determine suspicion level based on performance change and context
                const performanceImprovement = performanceAfter - performanceBefore;
                let suspicionLevel = 'low';
                if (gapDays > 30 && performanceImprovement > 0.3) {
                    suspicionLevel = 'high';
                }
                else if (gapDays > 14 && performanceImprovement > 0.2) {
                    suspicionLevel = 'medium';
                }
                gaps.push({
                    gapStart: previousGame,
                    gapEnd: currentGame,
                    durationDays: gapDays,
                    contextualSuspicion: this.calculateContextualSuspicion(previousGame, currentGame),
                    performanceBeforeGap: performanceBefore,
                    performanceAfterGap: performanceAfter,
                    suspicionLevel
                });
            }
        }
        return gaps;
    }
    async calculateAdvancedMetrics(matches) {
        loggerService_1.logger.info('📊 Calculating advanced performance metrics...');
        const championMetrics = {};
        matches.forEach(match => {
            const participant = this.findPlayerInMatch(match);
            if (!participant)
                return;
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
            if (gameMetrics.win)
                championMetrics[championId].wins++;
        });
        // Convert to advanced metrics format
        return Object.values(championMetrics).map((data) => {
            const gamesPlayed = data.games.length;
            const avgGameDuration = data.games.reduce((sum, game) => sum + game.gameDuration, 0) / gamesPlayed / 60; // Convert to minutes
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
                    averageKDA: data.games.reduce((sum, game) => sum + game.kda, 0) / gamesPlayed,
                    csPerMinute: (data.totalCS / gamesPlayed) / avgGameDuration,
                    goldPerMinute: (data.totalGold / gamesPlayed) / avgGameDuration,
                    damageShare: 25, // TODO: Calculate actual damage share
                    firstTimePerformance: gamesPlayed <= this.CHAMPION_EXPERTISE_THRESHOLD,
                    masteryProgression: data.games.map((game, index) => ({
                        gameNumber: index + 1,
                        performance: this.calculateMatchPerformance(game)
                    })),
                    suspiciousIndicators: this.analyzeSuspiciousIndicators(data.games)
                }
            };
        });
    }
    async detectSuspiciousPatterns(summoner, matches, performanceMetrics) {
        loggerService_1.logger.info('🚩 Detecting suspicious patterns...');
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
                knowledgeLevel: this.assessKnowledgeLevel(matches),
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
    findPlayerInMatch(match) {
        // Find the player we're analyzing in the match participants
        return match.info.participants[0]; // Simplified - need to match by puuid
    }
    calculateMatchPerformance(participant) {
        // Simplified performance calculation
        if (!participant)
            return 0;
        const kda = (participant.kills + participant.assists) / Math.max(1, participant.deaths);
        const winMultiplier = participant.win ? 1.2 : 0.8;
        return Math.min(10, kda * winMultiplier);
    }
    determineSeason(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        // Simplified season determination
        if (month >= 0 && month <= 10)
            return `Season ${year}`;
        return `Preseason ${year + 1}`;
    }
    calculateCSByRole(games) {
        const roleCS = {};
        games.forEach(game => {
            const role = game.position || 'UNKNOWN';
            if (!roleCS[role])
                roleCS[role] = [];
            roleCS[role].push(game.cs / (game.gameDuration / 60));
        });
        const avgByRole = {};
        Object.entries(roleCS).forEach(([role, csValues]) => {
            avgByRole[role] = csValues.reduce((sum, cs) => sum + cs, 0) / csValues.length;
        });
        return avgByRole;
    }
    calculateCSImprovement(games) {
        if (games.length < 5)
            return 0;
        const early = games.slice(0, Math.min(5, games.length));
        const recent = games.slice(-5);
        const earlyAvg = early.reduce((sum, game) => sum + (game.cs / (game.gameDuration / 60)), 0) / early.length;
        const recentAvg = recent.reduce((sum, game) => sum + (game.cs / (game.gameDuration / 60)), 0) / recent.length;
        return recentAvg - earlyAvg;
    }
    calculateCSConsistency(games) {
        const csValues = games.map(game => game.cs / (game.gameDuration / 60));
        const mean = csValues.reduce((sum, cs) => sum + cs, 0) / csValues.length;
        const variance = csValues.reduce((sum, cs) => sum + Math.pow(cs - mean, 2), 0) / csValues.length;
        return Math.sqrt(variance);
    }
    // Additional helper methods would be implemented here...
    calculateLaneDominance(games) {
        return {
            goldAdvantage: { at10min: 0, at15min: 0, average: 0 },
            csAdvantage: { at10min: 0, at15min: 0, average: 0 },
            firstBlood: 0,
            soloKills: 0,
            laneKillParticipation: 0
        };
    }
    calculateVisionMetrics(games) {
        return {
            wardsPerMinute: 0,
            visionScore: 0,
            controlWardUsage: 0,
            wardSurvivalTime: 0
        };
    }
    // Implement remaining helper methods...
    analyzeSuspiciousIndicators(games) {
        return {
            highInitialPerformance: false,
            inconsistentProgression: false,
            expertLevelPlay: false
        };
    }
    calculateAdvancedSmurfProbability(historical, performance, patterns) {
        // Advanced probability calculation with new weighting
        let score = 0;
        const reasoning = [];
        // Historical Data Analysis (30% weight)
        const historicalScore = this.scoreHistoricalData(historical);
        score += historicalScore * 0.3;
        if (historicalScore > 0.7)
            reasoning.push('Suspicious historical patterns detected');
        // Performance Metrics (40% weight) 
        const performanceScore = this.scorePerformanceMetrics(performance);
        score += performanceScore * 0.4;
        if (performanceScore > 0.7)
            reasoning.push('Anomalous performance metrics');
        // Behavioral Patterns (20% weight)
        const behavioralScore = this.scoreBehavioralPatterns(patterns);
        score += behavioralScore * 0.2;
        if (behavioralScore > 0.7)
            reasoning.push('Suspicious behavioral patterns');
        // Social Indicators (10% weight)
        const socialScore = this.scoreSocialIndicators(patterns);
        score += socialScore * 0.1;
        if (socialScore > 0.7)
            reasoning.push('Suspicious social patterns');
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
    scoreHistoricalData(historical) { return 0; }
    scorePerformanceMetrics(performance) { return 0; }
    scoreBehavioralPatterns(patterns) { return 0; }
    scoreSocialIndicators(patterns) { return 0; }
    calculateConfidence(historical, performance) { return 85; }
    determineEvidenceStrength(score, reasoningCount) { return 'moderate'; }
    generateDetailedReport(summonerName, historical, performance, patterns, probability) {
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
    detectRapidRankClimb(matches) { return false; }
    detectNewAccountHighPerformance(summoner, performance) { return false; }
    detectInconsistentGameKnowledge(matches) { return false; }
    detectExpertMechanics(performance) { return false; }
    detectFirstTimeChampionExpertise(performance) { return []; }
    detectUnnaturalConsistency(performance) { return false; }
    detectPerfectGameSense(matches) { return false; }
    detectAdvancedStrategies(matches) { return false; }
    detectDuoWithHigherRanks(matches) { return false; }
    assessKnowledgeLevel(matches) { return 'intermediate'; }
    calculateTimeSpan(matches) {
        if (matches.length === 0)
            return 0;
        const oldest = Math.min(...matches.map(m => m.info.gameCreation));
        const newest = Math.max(...matches.map(m => m.info.gameCreation));
        return Math.floor((newest - oldest) / (24 * 60 * 60 * 1000));
    }
    async assessDataQuality(matches) {
        const missing = [];
        if (matches.length < this.MIN_GAMES_FOR_ANALYSIS) {
            missing.push('Insufficient match history');
        }
        return missing;
    }
    calculateReliabilityScore(matches) {
        return Math.min(100, (matches.length / this.MIN_GAMES_FOR_ANALYSIS) * 100);
    }
    async getCurrentRank(summonerId) {
        try {
            const entries = await this.riotApi.getLeagueEntries(summonerId);
            const ranked = entries.find((entry) => entry.queueType === 'RANKED_SOLO_5x5');
            return ranked ? `${ranked.tier} ${ranked.rank}` : 'Unranked';
        }
        catch {
            return 'Unknown';
        }
    }
    calculatePerformanceAroundIndex(matches, index, before, after) {
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
    calculateContextualSuspicion(gapStart, gapEnd) {
        // Higher suspicion if gap coincides with season resets, major patches, etc.
        // Simplified implementation
        return 0.5;
    }
    analyzeSkillProgression(matches) {
        loggerService_1.logger.info('📈 Analyzing skill progression patterns...');
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
    calculateImprovementRate(learningCurve) {
        if (learningCurve.length < 5)
            return 0;
        // Simple linear regression to find slope
        const n = learningCurve.length;
        const sumX = learningCurve.reduce((sum, point) => sum + point.gameNumber, 0);
        const sumY = learningCurve.reduce((sum, point) => sum + point.skillLevel, 0);
        const sumXY = learningCurve.reduce((sum, point) => sum + (point.gameNumber * point.skillLevel), 0);
        const sumXX = learningCurve.reduce((sum, point) => sum + (point.gameNumber * point.gameNumber), 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }
    detectSuddenImprovement(learningCurve) {
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
    detectExpertKnowledge(matches) {
        // Look for signs of expert game knowledge inconsistent with account history
        // This is a simplified implementation - in reality would analyze build paths, 
        // skill orders, positioning, etc.
        return false;
    }
    detectInconsistentMistakes(matches) {
        // Look for patterns where player makes beginner mistakes inconsistently
        // with otherwise expert play
        return false;
    }
}
exports.AdvancedDataService = AdvancedDataService;
