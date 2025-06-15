// Type definitions for League of Legends Smurf Detection App

export interface Player {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
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

export interface MatchData {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: ParticipantData[];
    platformId: string;
    queueId: number;
    teams: TeamData[];
    tournamentCode: string;
  };
}

export interface ParticipantData {
  assists: number;
  baronKills: number;
  bountyLevel: number;
  champExperience: number;
  champLevel: number;
  championId: number;
  championName: string;
  championTransform: number;
  consumablesPurchased: number;
  damageDealtToBuildings: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  damageSelfMitigated: number;
  deaths: number;
  detectorWardsPlaced: number;
  doubleKills: number;
  dragonKills: number;
  firstBloodAssist: boolean;
  firstBloodKill: boolean;
  firstTowerAssist: boolean;
  firstTowerKill: boolean;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  goldEarned: number;
  goldSpent: number;
  individualPosition: string;
  inhibitorKills: number;
  inhibitorTakedowns: number;
  inhibitorsLost: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  itemsPurchased: number;
  killingSprees: number;
  kills: number;
  lane: string;
  largestCriticalStrike: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  longestTimeSpentLiving: number;
  magicDamageDealt: number;
  magicDamageDealtToChampions: number;
  magicDamageTaken: number;
  neutralMinionsKilled: number;
  nexusKills: number;
  nexusLost: number;
  nexusTakedowns: number;
  objectivesStolen: number;
  objectivesStolenAssists: number;
  participantId: number;
  pentaKills: number;
  perks: PerksData;
  physicalDamageDealt: number;
  physicalDamageDealtToChampions: number;
  physicalDamageTaken: number;
  profileIcon: number;
  puuid: string;
  quadraKills: number;
  riotIdName: string;
  riotIdTagline: string;
  role: string;
  sightWardsBoughtInGame: number;
  spell1Casts: number;
  spell2Casts: number;
  spell3Casts: number;
  spell4Casts: number;
  summoner1Casts: number;
  summoner1Id: number;
  summoner2Casts: number;
  summoner2Id: number;
  summonerId: string;
  summonerLevel: number;
  summonerName: string;
  teamEarlySurrendered: boolean;
  teamId: number;
  teamPosition: string;
  timeCCingOthers: number;
  timePlayed: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageShieldedOnTeammates: number;
  totalDamageTaken: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalMinionsKilled: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  totalUnitsHealed: number;
  tripleKills: number;
  trueDamageDealt: number;
  trueDamageDealtToChampions: number;
  trueDamageTaken: number;
  turretKills: number;
  turretTakedowns: number;
  turretsLost: number;
  unrealKills: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsKilled: number;
  wardsPlaced: number;
  win: boolean;
}

export interface PerksData {
  statPerks: {
    defense: number;
    flex: number;
    offense: number;
  };
  styles: PerkStyleData[];
}

export interface PerkStyleData {
  description: string;
  selections: PerkSelectionData[];
  style: number;
}

export interface PerkSelectionData {
  perk: number;
  var1: number;
  var2: number;
  var3: number;
}

export interface TeamData {
  bans: BanData[];
  objectives: ObjectivesData;
  teamId: number;
  win: boolean;
}

export interface BanData {
  championId: number;
  pickTurn: number;
}

export interface ObjectivesData {
  baron: ObjectiveData;
  champion: ObjectiveData;
  dragon: ObjectiveData;
  inhibitor: ObjectiveData;
  riftHerald: ObjectiveData;
  tower: ObjectiveData;
}

export interface ObjectiveData {
  first: boolean;
  kills: number;
}

export interface SmurfAnalysis {
  playerName: string;
  puuid: string;
  smurfProbability: number;
  confidenceLevel: number;
  reasons: SmurfIndicator[];
  championStats: ChampionPerformance[];
  playtimeGaps: number[];
  accountAge: number;
  totalGamesAnalyzed: number;
  analysisDate: string;
  detectionCriteria: DetectionCriteria;
}

export interface SmurfIndicator {
  type: 'CHAMPION_PERFORMANCE' | 'PLAYTIME_GAP' | 'SUMMONER_SPELLS' | 'PLAYER_ASSOCIATION' | 'SKILL_PROGRESSION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  confidence: number;
  evidence: string[];
}

export interface ChampionPerformance {
  championId: number;
  championName: string;
  winRate: number;
  kda: number;
  csPerMinute: number;
  gamesPlayed: number;
  averageDamage: number;
  visionScore: number;
  firstTimeWinRate?: number;
  masteryLevel: number;
  masteryPoints: number;
  recentPerformance: GamePerformance[];
}

export interface GamePerformance {
  matchId: string;
  gameDate: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gameDuration: number;
  win: boolean;
  damage: number;
  visionScore: number;
  summoner1Id: number;
  summoner2Id: number;
}

export interface DetectionCriteria {
  championPerformanceThreshold: {
    winRateThreshold: number;
    kdaThreshold: number;
    csPerMinuteThreshold: number;
    minimumGames: number;
  };
  playtimeGapThreshold: {
    suspiciousGapDays: number;
    maximumGapCount: number;
  };
  summonerSpellAnalysis: {
    trackKeyBindings: boolean;
    patternChangeThreshold: number;
  };
  playerAssociation: {
    highEloThreshold: string;
    associationCount: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

export interface AnalysisRequest {
  playerName: string;
  region: string;
  gameCount?: number;
  includeRanked?: boolean;
  includeNormal?: boolean;
}

export interface AnalysisProgress {
  step: string;
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
}

// Riot API Rate Limiting
export interface RateLimitInfo {
  appRateLimit: {
    requests: number;
    seconds: number;
    remaining: number;
    resetTime: number;
  };
  methodRateLimit: {
    requests: number;
    seconds: number;
    remaining: number;
    resetTime: number;
  };
}

// Error Types
export interface SmurfDetectionError {
  type: 'PLAYER_NOT_FOUND' | 'RATE_LIMIT_EXCEEDED' | 'API_ERROR' | 'ANALYSIS_FAILED' | 'INVALID_REQUEST' | 'API_ACCESS_FORBIDDEN';
  message: string;
  code: number;
  retryAfter?: number;
  details?: any;
  suggestions?: string[];
}

// Regional Configuration
export type Region = 'na1' | 'euw1' | 'eun1' | 'kr' | 'br1' | 'la1' | 'la2' | 'oc1' | 'tr1' | 'ru' | 'jp1';

export interface RegionConfig {
  platform: Region;
  continent: 'americas' | 'asia' | 'europe';
  displayName: string;
}

// Champion Data
export interface Champion {
  id: number;
  name: string;
  key: string;
  title: string;
  tags: string[];
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface ChampionData {
  type: string;
  format: string;
  version: string;
  data: { [key: string]: Champion };
}

// UI State Types
export interface AppState {
  currentAnalysis: SmurfAnalysis | null;
  loading: boolean;
  error: SmurfDetectionError | null;
  progress: AnalysisProgress | null;
  rateLimitInfo: RateLimitInfo | null;
}

export interface UIConfig {
  theme: 'dark' | 'light';
  region: Region;
  autoRefresh: boolean;
  showAdvancedMetrics: boolean;
  probabilityThresholds: {
    veryLow: number;
    low: number;
    moderate: number;
    high: number;
    veryHigh: number;
  };
} 