export interface ChampionStats {
    championId: number;
    championName: string;
    totalGames: number;
    wins: number;
    losses: number;
    averageStats: {
        kda: number;
        csPerMinute: number;
        visionScore: number;
        damageDealt: number;
        damageTaken: number;
        goldEarned: number;
    };
    performanceByRole: {
        [role: string]: {
            games: number;
            winRate: number;
            averageKda: number;
            averageCsPerMinute: number;
        };
    };
    masteryLevel: number;
    masteryPoints: number;
    lastPlayed: Date;
    runePreferences: {
        [runeId: number]: {
            timesUsed: number;
            winRate: number;
        };
    };
    itemPreferences: {
        [itemId: number]: {
            timesBuilt: number;
            averageTimeToBuild: number;
            winRate: number;
        };
    };
    summonerSpellPreferences: {
        [spellId: number]: {
            timesUsed: number;
            winRate: number;
        };
    };
} 