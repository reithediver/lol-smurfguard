import { Match } from './match.model';
import { ChampionStats } from './champion.model';

export interface Player {
  summonerId: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
  smurfProbability: number;
  suspiciousPatterns: string[];
  matchHistory: Match[];
  championStats: ChampionStats[];
  leagueEntries: LeagueEntry[];
  lastUpdated: Date;
}

export interface LeagueEntry {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
} 