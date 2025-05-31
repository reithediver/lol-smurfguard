export interface ChampionStats {
  championId: number;
  championName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKDA: number;
  averageCS: number;
  averageVisionScore: number;
  firstTimePerformance?: FirstTimePerformance;
  masteryLevel: number;
  masteryPoints: number;
  lastPlayed: Date;
}

export interface FirstTimePerformance {
  kda: number;
  csPerMinute: number;
  visionScore: number;
  win: boolean;
  gameId: string;
  timestamp: Date;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  summonerId: string;
} 