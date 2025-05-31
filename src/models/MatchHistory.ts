export interface MatchHistory {
    matchId: string;
    gameCreation: Date;
    gameDuration: number;
    gameMode: string;
    gameType: string;
    participants: MatchParticipant[];
    teams: MatchTeam[];
    platformId: string;
    queueId: number;
    seasonId: number;
}

export interface MatchParticipant {
    puuid: string;
    summonerId: string;
    summonerName: string;
    championId: number;
    championName: string;
    teamId: number;
    stats: {
        kills: number;
        deaths: number;
        assists: number;
        totalDamageDealt: number;
        totalDamageTaken: number;
        goldEarned: number;
        visionScore: number;
        cs: number;
        csPerMinute: number;
        win: boolean;
    };
    runes: RuneSelection[];
    items: number[];
    summonerSpells: {
        spell1Id: number;
        spell2Id: number;
    };
    position: string;
    lane: string;
}

export interface MatchTeam {
    teamId: number;
    win: boolean;
    objectives: {
        baron: Objective;
        dragon: Objective;
        herald: Objective;
        tower: Objective;
    };
}

export interface Objective {
    first: boolean;
    kills: number;
}

export interface RuneSelection {
    runeId: number;
    rank: number;
} 