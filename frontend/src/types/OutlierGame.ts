export interface OutlierFlag {
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    description: string;
    evidence?: string[];
}

export interface OutlierGame {
    matchId: string;
    championName: string;
    gameDate: Date;
    queueType: string;
    position: string;
    kda: number;
    kills: number;
    deaths: number;
    assists: number;
    csPerMinute: number;
    damageShare: number;
    visionScore: number;
    killParticipation: number;
    outlierScore: number;
    outlierFlags: OutlierFlag[];
    teamMVP: boolean;
    perfectGame: boolean;
    gameCarried: boolean;
    matchUrl?: string;
} 