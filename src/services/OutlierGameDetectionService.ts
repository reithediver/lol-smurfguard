import { MatchHistory, MatchParticipant } from '../models/MatchHistory';
import logger from '../utils/loggerService';

export interface OutlierGame {
    matchId: string;
    gameDate: Date;
    championId: number;
    championName: string;
    position: string;
    gameDuration: number; // in seconds
    queueId: number;
    queueType: string;
    
    // Core Performance Metrics
    kda: number;
    kills: number;
    deaths: number;
    assists: number;
    csPerMinute: number;
    totalCS: number;
    goldPerMinute: number;
    totalGold: number;
    damagePerMinute: number;
    totalDamage: number;
    visionScore: number;
    
    // Advanced Metrics
    killParticipation: number; // % of team kills involved in
    damageShare: number; // % of team damage
    goldAdvantage: number; // Gold lead over opponents
    csAdvantage: number; // CS advantage at 15min (estimated)
    
    // Outlier Scoring
    outlierScore: number; // 0-100, higher = more suspicious
    outlierFlags: OutlierFlag[];
    
    // MVP Indicators
    teamMVP: boolean;
    gameCarried: boolean;
    perfectGame: boolean; // No deaths + high impact
    
    // Match Context
    averageRankTier: string; // Estimated average game rank
    opponentStrength: number; // 1-10 scale
    matchCompetitiveness: number; // How close the game was
    
    // Links
    matchUrl?: string; // Link to OP.GG or similar
}

export interface OutlierFlag {
    type: 'HIGH_KDA' | 'PERFECT_CS' | 'DAMAGE_CARRY' | 'VISION_CONTROL' | 'GOLD_LEAD' | 'KILL_PRESSURE' | 'FIRST_TIME_EXPERT';
    severity: 'MINOR' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    description: string;
    value: number; // The actual value that triggered the flag
    percentile: number; // Where this performance ranks (95th percentile = top 5%)
}

export interface OutlierAnalysisResult {
    totalGamesAnalyzed: number;
    outlierGames: OutlierGame[];
    outlierRate: number; // % of games that were outliers
    averageOutlierScore: number;
    topOutlierFlags: OutlierFlag[];
    suspicionSummary: {
        consistentlyHighPerformance: boolean;
        improvesTooQuickly: boolean;
        expertOnNewChampions: boolean;
        mvpFrequency: number; // % of games where player was MVP
    };
}

export class OutlierGameDetectionService {
    
    // Rank-based thresholds for outlier detection
    private readonly RANK_THRESHOLDS = {
        'IRON': { kda: 1.2, csPerMin: 4.0, damageShare: 15, visionScore: 12 },
        'BRONZE': { kda: 1.5, csPerMin: 5.0, damageShare: 18, visionScore: 15 },
        'SILVER': { kda: 1.8, csPerMin: 5.5, damageShare: 20, visionScore: 18 },
        'GOLD': { kda: 2.1, csPerMin: 6.0, damageShare: 22, visionScore: 20 },
        'PLATINUM': { kda: 2.4, csPerMin: 6.5, damageShare: 24, visionScore: 22 },
        'DIAMOND': { kda: 2.7, csPerMin: 7.0, damageShare: 26, visionScore: 25 },
        'MASTER': { kda: 3.0, csPerMin: 7.5, damageShare: 28, visionScore: 28 },
        'GRANDMASTER': { kda: 3.2, csPerMin: 8.0, damageShare: 30, visionScore: 30 },
        'CHALLENGER': { kda: 3.5, csPerMin: 8.5, damageShare: 32, visionScore: 32 }
    };

    async analyzeOutlierGames(
        matches: MatchHistory[], 
        puuid: string, 
        estimatedRank: string = 'GOLD'
    ): Promise<OutlierAnalysisResult> {
        logger.info(`🔍 Analyzing ${matches.length} matches for outlier performance...`);
        
        const outlierGames: OutlierGame[] = [];
        const processedMatches = matches.filter(match => 
            match.participants.some(p => p.puuid === puuid)
        );

        for (const match of processedMatches) {
            const player = match.participants.find(p => p.puuid === puuid);
            if (!player) continue;

            const outlierGame = await this.analyzeGameForOutliers(match, player, estimatedRank);
            
            // Only include games that score above outlier threshold
            if (outlierGame.outlierScore >= 60) {
                outlierGames.push(outlierGame);
            }
        }

        // Sort by outlier score (highest first)
        outlierGames.sort((a, b) => b.outlierScore - a.outlierScore);

        const result = this.generateOutlierSummary(outlierGames, processedMatches.length);
        
        logger.info(`✅ Outlier analysis complete: ${outlierGames.length}/${processedMatches.length} games flagged as outliers`);
        logger.info(`📊 Average outlier score: ${result.averageOutlierScore.toFixed(1)} | Outlier rate: ${(result.outlierRate * 100).toFixed(1)}%`);
        
        return result;
    }

    private async analyzeGameForOutliers(
        match: MatchHistory, 
        player: MatchParticipant, 
        estimatedRank: string
    ): Promise<OutlierGame> {
        const gameMinutes = match.gameDuration / 60;
        const thresholds = this.RANK_THRESHOLDS[estimatedRank as keyof typeof this.RANK_THRESHOLDS] || this.RANK_THRESHOLDS.GOLD;
        
        // Calculate basic metrics
        const kda = (player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths);
        const csPerMinute = player.stats.cs / gameMinutes;
        const goldPerMinute = player.stats.goldEarned / gameMinutes;
        const damagePerMinute = player.stats.totalDamageDealt / gameMinutes;
        
        // Calculate team context metrics
        const playerTeam = match.teams.find(t => t.teamId === player.teamId);
        const teamParticipants = match.participants.filter(p => p.teamId === player.teamId);
        const enemyParticipants = match.participants.filter(p => p.teamId !== player.teamId);
        
        const teamKills = teamParticipants.reduce((sum, p) => sum + p.stats.kills, 0);
        const teamDamage = teamParticipants.reduce((sum, p) => sum + p.stats.totalDamageDealt, 0);
        const killParticipation = teamKills > 0 ? ((player.stats.kills + player.stats.assists) / teamKills) * 100 : 0;
        const damageShare = teamDamage > 0 ? (player.stats.totalDamageDealt / teamDamage) * 100 : 0;
        
        // Calculate opponent strength (simplified)
        const avgEnemyGold = enemyParticipants.reduce((sum, p) => sum + p.stats.goldEarned, 0) / enemyParticipants.length;
        const opponentStrength = Math.min(10, Math.max(1, avgEnemyGold / 12000 * 10));
        
        // Detect outlier flags
        const outlierFlags = this.detectOutlierFlags(player, thresholds, {
            kda,
            csPerMinute,
            goldPerMinute,
            damagePerMinute,
            killParticipation,
            damageShare,
            gameMinutes
        });
        
        // Calculate overall outlier score
        const outlierScore = this.calculateOutlierScore(outlierFlags, player, thresholds);
        
        // MVP detection
        const teamMVP = this.isTeamMVP(player, teamParticipants);
        const gameCarried = damageShare > 35 && killParticipation > 70 && player.stats.win;
        const perfectGame = player.stats.deaths === 0 && kda >= 3.0 && killParticipation > 50;
        
        // Generate match URL (OP.GG style)
        const region = this.extractRegionFromMatch(match);
        const matchUrl = `https://op.gg/summoners/${region}/${player.summonerName}/matches/${match.matchId}`;
        
        return {
            matchId: match.matchId,
            gameDate: match.gameCreation,
            championId: player.championId,
            championName: player.championName,
            position: player.position || 'UNKNOWN',
            gameDuration: match.gameDuration,
            queueId: match.queueId,
            queueType: this.getQueueTypeName(match.queueId),
            
            // Core metrics
            kda,
            kills: player.stats.kills,
            deaths: player.stats.deaths,
            assists: player.stats.assists,
            csPerMinute,
            totalCS: player.stats.cs,
            goldPerMinute,
            totalGold: player.stats.goldEarned,
            damagePerMinute,
            totalDamage: player.stats.totalDamageDealt,
            visionScore: player.stats.visionScore,
            
            // Advanced metrics
            killParticipation,
            damageShare,
            goldAdvantage: player.stats.goldEarned - avgEnemyGold,
            csAdvantage: player.stats.cs - (enemyParticipants.reduce((sum, p) => sum + p.stats.cs, 0) / enemyParticipants.length),
            
            // Outlier analysis
            outlierScore,
            outlierFlags,
            
            // MVP indicators
            teamMVP,
            gameCarried,
            perfectGame,
            
            // Match context
            averageRankTier: estimatedRank,
            opponentStrength,
            matchCompetitiveness: this.calculateMatchCompetitiveness(match),
            
            matchUrl
        };
    }

    private detectOutlierFlags(
        player: MatchParticipant, 
        thresholds: any, 
        metrics: any
    ): OutlierFlag[] {
        const flags: OutlierFlag[] = [];
        
        // High KDA detection
        if (metrics.kda >= thresholds.kda * 2.0) {
            flags.push({
                type: 'HIGH_KDA',
                severity: metrics.kda >= thresholds.kda * 3.0 ? 'CRITICAL' : 'HIGH',
                description: `Exceptional KDA of ${metrics.kda.toFixed(2)} (${(metrics.kda / thresholds.kda * 100 - 100).toFixed(0)}% above expected)`,
                value: metrics.kda,
                percentile: Math.min(99, 75 + (metrics.kda / thresholds.kda - 1) * 20)
            });
        }
        
        // Perfect CS detection
        if (metrics.csPerMinute >= thresholds.csPerMin * 1.3) {
            flags.push({
                type: 'PERFECT_CS',
                severity: metrics.csPerMinute >= thresholds.csPerMin * 1.5 ? 'CRITICAL' : 'HIGH',
                description: `Perfect CS efficiency: ${metrics.csPerMinute.toFixed(1)} CS/min (${((metrics.csPerMinute / thresholds.csPerMin - 1) * 100).toFixed(0)}% above expected)`,
                value: metrics.csPerMinute,
                percentile: Math.min(99, 80 + (metrics.csPerMinute / thresholds.csPerMin - 1) * 15)
            });
        }
        
        // Damage carry detection
        if (metrics.damageShare >= 35) {
            flags.push({
                type: 'DAMAGE_CARRY',
                severity: metrics.damageShare >= 45 ? 'CRITICAL' : 'HIGH',
                description: `Exceptional damage output: ${metrics.damageShare.toFixed(1)}% of team damage`,
                value: metrics.damageShare,
                percentile: Math.min(99, 70 + metrics.damageShare)
            });
        }
        
        // Vision control detection
        if (player.stats.visionScore >= thresholds.visionScore * 1.5) {
            flags.push({
                type: 'VISION_CONTROL',
                severity: player.stats.visionScore >= thresholds.visionScore * 2.0 ? 'HIGH' : 'MODERATE',
                description: `Superior vision control: ${player.stats.visionScore} vision score`,
                value: player.stats.visionScore,
                percentile: Math.min(95, 75 + (player.stats.visionScore / thresholds.visionScore - 1) * 10)
            });
        }
        
        // Gold efficiency detection
        if (metrics.goldPerMinute >= 450) { // High gold per minute threshold
            flags.push({
                type: 'GOLD_LEAD',
                severity: metrics.goldPerMinute >= 550 ? 'HIGH' : 'MODERATE',
                description: `Exceptional gold efficiency: ${metrics.goldPerMinute.toFixed(0)} gold/min`,
                value: metrics.goldPerMinute,
                percentile: Math.min(95, 70 + (metrics.goldPerMinute - 350) / 10)
            });
        }
        
        // Kill pressure detection
        if (metrics.killParticipation >= 80) {
            flags.push({
                type: 'KILL_PRESSURE',
                severity: metrics.killParticipation >= 90 ? 'HIGH' : 'MODERATE',
                description: `Exceptional kill participation: ${metrics.killParticipation.toFixed(1)}%`,
                value: metrics.killParticipation,
                percentile: Math.min(95, 60 + metrics.killParticipation / 2)
            });
        }
        
        return flags;
    }

    private calculateOutlierScore(flags: OutlierFlag[], player: MatchParticipant, thresholds: any): number {
        let score = 0;
        
        // Base score from flags
        flags.forEach(flag => {
            switch (flag.severity) {
                case 'CRITICAL': score += 25; break;
                case 'HIGH': score += 15; break;
                case 'MODERATE': score += 8; break;
                case 'MINOR': score += 3; break;
            }
        });
        
        // Bonus for perfect games
        if (player.stats.deaths === 0 && player.stats.kills + player.stats.assists >= 10) {
            score += 20;
        }
        
        // Bonus for multi-category excellence
        if (flags.length >= 3) {
            score += 10;
        }
        
        return Math.min(100, score);
    }

    private isTeamMVP(player: MatchParticipant, teamParticipants: MatchParticipant[]): boolean {
        // Simple MVP calculation - highest combined score
        const playerScore = (player.stats.kills * 2) + player.stats.assists + 
                           (player.stats.totalDamageDealt / 1000) + 
                           (player.stats.goldEarned / 1000);
        
        const maxTeamScore = Math.max(...teamParticipants.map(p => 
            (p.stats.kills * 2) + p.stats.assists + 
            (p.stats.totalDamageDealt / 1000) + 
            (p.stats.goldEarned / 1000)
        ));
        
        return playerScore === maxTeamScore;
    }

    private calculateMatchCompetitiveness(match: MatchHistory): number {
        // Calculate how close the game was (1-10 scale)
        const team1Gold = match.participants.filter(p => p.teamId === 100)
            .reduce((sum, p) => sum + p.stats.goldEarned, 0);
        const team2Gold = match.participants.filter(p => p.teamId === 200)
            .reduce((sum, p) => sum + p.stats.goldEarned, 0);
        
        const goldDifference = Math.abs(team1Gold - team2Gold);
        const averageGold = (team1Gold + team2Gold) / 2;
        const goldDifferencePercentage = (goldDifference / averageGold) * 100;
        
        // Convert to competitiveness score (lower difference = higher competitiveness)
        return Math.max(1, 10 - (goldDifferencePercentage / 5));
    }

    private generateOutlierSummary(outlierGames: OutlierGame[], totalGames: number): OutlierAnalysisResult {
        const outlierRate = outlierGames.length / totalGames;
        const averageOutlierScore = outlierGames.length > 0 
            ? outlierGames.reduce((sum, game) => sum + game.outlierScore, 0) / outlierGames.length 
            : 0;
        
        // Collect all flags and find the most common/severe ones
        const allFlags = outlierGames.flatMap(game => game.outlierFlags);
        const topOutlierFlags = this.getTopFlags(allFlags);
        
        // Calculate suspicion summary
        const mvpCount = outlierGames.filter(game => game.teamMVP).length;
        const mvpFrequency = totalGames > 0 ? mvpCount / totalGames : 0;
        
        const suspicionSummary = {
            consistentlyHighPerformance: outlierGames.length >= 5 && averageOutlierScore >= 75,
            improvesTooQuickly: this.detectRapidImprovement(outlierGames),
            expertOnNewChampions: this.detectNewChampionExpertise(outlierGames),
            mvpFrequency
        };

        return {
            totalGamesAnalyzed: totalGames,
            outlierGames,
            outlierRate,
            averageOutlierScore,
            topOutlierFlags,
            suspicionSummary
        };
    }

    private getTopFlags(flags: OutlierFlag[]): OutlierFlag[] {
        const flagCounts = new Map<string, { flag: OutlierFlag; count: number }>();
        
        flags.forEach(flag => {
            const key = `${flag.type}_${flag.severity}`;
            if (flagCounts.has(key)) {
                flagCounts.get(key)!.count++;
            } else {
                flagCounts.set(key, { flag, count: 1 });
            }
        });
        
        return Array.from(flagCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(item => item.flag);
    }

    private detectRapidImprovement(outlierGames: OutlierGame[]): boolean {
        if (outlierGames.length < 3) return false;
        
        // Sort by date
        const sortedGames = [...outlierGames].sort((a, b) => 
            new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
        );
        
        // Check if outlier scores improve over time
        const earlyScores = sortedGames.slice(0, Math.ceil(sortedGames.length / 3));
        const lateScores = sortedGames.slice(-Math.ceil(sortedGames.length / 3));
        
        const earlyAvg = earlyScores.reduce((sum, game) => sum + game.outlierScore, 0) / earlyScores.length;
        const lateAvg = lateScores.reduce((sum, game) => sum + game.outlierScore, 0) / lateScores.length;
        
        return lateAvg > earlyAvg + 15; // Significant improvement
    }

    private detectNewChampionExpertise(outlierGames: OutlierGame[]): boolean {
        // Group by champion
        const championMap = new Map<string, OutlierGame[]>();
        outlierGames.forEach(game => {
            if (!championMap.has(game.championName)) {
                championMap.set(game.championName, []);
            }
            championMap.get(game.championName)!.push(game);
        });
        
        // Check for champions with high performance in first few games
        let suspiciousChampions = 0;
        championMap.forEach((games, champion) => {
            if (games.length >= 2) {
                // Sort by date to find first games
                const sortedGames = games.sort((a, b) => 
                    new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
                );
                
                // Check if first few games have high outlier scores
                const firstGameScore = sortedGames[0].outlierScore;
                if (firstGameScore >= 70) {
                    suspiciousChampions++;
                }
            }
        });
        
        return suspiciousChampions >= 2; // Expert on multiple new champions
    }

    private extractRegionFromMatch(match: MatchHistory): string {
        // Extract region from platformId (e.g., "NA1" -> "na")
        return match.platformId.slice(0, -1).toLowerCase();
    }

    private getQueueTypeName(queueId: number): string {
        const queueTypes: { [key: number]: string } = {
            420: 'Ranked Solo',
            440: 'Ranked Flex',
            400: 'Normal Draft',
            430: 'Normal Blind',
            450: 'ARAM',
            900: 'URF',
            1020: 'One for All'
        };
        
        return queueTypes[queueId] || `Queue ${queueId}`;
    }
} 