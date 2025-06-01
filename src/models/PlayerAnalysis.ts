export interface PlayerAnalysis {
    summonerId: string;
    accountId: string;
    puuid: string;
    name: string;
    level: number;
    smurfProbability: number;
    analysisFactors: {
        playtimeGaps: PlaytimeGapAnalysis;
        championPerformance: ChampionPerformanceAnalysis;
        summonerSpellUsage: SummonerSpellAnalysis;
        playerAssociations: PlayerAssociationAnalysis;
    };
    lastUpdated: Date;
}

export interface PlaytimeGapAnalysis {
    averageGapHours: number;
    suspiciousGaps: Array<{
        startDate: Date;
        endDate: Date;
        durationHours: number;
        suspicionLevel: number;
    }>;
    totalGapScore: number;
}

export interface ChampionPerformanceAnalysis {
    firstTimeChampions: Array<{
        championId: number;
        championName: string;
        winRate: number;
        kda: number;
        csPerMinute: number;
        suspicionLevel: number;
    }>;
    overallPerformanceScore: number;
}

export interface SummonerSpellAnalysis {
    spellPlacementChanges: Array<{
        date: Date;
        oldPlacement: string;
        newPlacement: string;
    }>;
    patternChangeScore: number;
}

export interface PlayerAssociationAnalysis {
    highEloAssociations: Array<{
        playerId: string;
        playerName: string;
        elo: string;
        gamesPlayedTogether: number;
    }>;
    associationScore: number;
} 