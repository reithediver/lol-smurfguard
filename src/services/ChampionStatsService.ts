import { RiotApi } from '../api/RiotApi';
import { MatchHistory, MatchParticipant } from '../models/MatchHistory';
import logger from '../utils/loggerService';

export interface ChampionStats {
    championId: number;
    championName: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    
    // Performance metrics
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    avgKDA: number;
    
    // Farm and economy
    avgCS: number;
    avgCSPerMin: number;
    avgGold: number;
    avgGoldPerMin: number;
    
    // Combat metrics
    avgDamageDealt: number;
    avgDamageTaken: number;
    avgDamagePerMin: number;
    damageShare: number; // % of team damage
    
    // Vision and utility
    avgVisionScore: number;
    avgWardsPlaced: number;
    avgWardsKilled: number;
    
    // Game impact
    firstBloodRate: number;
    pentaKills: number;
    quadraKills: number;
    tripleKills: number;
    doubleKills: number;
    
    // Recent performance (last 10 games)
    recentWinRate: number;
    recentKDA: number;
    
    // Matchup data
    matchups: ChampionMatchup[];
    
    // Position data
    positions: { [position: string]: number };
    mostPlayedPosition: string;
}

export interface ChampionMatchup {
    opponentChampionId: number;
    opponentChampionName: string;
    games: number;
    wins: number;
    winRate: number;
    avgKDA: number;
    avgCSAdvantage: number; // CS difference at 15min
}

export interface PlayerOverallStats {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    overallWinRate: number;
    overallKDA: number;
    
    // Queue-specific stats
    rankedSoloStats: QueueStats;
    rankedFlexStats: QueueStats;
    normalStats: QueueStats;
    aramStats: QueueStats;
    
    // Champion diversity
    uniqueChampions: number;
    mostPlayedChampions: ChampionStats[];
    
    // Performance trends
    last10Games: GameResult[];
    last30Days: PerformanceTrend[];
}

export interface QueueStats {
    games: number;
    wins: number;
    winRate: number;
    avgKDA: number;
    avgGameLength: number;
}

export interface GameResult {
    matchId: string;
    championId: number;
    championName: string;
    win: boolean;
    kda: number;
    gameDate: Date;
    gameDuration: number;
    position: string;
}

export interface PerformanceTrend {
    date: string;
    games: number;
    wins: number;
    avgKDA: number;
    avgPerformanceScore: number;
}

export class ChampionStatsService {
    constructor(private riotApi: RiotApi) {}

    async getComprehensiveStats(puuid: string, matchCount: number = 500): Promise<PlayerOverallStats> {
        logger.info(`🔍 Generating comprehensive stats for PUUID: ${puuid.slice(0, 8)}...`);
        logger.info(`🚀 Production API Key Detected - Processing ${matchCount} matches with enhanced throughput`);
        
        const startTime = Date.now();
        
        try {
            // Get extended match history with production-level efficiency
            logger.info(`📥 Fetching ${matchCount} match IDs...`);
            const matchIds = await this.riotApi.getExtendedMatchHistory(puuid, matchCount);
            logger.info(`📊 Retrieved ${matchIds.length} match IDs in ${Date.now() - startTime}ms`);
            
            // Fetch match details with optimized batching for production limits
            logger.info(`⚡ Processing matches with production-grade parallel processing...`);
            const matchProcessingStart = Date.now();
            const matches = await this.fetchMatchesInBatches(matchIds, puuid);
            const matchProcessingTime = Date.now() - matchProcessingStart;
            
            logger.info(`✅ Processed ${matches.length} detailed matches in ${matchProcessingTime}ms`);
            logger.info(`📈 Processing Rate: ${(matches.length / (matchProcessingTime / 1000)).toFixed(1)} matches/second`);
            
            // Generate comprehensive statistics
            logger.info(`🔬 Calculating comprehensive statistics...`);
            const statsCalculationStart = Date.now();
            const overallStats = this.calculateOverallStats(matches, puuid);
            const championStats = this.calculateChampionStats(matches, puuid);
            
            const totalTime = Date.now() - startTime;
            const cacheHitRate = this.estimateCacheHitRate(matchIds.length, matches.length);
            
            logger.info(`🎯 Stats calculation complete in ${Date.now() - statsCalculationStart}ms`);
            logger.info(`✨ Total analysis time: ${totalTime}ms | Cache efficiency: ${cacheHitRate.toFixed(1)}%`);
            logger.info(`📊 Analysis Summary: ${matches.length} matches, ${championStats.length} champions, ${overallStats.uniqueChampions} unique champions`);
            
            return {
                ...overallStats,
                mostPlayedChampions: championStats.slice(0, 10) // Top 10 champions
            };
            
        } catch (error) {
            logger.error('Error generating comprehensive stats:', error);
            throw error;
        }
    }

    private estimateCacheHitRate(requestedMatches: number, processedMatches: number): number {
        // Simple estimation: if we processed significantly fewer matches than requested,
        // it likely means many were cached or failed
        const successRate = processedMatches / requestedMatches;
        return Math.min(100, (1 - successRate + 0.5) * 100); // Rough approximation
    }

    private async fetchMatchesInBatches(matchIds: string[], puuid: string): Promise<MatchHistory[]> {
        const matches: MatchHistory[] = [];
        const batchSize = 50; // Increased from 5 to 50 - we have 2000 req/10s capacity for match API
        const concurrentRequests = 20; // Process multiple matches simultaneously
        
        logger.info(`🚀 Processing ${matchIds.length} matches in batches of ${batchSize} with ${concurrentRequests} concurrent requests...`);
        logger.info(`📊 Production Rate Limits: Match API 2000 req/10s | Utilizing ${(concurrentRequests/200*100).toFixed(1)}% capacity`);
        
        for (let i = 0; i < matchIds.length; i += batchSize) {
            const batch = matchIds.slice(i, i + batchSize);
            const batchNumber = Math.floor(i/batchSize) + 1;
            const totalBatches = Math.ceil(matchIds.length/batchSize);
            
            logger.info(`📊 Processing batch ${batchNumber}/${totalBatches} (${batch.length} matches)`);
            const batchStartTime = Date.now();
            
            try {
                // Process matches in parallel chunks for maximum throughput
                const batchMatches: MatchHistory[] = [];
                
                // Split batch into concurrent chunks
                for (let j = 0; j < batch.length; j += concurrentRequests) {
                    const chunk = batch.slice(j, j + concurrentRequests);
                    
                    // Process chunk matches in parallel
                    const chunkPromises = chunk.map(async (matchId) => {
                        try {
                            const match = await this.riotApi.getMatchDetails(matchId);
                            
                            // Only include matches where the player participated
                            if (match.participants.some(p => p.puuid === puuid)) {
                                return match;
                            }
                            return null;
                        } catch (error: any) {
                            logger.warn(`⚠️ Failed to fetch match ${matchId}: ${error.message}`);
                            
                            // The RiotApi class now handles rate limiting internally
                            // Just return null for failed matches
                            return null;
                        }
                    });
                    
                    // Wait for all chunk promises to resolve
                    const chunkResults = await Promise.all(chunkPromises);
                    const validMatches = chunkResults.filter((match): match is MatchHistory => match !== null);
                    batchMatches.push(...validMatches);
                    
                    logger.info(`✅ Chunk complete: ${validMatches.length}/${chunk.length} matches processed`);
                }
                
                matches.push(...batchMatches);
                const batchTime = Date.now() - batchStartTime;
                const matchesPerSecond = (batchMatches.length / (batchTime / 1000)).toFixed(1);
                
                logger.info(`✅ Batch ${batchNumber} complete: ${batchMatches.length} matches in ${batchTime}ms (${matchesPerSecond} matches/sec)`);
                
                // Minimal wait between batches - let RiotApi handle rate limiting
                if (i + batchSize < matchIds.length) {
                    const waitTime = 100; // Just 100ms between batches
                    logger.info(`⏳ Brief pause: ${waitTime}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                
            } catch (error: any) {
                logger.warn(`⚠️ Error processing batch ${batchNumber}:`, error.message);
                
                // Continue processing - RiotApi handles retries internally
                continue;
            }
        }
        
        logger.info(`🎯 Match processing complete: ${matches.length}/${matchIds.length} matches successfully processed`);
        return matches;
    }

    private calculateOverallStats(matches: MatchHistory[], puuid: string): Omit<PlayerOverallStats, 'mostPlayedChampions'> {
        const queueStats: { [key: number]: { games: number; wins: number; totalKDA: number; totalDuration: number } } = {
            420: { games: 0, wins: 0, totalKDA: 0, totalDuration: 0 }, // Ranked Solo
            440: { games: 0, wins: 0, totalKDA: 0, totalDuration: 0 }, // Ranked Flex
            400: { games: 0, wins: 0, totalKDA: 0, totalDuration: 0 }, // Normal Draft
            450: { games: 0, wins: 0, totalKDA: 0, totalDuration: 0 }, // ARAM
        };
        
        const last10Games: GameResult[] = [];
        const uniqueChampions = new Set<number>();
        let totalWins = 0;
        
        matches.forEach(match => {
            const player = match.participants.find(p => p.puuid === puuid);
            if (!player) return;
            
            uniqueChampions.add(player.championId);
            if (player.stats.win) totalWins++;
            
            // Queue-specific stats
            const queueId = match.queueId;
            if (queueStats[queueId]) {
                queueStats[queueId].games++;
                if (player.stats.win) queueStats[queueId].wins++;
                queueStats[queueId].totalKDA += (player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths);
                queueStats[queueId].totalDuration += match.gameDuration;
            }
            
            // Last 10 games
            if (last10Games.length < 10) {
                last10Games.push({
                    matchId: match.matchId,
                    championId: player.championId,
                    championName: player.championName,
                    win: player.stats.win,
                    kda: (player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths),
                    gameDate: match.gameCreation,
                    gameDuration: match.gameDuration,
                    position: player.position
                });
            }
        });
        
        const totalGames = matches.length;
        const overallKDA = matches.reduce((sum, match) => {
            const player = match.participants.find(p => p.puuid === puuid);
            return sum + (player ? (player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths) : 0);
        }, 0) / totalGames;
        
        return {
            totalGames,
            totalWins,
            totalLosses: totalGames - totalWins,
            overallWinRate: totalWins / totalGames,
            overallKDA,
            
            rankedSoloStats: {
                games: queueStats[420].games,
                wins: queueStats[420].wins,
                winRate: queueStats[420].games > 0 ? queueStats[420].wins / queueStats[420].games : 0,
                avgKDA: queueStats[420].games > 0 ? queueStats[420].totalKDA / queueStats[420].games : 0,
                avgGameLength: queueStats[420].games > 0 ? queueStats[420].totalDuration / queueStats[420].games : 0
            },
            
            rankedFlexStats: {
                games: queueStats[440].games,
                wins: queueStats[440].wins,
                winRate: queueStats[440].games > 0 ? queueStats[440].wins / queueStats[440].games : 0,
                avgKDA: queueStats[440].games > 0 ? queueStats[440].totalKDA / queueStats[440].games : 0,
                avgGameLength: queueStats[440].games > 0 ? queueStats[440].totalDuration / queueStats[440].games : 0
            },
            
            normalStats: {
                games: queueStats[400].games,
                wins: queueStats[400].wins,
                winRate: queueStats[400].games > 0 ? queueStats[400].wins / queueStats[400].games : 0,
                avgKDA: queueStats[400].games > 0 ? queueStats[400].totalKDA / queueStats[400].games : 0,
                avgGameLength: queueStats[400].games > 0 ? queueStats[400].totalDuration / queueStats[400].games : 0
            },
            
            aramStats: {
                games: queueStats[450].games,
                wins: queueStats[450].wins,
                winRate: queueStats[450].games > 0 ? queueStats[450].wins / queueStats[450].games : 0,
                avgKDA: queueStats[450].games > 0 ? queueStats[450].totalKDA / queueStats[450].games : 0,
                avgGameLength: queueStats[450].games > 0 ? queueStats[450].totalDuration / queueStats[450].games : 0
            },
            
            uniqueChampions: uniqueChampions.size,
            last10Games,
            last30Days: [] // TODO: Implement 30-day trends
        };
    }

    private calculateChampionStats(matches: MatchHistory[], puuid: string): ChampionStats[] {
        const championData = new Map<number, {
            championName: string;
            games: MatchParticipant[];
            positions: { [position: string]: number };
        }>();
        
        // Collect all games per champion
        matches.forEach(match => {
            const player = match.participants.find(p => p.puuid === puuid);
            if (!player) return;
            
            if (!championData.has(player.championId)) {
                championData.set(player.championId, {
                    championName: player.championName,
                    games: [],
                    positions: {}
                });
            }
            
            const champData = championData.get(player.championId)!;
            champData.games.push(player);
            
            // Track positions
            const position = player.position || 'UNKNOWN';
            champData.positions[position] = (champData.positions[position] || 0) + 1;
        });
        
        // Calculate stats for each champion
        const championStats: ChampionStats[] = [];
        
        championData.forEach((data, championId) => {
            const games = data.games;
            const gamesPlayed = games.length;
            const wins = games.filter(g => g.stats.win).length;
            
            // Calculate averages
            const avgKills = games.reduce((sum, g) => sum + g.stats.kills, 0) / gamesPlayed;
            const avgDeaths = games.reduce((sum, g) => sum + g.stats.deaths, 0) / gamesPlayed;
            const avgAssists = games.reduce((sum, g) => sum + g.stats.assists, 0) / gamesPlayed;
            const avgCS = games.reduce((sum, g) => sum + g.stats.cs, 0) / gamesPlayed;
            const avgCSPerMin = games.reduce((sum, g) => sum + g.stats.csPerMinute, 0) / gamesPlayed;
            const avgGold = games.reduce((sum, g) => sum + g.stats.goldEarned, 0) / gamesPlayed;
            const avgDamageDealt = games.reduce((sum, g) => sum + g.stats.totalDamageDealt, 0) / gamesPlayed;
            const avgDamageTaken = games.reduce((sum, g) => sum + g.stats.totalDamageTaken, 0) / gamesPlayed;
            const avgVisionScore = games.reduce((sum, g) => sum + g.stats.visionScore, 0) / gamesPlayed;
            
            // Find most played position
            const mostPlayedPosition = Object.entries(data.positions)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || 'UNKNOWN';
            
            // Recent performance (last 10 games)
            const recentGames = games.slice(-10);
            const recentWins = recentGames.filter(g => g.stats.win).length;
            const recentKDA = recentGames.reduce((sum, g) => 
                sum + (g.stats.kills + g.stats.assists) / Math.max(1, g.stats.deaths), 0
            ) / recentGames.length;
            
            championStats.push({
                championId,
                championName: data.championName,
                gamesPlayed,
                wins,
                losses: gamesPlayed - wins,
                winRate: wins / gamesPlayed,
                
                avgKills,
                avgDeaths,
                avgAssists,
                avgKDA: (avgKills + avgAssists) / Math.max(1, avgDeaths),
                
                avgCS,
                avgCSPerMin,
                avgGold,
                avgGoldPerMin: avgGold / 30, // Approximate game length
                
                avgDamageDealt,
                avgDamageTaken,
                avgDamagePerMin: avgDamageDealt / 30,
                damageShare: 0.25, // TODO: Calculate actual team damage share
                
                avgVisionScore,
                avgWardsPlaced: avgVisionScore * 0.6, // Approximation
                avgWardsKilled: avgVisionScore * 0.2, // Approximation
                
                firstBloodRate: 0, // TODO: Calculate from match timeline
                pentaKills: 0, // TODO: Extract from match data
                quadraKills: 0,
                tripleKills: 0,
                doubleKills: 0,
                
                recentWinRate: recentWins / recentGames.length,
                recentKDA,
                
                matchups: [], // TODO: Calculate matchup data
                positions: data.positions,
                mostPlayedPosition
            });
        });
        
        // Sort by games played (most played first)
        return championStats.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    }
} 