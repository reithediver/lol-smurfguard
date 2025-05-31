export interface Match {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  gameMode: string;
  gameType: string;
  gameVersion: string;
  mapId: number;
  participants: Participant[];
  teams: Team[];
  queueId: number;
  platformId: string;
}

export interface Participant {
  puuid: string;
  summonerName: string;
  championId: number;
  championName: string;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  stats: ParticipantStats;
  timeline: ParticipantTimeline;
}

export interface ParticipantStats {
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  goldEarned: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  win: boolean;
}

export interface ParticipantTimeline {
  lane: string;
  role: string;
  csDiffPerMinDeltas: { [key: string]: number };
  damageTakenPerMinDeltas: { [key: string]: number };
  goldPerMinDeltas: { [key: string]: number };
  xpPerMinDeltas: { [key: string]: number };
}

export interface Team {
  teamId: number;
  win: boolean;
  objectives: Objectives;
}

export interface Objectives {
  baron: Objective;
  champion: Objective;
  dragon: Objective;
  inhibitor: Objective;
  riftHerald: Objective;
  tower: Objective;
}

export interface Objective {
  first: boolean;
  kills: number;
} 