"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smurfDetectorService = exports.SmurfDetectorService = void 0;
const logger_1 = require("../utils/logger");
class SmurfDetectorService {
    constructor() {
        this.WIN_RATE_THRESHOLD = 0.7;
        this.KDA_THRESHOLD = 3.0;
        this.CS_PER_MIN_THRESHOLD = 8.0;
        this.SUSPICIOUS_GAP_DAYS = 30;
    }
    calculateSmurfProbability(player) {
        try {
            const factors = [
                this.analyzePlaytimeGaps(player),
                this.analyzeChampionPerformance(player),
                this.analyzeSummonerSpells(player),
                this.analyzePlayerAssociations(player),
            ];
            // Weight each factor (can be adjusted based on importance)
            const weights = [0.3, 0.3, 0.2, 0.2];
            const probability = factors.reduce((sum, factor, index) => sum + factor * weights[index], 0);
            return Math.min(Math.max(probability, 0), 1); // Ensure result is between 0 and 1
        }
        catch (error) {
            logger_1.logger.error('Error calculating smurf probability:', error);
            throw error;
        }
    }
    analyzePlaytimeGaps(player) {
        const matches = player.matchHistory.sort((a, b) => b.gameCreation - a.gameCreation);
        if (matches.length < 2)
            return 0;
        const gaps = [];
        for (let i = 0; i < matches.length - 1; i++) {
            const gap = (matches[i].gameCreation - matches[i + 1].gameCreation) / (1000 * 60 * 60 * 24); // Convert to days
            gaps.push(gap);
        }
        const suspiciousGaps = gaps.filter(gap => gap > this.SUSPICIOUS_GAP_DAYS);
        return Math.min(suspiciousGaps.length / gaps.length, 1);
    }
    analyzeChampionPerformance(player) {
        const suspiciousPerformances = player.championStats.filter(champion => {
            const isFirstTime = !champion.firstTimePerformance;
            if (!isFirstTime)
                return false;
            const performance = champion.firstTimePerformance;
            return (performance.kda >= this.KDA_THRESHOLD &&
                performance.csPerMinute >= this.CS_PER_MIN_THRESHOLD &&
                performance.win);
        });
        return Math.min(suspiciousPerformances.length / player.championStats.length, 1);
    }
    analyzeSummonerSpells(player) {
        const matches = player.matchHistory;
        if (matches.length < 3)
            return 0;
        const spellPatterns = new Map();
        let patternChanges = 0;
        for (let i = 0; i < matches.length - 1; i++) {
            const currentMatch = matches[i];
            const nextMatch = matches[i + 1];
            const playerInCurrent = this.findPlayerInMatch(currentMatch, player.puuid);
            const playerInNext = this.findPlayerInMatch(nextMatch, player.puuid);
            if (!playerInCurrent || !playerInNext)
                continue;
            const currentPattern = `${playerInCurrent.spell1Id}-${playerInCurrent.spell2Id}`;
            const nextPattern = `${playerInNext.spell1Id}-${playerInNext.spell2Id}`;
            if (currentPattern !== nextPattern) {
                patternChanges++;
                spellPatterns.set(currentPattern, (spellPatterns.get(currentPattern) || 0) + 1);
            }
        }
        // Calculate how suspicious the pattern changes are
        const uniquePatterns = spellPatterns.size;
        const totalMatches = matches.length;
        return Math.min((patternChanges / totalMatches) * (uniquePatterns / totalMatches), 1);
    }
    analyzePlayerAssociations(player) {
        const matches = player.matchHistory;
        if (matches.length === 0)
            return 0;
        let suspiciousAssociations = 0;
        const processedPlayers = new Set();
        for (const match of matches) {
            for (const participant of match.participants) {
                if (participant.puuid === player.puuid || processedPlayers.has(participant.puuid))
                    continue;
                processedPlayers.add(participant.puuid);
                const stats = participant.stats;
                const kda = (stats.kills + stats.assists) / Math.max(stats.deaths, 1);
                const csPerMin = stats.totalMinionsKilled / (match.gameDuration / 60);
                if (kda >= this.KDA_THRESHOLD && csPerMin >= this.CS_PER_MIN_THRESHOLD) {
                    suspiciousAssociations++;
                }
            }
        }
        return Math.min(suspiciousAssociations / processedPlayers.size, 1);
    }
    findPlayerInMatch(match, puuid) {
        return match.participants.find(p => p.puuid === puuid);
    }
}
exports.SmurfDetectorService = SmurfDetectorService;
exports.smurfDetectorService = new SmurfDetectorService();
