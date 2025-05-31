# API Documentation

## Overview
This document outlines the API requirements and structure for the League of Legends Smurf Detection project.

## Required APIs

### League of Legends API
- Riot Games API for player data
- Match history
- Champion statistics
- Summoner information
- Ranked statistics

### Data Points to Collect
1. Player Information
   - Account creation date
   - Summoner level
   - Rank information
   - Match history

2. Match Data
   - Champion played
   - KDA statistics
   - CS per minute
   - Summoner spells used
   - Game duration
   - Match date/time
   - Other players in the game

3. Champion Statistics
   - First time played
   - Win rate
   - Average KDA
   - Average CS
   - Number of games played

## API Endpoints (Planned)

### Player Analysis
```
GET /api/player/{summonerName}
```
Returns comprehensive player analysis including:
- Smurf probability score
- Detailed statistics
- Suspicious patterns detected

### Match History
```
GET /api/player/{summonerName}/matches
```
Returns detailed match history with:
- Match details
- Performance metrics
- Associated players

### Champion Statistics
```
GET /api/player/{summonerName}/champions
```
Returns champion-specific statistics:
- Performance metrics per champion
- First-time performance analysis
- Win rates and trends

## Data Models (Planned)

### Player Model
```typescript
interface Player {
  summonerName: string;
  accountId: string;
  level: number;
  rank: string;
  smurfProbability: number;
  suspiciousPatterns: string[];
  matchHistory: Match[];
  championStats: ChampionStats[];
}
```

### Match Model
```typescript
interface Match {
  matchId: string;
  timestamp: Date;
  champion: string;
  kda: {
    kills: number;
    deaths: number;
    assists: number;
  };
  csPerMinute: number;
  summonerSpells: string[];
  gameDuration: number;
  players: Player[];
}
```

### Champion Stats Model
```typescript
interface ChampionStats {
  championName: string;
  gamesPlayed: number;
  winRate: number;
  averageKDA: number;
  averageCS: number;
  firstTimePerformance: {
    kda: number;
    csPerMinute: number;
    win: boolean;
  };
}
```

## Implementation Notes
1. All API calls should be rate-limited appropriately
2. Implement caching for frequently accessed data
3. Handle API errors gracefully
4. Implement proper authentication for Riot Games API
5. Consider implementing a queue system for batch processing 