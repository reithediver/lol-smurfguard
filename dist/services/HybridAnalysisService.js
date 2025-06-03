"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridAnalysisService = void 0;
const RankBenchmarkService_1 = require("./RankBenchmarkService");
const PlaystyleAnalysisService_1 = require("./PlaystyleAnalysisService");
class HybridAnalysisService {
    constructor(apiKey) {
        this.rankBenchmarkService = new RankBenchmarkService_1.RankBenchmarkService();
        this.playstyleAnalysisService = new PlaystyleAnalysisService_1.PlaystyleAnalysisService();
        // Initialize RiotWatcher for quick analysis
        // Note: You'd need to install riotwatcher: npm install riotwatcher
        // const RiotWatcher = require('riotwatcher');
        // this.riotWatcher = new RiotWatcher(apiKey);
        // Initialize Cassiopeia for deep analysis  
        // Note: You'd need to install cassiopeia: pip install cassiopeia
        // Then create a Python bridge or use a Node.js Cassiopeia equivalent
    }
    /**
     * Performs quick analysis using RiotWatcher for immediate response
     */
    async performQuickAnalysis(summonerName, region = 'na1') {
        const startTime = Date.now();
        try {
            // 1. Get basic summoner info
            const summoner = await this.getSummonerInfo(summonerName, region);
            // 2. Get recent matches (last 20 games)
            const recentMatches = await this.getRecentMatches(summoner.puuid, 20);
            // 3. Calculate recent performance metrics
            const recentMetrics = this.calculateRecentMetrics(recentMatches, summoner.puuid);
            // 4. Get current rank
            const rankInfo = await this.getCurrentRank(summoner.id, region);
            // 5. Compare to rank benchmarks
            const rankComparison = this.rankBenchmarkService.comparePlayerToRank(recentMetrics, recentMetrics.primaryRole, rankInfo.tier);
            // 6. Quick suspicion assessment
            const { suspicionLevel, quickFlags } = this.assessQuickSuspicion(rankComparison, recentMetrics, summoner);
            const responseTime = Date.now() - startTime;
            return {
                summoner,
                recentMatches,
                rankComparison,
                suspicionLevel,
                quickFlags,
                responseTime
            };
        }
        catch (error) {
            throw new Error(`Quick analysis failed: ${error}`);
        }
    }
    /**
     * Performs deep historical analysis using Cassiopeia
     */
    async performDeepAnalysis(summonerName, region = 'na1') {
        try {
            // 1. Get extensive match history (6+ months)
            const historicalMatches = await this.getExtensiveMatchHistory(summonerName, region);
            // 2. Analyze playstyle evolution
            const playstyleEvolution = await this.playstyleAnalysisService.analyzePlaystyleEvolution(historicalMatches);
            // 3. Analyze rank progression over time
            const rankProgression = await this.analyzeRankProgression(summonerName, region);
            // 4. Detailed rank comparisons across time windows
            const detailedComparisons = await this.performDetailedComparisons(historicalMatches, rankProgression);
            // 5. Detect smurf indicators
            const smurfIndicators = this.detectSmurfIndicators(playstyleEvolution, rankProgression, historicalMatches);
            // 6. Calculate overall confidence
            const confidenceScore = this.calculateDeepConfidence(playstyleEvolution, smurfIndicators, detailedComparisons);
            return {
                historicalData: {
                    totalMatches: historicalMatches.length,
                    timeSpanMonths: this.calculateTimeSpan(historicalMatches),
                    oldestMatch: historicalMatches.length > 0 ?
                        new Date(historicalMatches[historicalMatches.length - 1].info.gameCreation) : null,
                    newestMatch: historicalMatches.length > 0 ?
                        new Date(historicalMatches[0].info.gameCreation) : null
                },
                playstyleEvolution: {
                    shifts: playstyleEvolution.playstyleShifts,
                    championEvolution: playstyleEvolution.championEvolution,
                    overallSuspicionScore: playstyleEvolution.overallSuspicionScore
                },
                rankProgression,
                detailedComparisons,
                smurfIndicators,
                confidenceScore
            };
        }
        catch (error) {
            throw new Error(`Deep analysis failed: ${error}`);
        }
    }
    /**
     * Combines quick and deep analysis for comprehensive result
     */
    async performHybridAnalysis(summonerName, region = 'na1', includeDeep = true) {
        // Always perform quick analysis first
        const quick = await this.performQuickAnalysis(summonerName, region);
        let deep;
        // Perform deep analysis if requested and quick analysis shows suspicion
        if (includeDeep && (quick.suspicionLevel === 'high' || quick.suspicionLevel === 'very_high')) {
            try {
                deep = await this.performDeepAnalysis(summonerName, region);
            }
            catch (error) {
                console.warn('Deep analysis failed, proceeding with quick analysis only:', error);
            }
        }
        // Generate recommendation
        const recommendation = this.generateRecommendation(quick, deep);
        return {
            quick,
            deep,
            recommendation
        };
    }
    async getSummonerInfo(summonerName, region) {
        // Mock implementation - replace with actual RiotWatcher call
        // return this.riotWatcher.getSummoner(region, summonerName);
        return {
            id: 'mock_id',
            puuid: 'mock_puuid',
            name: summonerName,
            summonerLevel: 150,
            profileIconId: 123
        };
    }
    async getRecentMatches(puuid, count) {
        // Mock implementation - replace with actual RiotWatcher call
        // const matchIds = await this.riotWatcher.getMatchIds(puuid, count);
        // return Promise.all(matchIds.map(id => this.riotWatcher.getMatch(id)));
        return [];
    }
    async getCurrentRank(summonerId, region) {
        // Mock implementation - replace with actual RiotWatcher call
        // return this.riotWatcher.getLeagueEntries(region, summonerId);
        return {
            tier: 'GOLD',
            rank: 'II',
            leaguePoints: 45
        };
    }
    async getExtensiveMatchHistory(summonerName, region) {
        // This would use Cassiopeia to get extensive match history
        // Example: Get all matches from the last 6-12 months
        // return await cassiopeia.getSummoner(summonerName, region).matchHistory;
        return [];
    }
    calculateRecentMetrics(matches, puuid) {
        // Calculate metrics from recent matches
        if (matches.length === 0) {
            return {
                csPerMin: 0,
                kda: 0,
                killParticipation: 0,
                visionScore: 0,
                primaryRole: 'UNKNOWN',
                winRate: 0,
                averageGameLength: 0
            };
        }
        // Extract player data from matches and calculate averages
        // This is a simplified version - you'd implement full metric calculation
        return {
            csPerMin: 6.5, // Mock value
            kda: 2.8, // Mock value
            killParticipation: 68,
            visionScore: 25,
            primaryRole: 'MIDDLE',
            winRate: 0.65,
            averageGameLength: 28
        };
    }
    assessQuickSuspicion(rankComparison, metrics, summoner) {
        const flags = [];
        let suspicionScore = 0;
        // Assess rank comparison suspicion
        rankComparison.forEach(comparison => {
            suspicionScore += comparison.suspiciousLevel;
            if (comparison.status === 'exceptional') {
                flags.push(`${comparison.metric} is exceptional for rank (${comparison.percentile}th percentile)`);
            }
        });
        // Additional quick checks
        if (summoner.summonerLevel < 50 && metrics.kda > 3.0) {
            flags.push('High KDA on low-level account');
            suspicionScore += 25;
        }
        if (metrics.csPerMin > 7.5 && summoner.summonerLevel < 100) {
            flags.push('Exceptional CS efficiency on relatively new account');
            suspicionScore += 20;
        }
        // Determine suspicion level
        let suspicionLevel;
        if (suspicionScore >= 80) {
            suspicionLevel = 'very_high';
        }
        else if (suspicionScore >= 60) {
            suspicionLevel = 'high';
        }
        else if (suspicionScore >= 30) {
            suspicionLevel = 'moderate';
        }
        else {
            suspicionLevel = 'low';
        }
        return { suspicionLevel, quickFlags: flags };
    }
    async analyzeRankProgression(summonerName, region) {
        // Analyze rank changes over time
        // This would use historical rank data to detect unusual climbing patterns
        return {
            rankHistory: [],
            unusualClimbs: [],
            rankStagnation: []
        };
    }
    async performDetailedComparisons(matches, rankProgression) {
        // Perform detailed comparisons across different time windows and ranks
        return {
            byTimeWindow: [],
            byRank: [],
            percentileRankings: {}
        };
    }
    detectSmurfIndicators(playstyleEvolution, rankProgression, matches) {
        return {
            accountSwitchingPattern: playstyleEvolution.playstyleShifts.some((shift) => shift.type === 'dramatic'),
            skillInconsistency: playstyleEvolution.overallSuspicionScore > 70,
            championMasteryAnomalies: playstyleEvolution.championEvolution.some((evolution) => evolution.suspicionFlags.tooGoodTooFast),
            performanceOutliers: false // Would implement based on statistical analysis
        };
    }
    calculateDeepConfidence(playstyleEvolution, smurfIndicators, detailedComparisons) {
        let confidence = 0;
        // Factor in playstyle evolution suspicion
        confidence += playstyleEvolution.overallSuspicionScore * 0.4;
        // Factor in smurf indicators
        const indicatorCount = Object.values(smurfIndicators).filter(Boolean).length;
        confidence += indicatorCount * 15;
        // Cap at 100
        return Math.min(100, confidence);
    }
    calculateTimeSpan(matches) {
        if (matches.length < 2)
            return 0;
        const oldest = new Date(matches[matches.length - 1].info.gameCreation);
        const newest = new Date(matches[0].info.gameCreation);
        return Math.round((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30));
    }
    generateRecommendation(quick, deep) {
        const reasoning = [];
        const evidence = [];
        let confidence = 0;
        let action = 'allow';
        // Analyze quick results
        if (quick.suspicionLevel === 'very_high') {
            reasoning.push('Very high suspicion from recent performance analysis');
            evidence.push(...quick.quickFlags);
            confidence += 40;
        }
        else if (quick.suspicionLevel === 'high') {
            reasoning.push('High suspicion from recent performance analysis');
            evidence.push(...quick.quickFlags);
            confidence += 25;
        }
        // Analyze deep results if available
        if (deep) {
            if (deep.confidenceScore > 80) {
                reasoning.push('Deep historical analysis shows strong smurf indicators');
                confidence += 45;
            }
            else if (deep.confidenceScore > 60) {
                reasoning.push('Deep historical analysis shows moderate smurf indicators');
                confidence += 30;
            }
            // Add specific evidence from deep analysis
            if (deep.smurfIndicators.accountSwitchingPattern) {
                evidence.push('Account switching pattern detected');
            }
            if (deep.smurfIndicators.championMasteryAnomalies) {
                evidence.push('Unusual champion mastery progression');
            }
            if (deep.playstyleEvolution.shifts.length > 0) {
                evidence.push(`${deep.playstyleEvolution.shifts.length} significant playstyle shifts detected`);
            }
        }
        // Determine action based on confidence
        if (confidence >= 80) {
            action = 'ban_recommend';
        }
        else if (confidence >= 60) {
            action = 'flag';
        }
        else if (confidence >= 30) {
            action = 'investigate';
        }
        return {
            action,
            confidence: Math.min(100, confidence),
            reasoning,
            evidence
        };
    }
}
exports.HybridAnalysisService = HybridAnalysisService;
