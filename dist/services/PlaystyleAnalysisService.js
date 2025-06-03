"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaystyleAnalysisService = void 0;
class PlaystyleAnalysisService {
    constructor() { }
    /**
     * Analyzes a player's historical data for playstyle changes
     */
    async analyzePlaystyleEvolution(matches) {
        // Sort matches by date (newest first)
        const sortedMatches = matches.sort((a, b) => new Date(b.info.gameCreation).getTime() - new Date(a.info.gameCreation).getTime());
        // Create time windows
        const timeWindows = this.createTimeWindows(sortedMatches);
        // Detect playstyle shifts
        const playstyleShifts = this.detectPlaystyleShifts(timeWindows);
        // Analyze champion evolution
        const championEvolution = this.analyzeChampionEvolution(sortedMatches);
        // Calculate overall suspicion
        const overallSuspicionScore = this.calculateOverallSuspicion(playstyleShifts, championEvolution, timeWindows);
        return {
            timeWindows,
            playstyleShifts,
            championEvolution,
            overallSuspicionScore
        };
    }
    createTimeWindows(matches) {
        if (matches.length === 0)
            return [];
        const windows = [];
        const oldestMatch = new Date(matches[matches.length - 1].info.gameCreation);
        const newestMatch = new Date(matches[0].info.gameCreation);
        // Create 30-day windows from oldest to newest
        let currentStart = new Date(oldestMatch);
        while (currentStart < newestMatch) {
            const currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + PlaystyleAnalysisService.WINDOW_SIZE_DAYS);
            const windowMatches = matches.filter(match => {
                const matchDate = new Date(match.info.gameCreation);
                return matchDate >= currentStart && matchDate < currentEnd;
            });
            if (windowMatches.length >= PlaystyleAnalysisService.MIN_GAMES_PER_WINDOW) {
                windows.push({
                    start: new Date(currentStart),
                    end: new Date(currentEnd),
                    matches: windowMatches,
                    metrics: this.calculateWindowMetrics(windowMatches)
                });
            }
            currentStart.setDate(currentStart.getDate() + PlaystyleAnalysisService.WINDOW_SIZE_DAYS);
        }
        return windows;
    }
    calculateWindowMetrics(matches) {
        if (matches.length === 0) {
            return {
                csPerMin: 0,
                kda: 0,
                killParticipation: 0,
                visionScore: 0,
                averageGameLength: 0,
                mostPlayedChampions: [],
                championDiversity: 0,
                performanceConsistency: 0
            };
        }
        // Extract player data from matches (assuming we have participant data)
        const playerStats = matches.map(match => this.extractPlayerStats(match));
        // Calculate averages
        const csPerMin = playerStats.reduce((sum, stats) => sum + (stats?.csPerMin || 0), 0) / playerStats.length;
        const kda = playerStats.reduce((sum, stats) => sum + (stats?.kda || 0), 0) / playerStats.length;
        const killParticipation = playerStats.reduce((sum, stats) => sum + (stats?.killParticipation || 0), 0) / playerStats.length;
        const visionScore = playerStats.reduce((sum, stats) => sum + (stats?.visionScore || 0), 0) / playerStats.length;
        const averageGameLength = matches.reduce((sum, match) => sum + (match.info.gameDuration || 0), 0) / matches.length;
        // Champion analysis
        const championCounts = new Map();
        playerStats.forEach(stats => {
            if (stats?.championName) {
                championCounts.set(stats.championName, (championCounts.get(stats.championName) || 0) + 1);
            }
        });
        const mostPlayedChampions = Array.from(championCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([champion]) => champion);
        const championDiversity = championCounts.size;
        // Performance consistency (coefficient of variation for KDA)
        const kdaValues = playerStats.map(stats => stats?.kda || 0).filter(kda => kda > 0);
        const kdaMean = kdaValues.reduce((sum, kda) => sum + kda, 0) / kdaValues.length;
        const kdaStdDev = Math.sqrt(kdaValues.reduce((sum, kda) => sum + Math.pow(kda - kdaMean, 2), 0) / kdaValues.length);
        const performanceConsistency = kdaMean > 0 ? 1 - (kdaStdDev / kdaMean) : 0;
        return {
            csPerMin,
            kda,
            killParticipation,
            visionScore,
            averageGameLength,
            mostPlayedChampions,
            championDiversity,
            performanceConsistency
        };
    }
    extractPlayerStats(match) {
        // This would extract the specific player's stats from the match
        // For now, returning a simplified version - you'd implement based on your match data structure
        const participant = match.info?.participants?.[0]; // Assuming first participant for now
        if (!participant)
            return null;
        const gameDuration = match.info.gameDuration / 60; // Convert to minutes
        const csPerMin = gameDuration > 0 ? (participant.totalMinionsKilled + participant.neutralMinionsKilled) / gameDuration : 0;
        const kda = participant.deaths > 0 ? (participant.kills + participant.assists) / participant.deaths : participant.kills + participant.assists;
        return {
            championName: participant.championName,
            csPerMin,
            kda,
            killParticipation: participant.challenges?.killParticipation || 0,
            visionScore: participant.visionScore || 0,
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists
        };
    }
    detectPlaystyleShifts(timeWindows) {
        if (timeWindows.length < 2)
            return [];
        const shifts = [];
        for (let i = 1; i < timeWindows.length; i++) {
            const beforeWindow = timeWindows[i - 1];
            const afterWindow = timeWindows[i];
            const shift = this.analyzeWindowTransition(beforeWindow, afterWindow);
            if (shift && shift.confidence >= 0.7) { // Only report high-confidence shifts
                shifts.push(shift);
            }
        }
        return shifts;
    }
    analyzeWindowTransition(before, after) {
        const csImprovement = this.calculateImprovement(before.metrics.csPerMin, after.metrics.csPerMin);
        const kdaImprovement = this.calculateImprovement(before.metrics.kda, after.metrics.kda);
        const visionImprovement = this.calculateImprovement(before.metrics.visionScore, after.metrics.visionScore);
        // Champion pool analysis
        const beforeChampions = new Set(before.metrics.mostPlayedChampions);
        const afterChampions = new Set(after.metrics.mostPlayedChampions);
        const commonChampions = new Set([...beforeChampions].filter(x => afterChampions.has(x)));
        const championPoolChange = 1 - (commonChampions.size / Math.max(beforeChampions.size, afterChampions.size));
        // Complexity analysis (simplified - you'd implement based on champion difficulty data)
        const complexityIncrease = this.calculateComplexityChange(before.metrics.mostPlayedChampions, after.metrics.mostPlayedChampions);
        // Determine shift type and confidence
        const improvements = [csImprovement, kdaImprovement, visionImprovement];
        const significantImprovements = improvements.filter(imp => imp > PlaystyleAnalysisService.SIGNIFICANT_CHANGE_THRESHOLD);
        if (significantImprovements.length === 0)
            return null;
        const averageImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
        let shiftType;
        let confidence;
        let suspicionScore;
        if (averageImprovement > 3.0) {
            shiftType = 'dramatic';
            confidence = 0.9;
            suspicionScore = Math.min(95, averageImprovement * 15);
        }
        else if (averageImprovement > 2.0) {
            shiftType = 'sudden';
            confidence = 0.8;
            suspicionScore = Math.min(70, averageImprovement * 12);
        }
        else {
            shiftType = 'gradual';
            confidence = 0.7;
            suspicionScore = Math.min(40, averageImprovement * 8);
        }
        // Boost suspicion if champion pool changed dramatically
        if (championPoolChange > 0.7) {
            suspicionScore += 20;
        }
        const description = this.generateShiftDescription(shiftType, csImprovement, kdaImprovement, visionImprovement, championPoolChange);
        return {
            timestamp: after.start,
            type: shiftType,
            confidence,
            description,
            beforePeriod: before,
            afterPeriod: after,
            metrics: {
                csImprovement,
                kdaImprovement,
                visionImprovement,
                championPoolChange,
                complexityIncrease
            },
            suspicionScore: Math.min(100, suspicionScore)
        };
    }
    calculateImprovement(before, after) {
        if (before === 0)
            return after > 0 ? 5 : 0; // Significant if going from 0 to positive
        return (after - before) / before;
    }
    calculateComplexityChange(beforeChampions, afterChampions) {
        // Simplified complexity calculation
        // In a real implementation, you'd have a champion complexity database
        const complexityMap = {
            'Azir': 10, 'Yasuo': 9, 'Zed': 9, 'Lee Sin': 9, 'Riven': 9,
            'Garen': 2, 'Annie': 2, 'Malphite': 3, 'Ashe': 3, 'Master Yi': 3
        };
        const beforeComplexity = beforeChampions.reduce((sum, champ) => sum + (complexityMap[champ] || 5), 0) / beforeChampions.length;
        const afterComplexity = afterChampions.reduce((sum, champ) => sum + (complexityMap[champ] || 5), 0) / afterChampions.length;
        return (afterComplexity - beforeComplexity) / beforeComplexity;
    }
    generateShiftDescription(type, csImprovement, kdaImprovement, visionImprovement, championPoolChange) {
        const improvements = [];
        if (csImprovement > 0.3)
            improvements.push(`CS improved by ${(csImprovement * 100).toFixed(1)}%`);
        if (kdaImprovement > 0.3)
            improvements.push(`KDA improved by ${(kdaImprovement * 100).toFixed(1)}%`);
        if (visionImprovement > 0.3)
            improvements.push(`Vision score improved by ${(visionImprovement * 100).toFixed(1)}%`);
        if (championPoolChange > 0.5)
            improvements.push('Champion pool changed significantly');
        const intensityWord = type === 'dramatic' ? 'Dramatic' : type === 'sudden' ? 'Sudden' : 'Gradual';
        return `${intensityWord} playstyle improvement: ${improvements.join(', ')}`;
    }
    analyzeChampionEvolution(matches) {
        // Group matches by champion
        const championMatches = new Map();
        matches.forEach(match => {
            const playerStats = this.extractPlayerStats(match);
            if (playerStats?.championName) {
                if (!championMatches.has(playerStats.championName)) {
                    championMatches.set(playerStats.championName, []);
                }
                championMatches.get(playerStats.championName).push({
                    ...match,
                    playerStats
                });
            }
        });
        const evolutions = [];
        championMatches.forEach((championGames, championName) => {
            if (championGames.length < 3)
                return; // Need at least 3 games for analysis
            // Sort by date
            championGames.sort((a, b) => new Date(a.info.gameCreation).getTime() - new Date(b.info.gameCreation).getTime());
            const evolution = this.analyzeChampionProgression(championName, championGames);
            evolutions.push(evolution);
        });
        return evolutions.sort((a, b) => b.suspicionFlags.tooGoodTooFast ? 1 : -1);
    }
    analyzeChampionProgression(championName, games) {
        const timeWindows = [];
        // Analyze progression over time windows
        const firstGame = new Date(games[0].info.gameCreation);
        const lastGame = new Date(games[games.length - 1].info.gameCreation);
        // Simple progression analysis - in reality you'd want more sophisticated windowing
        const earlyGames = games.slice(0, Math.ceil(games.length / 3));
        const lateGames = games.slice(-Math.ceil(games.length / 3));
        const earlyStats = this.calculateChampionWindowStats(earlyGames);
        const lateStats = this.calculateChampionWindowStats(lateGames);
        timeWindows.push({
            period: 'early',
            games: earlyGames.length,
            winRate: earlyStats.winRate,
            averageKDA: earlyStats.averageKDA,
            averageCS: earlyStats.averageCS,
            firstTimePlayed: firstGame,
            lastTimePlayed: new Date(earlyGames[earlyGames.length - 1].info.gameCreation),
            skillProgression: 0
        });
        timeWindows.push({
            period: 'late',
            games: lateGames.length,
            winRate: lateStats.winRate,
            averageKDA: lateStats.averageKDA,
            averageCS: lateStats.averageCS,
            firstTimePlayed: new Date(lateGames[0].info.gameCreation),
            lastTimePlayed: lastGame,
            skillProgression: this.calculateSkillProgression(earlyStats, lateStats)
        });
        // Analyze suspicion flags
        const suspicionFlags = {
            tooGoodTooFast: lateStats.averageKDA > earlyStats.averageKDA * 2 && games.length < 10,
            suddenExpertise: earlyStats.averageKDA < 1.5 && lateStats.averageKDA > 3.0,
            metaShift: this.isMetaChampion(championName), // Simplified
            complexityJump: this.isComplexChampion(championName) && earlyStats.averageKDA < 2.0
        };
        return {
            championName,
            timeWindows,
            suspicionFlags
        };
    }
    calculateChampionWindowStats(games) {
        if (games.length === 0)
            return { winRate: 0, averageKDA: 0, averageCS: 0 };
        const wins = games.filter(game => game.playerStats?.win).length;
        const winRate = wins / games.length;
        const kdas = games.map(game => game.playerStats?.kda || 0);
        const averageKDA = kdas.reduce((sum, kda) => sum + kda, 0) / kdas.length;
        const csValues = games.map(game => game.playerStats?.csPerMin || 0);
        const averageCS = csValues.reduce((sum, cs) => sum + cs, 0) / csValues.length;
        return { winRate, averageKDA, averageCS };
    }
    calculateSkillProgression(early, late) {
        const kdaImprovement = late.averageKDA - early.averageKDA;
        const csImprovement = late.averageCS - early.averageCS;
        const winRateImprovement = late.winRate - early.winRate;
        return (kdaImprovement + csImprovement + winRateImprovement * 5) / 3;
    }
    isMetaChampion(championName) {
        // Simplified meta detection - you'd want to update this based on patch data
        const metaChampions = ['Graves', 'Nidalee', 'Azir', 'Lucian', 'Thresh', 'Jinx'];
        return metaChampions.includes(championName);
    }
    isComplexChampion(championName) {
        const complexChampions = ['Azir', 'Yasuo', 'Zed', 'Lee Sin', 'Riven', 'Gangplank'];
        return complexChampions.includes(championName);
    }
    calculateOverallSuspicion(shifts, evolutions, windows) {
        let suspicionScore = 0;
        // Factor in playstyle shifts
        shifts.forEach(shift => {
            suspicionScore += shift.suspicionScore * 0.4; // 40% weight
        });
        // Factor in champion evolution suspicion
        evolutions.forEach(evolution => {
            let championSuspicion = 0;
            if (evolution.suspicionFlags.tooGoodTooFast)
                championSuspicion += 30;
            if (evolution.suspicionFlags.suddenExpertise)
                championSuspicion += 25;
            if (evolution.suspicionFlags.metaShift)
                championSuspicion += 15;
            if (evolution.suspicionFlags.complexityJump)
                championSuspicion += 20;
            suspicionScore += championSuspicion * 0.3; // 30% weight
        });
        // Factor in overall progression consistency
        if (windows.length > 2) {
            const performanceProgression = windows.map(w => w.metrics.kda);
            const isMonotonicallyIncreasing = performanceProgression.every((val, i) => i === 0 || val >= performanceProgression[i - 1]);
            if (isMonotonicallyIncreasing) {
                suspicionScore += 20; // 20% weight for unnatural consistency
            }
        }
        return Math.min(100, suspicionScore);
    }
}
exports.PlaystyleAnalysisService = PlaystyleAnalysisService;
PlaystyleAnalysisService.WINDOW_SIZE_DAYS = 30; // Analyze in 30-day windows
PlaystyleAnalysisService.MIN_GAMES_PER_WINDOW = 10;
PlaystyleAnalysisService.SIGNIFICANT_CHANGE_THRESHOLD = 2.0; // Standard deviations
