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

# Riot API Integration Guide

## API Key Types and Access Levels

### 1. Development API Key
- **Current key type**
- Limited endpoint access
- Expires every 24 hours
- Rate limits: 20 requests per second
- Intended only for development and testing
- Can only access:
  - Platform status
  - Champion rotation
  - Challenger league data
- Cannot access:
  - Summoner data
  - Match history data
  - Spectator data

### 2. Personal API Key
- **Recommended for this project**
- Full access to all standard APIs (excluding Tournament API)
- Longer expiration period
- Rate limits: 
  - 20 requests/second
  - 100 requests/2 minutes
- Intended for personal projects with limited users
- No approval process required

### 3. Production API Key
- Full access to all APIs (including Tournament API)
- Highest rate limits:
  - 500 requests/10 seconds
  - 30,000 requests/10 minutes
- Intended for public applications
- Requires detailed application and approval process

## How to Get a Personal API Key

1. Visit [Riot Developer Portal](https://developer.riotgames.com/)
2. Log in with your Riot Games account
3. Click "Register Product" in the dashboard
4. Select "Personal API Key" as the product type
5. Fill out the application form with the following details:
   - **Project Name**: League of Legends Smurf Detector
   - **Project Description**: A tool to analyze League of Legends accounts and detect potential smurf accounts based on gameplay patterns and statistics. This project is for personal research and development purposes.
   - **Application Category**: Analytics Tool
   - **API Selection**: Check "Standard APIs" only
   - **Intended User Base**: Just me and maybe a few friends (less than 10 users)
   - **Production Use**: No (this is for development and personal use)

## Rate Limits by Endpoint

### Platform Data
| Method | Rate Limits |
|--------|-------------|
| GET /lol/platform/v3/champion-rotations | 30 requests/10 seconds<br>500 requests/10 minutes |
| GET /lol/status/v4/platform-data | 20000 requests/10 seconds<br>1200000 requests/10 minutes |

### Summoner Data
| Method | Rate Limits |
|--------|-------------|
| GET /lol/summoner/v4/summoners/by-account/{encryptedAccountId} | 1600 requests/1 minute |
| GET /lol/summoner/v4/summoners/{encryptedSummonerId} | 1600 requests/1 minute |
| GET /lol/summoner/v4/summoners/by-puuid/{encryptedPUUID} | 1600 requests/1 minute |

### Match Data
| Method | Rate Limits |
|--------|-------------|
| GET /lol/match/v5/matches/{matchId} | 2000 requests/10 seconds |
| GET /lol/match/v5/matches/by-puuid/{puuid}/ids | 2000 requests/10 seconds |
| GET /lol/match/v5/matches/{matchId}/timeline | 2000 requests/10 seconds |

### Champion Mastery Data
| Method | Rate Limits |
|--------|-------------|
| GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID} | 20000 requests/10 seconds<br>1200000 requests/10 minutes |
| GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}/by-champion/{championId} | 20000 requests/10 seconds<br>1200000 requests/10 minutes |
| GET /lol/champion-mastery/v4/scores/by-puuid/{encryptedPUUID} | 20000 requests/10 seconds<br>1200000 requests/10 minutes |

## Data Usage Restrictions

### 1. Match Data
- Can only store match data for 24 hours
- Must delete match data after 24 hours
- Can only store aggregate statistics long-term

### 2. Summoner Data
- Can store basic summoner information
- Must refresh data periodically
- Cannot store sensitive personal information

### 3. Caching Requirements
- Must implement caching for all API responses
- Cache duration should be reasonable (e.g., 5 minutes for summoner data)
- Must respect cache-control headers from Riot API

## Prohibited Actions

### 1. Cannot use API for:
- Automated matchmaking
- Real-time game manipulation
- Automated account creation
- Botting or automation of gameplay

### 2. Cannot store:
- Full match history indefinitely
- Personal information beyond basic summoner data
- Sensitive account information

### 3. Must not:
- Share API keys
- Use API for commercial purposes without approval
- Violate Riot's Terms of Service

## Implementation Guidelines

### Rate Limiting
- Implement proper rate limiting in the application
- Use request queuing for high-volume operations
- Monitor rate limit headers
- Implement exponential backoff for retries

### Caching
- Cache responses to minimize API calls
- Use appropriate cache durations:
  - Summoner data: 5 minutes
  - Match data: 24 hours maximum
  - Champion data: 1 hour
- Implement cache invalidation strategies

### Error Handling
- Handle 403 errors (insufficient permissions)
- Handle 429 errors (rate limit exceeded)
- Implement proper retry logic
- Provide clear error messages to users

### Best Practices
- Use HTTPS for all API calls
- Keep API keys secure
- Monitor API usage
- Implement proper logging
- Follow Riot's Terms of Service 