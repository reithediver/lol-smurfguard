import { SmurfDetectionService } from '../services/SmurfDetectionService';
import { RiotApi } from '../api/RiotApi';
import { PlayerAnalysis } from '../models/PlayerAnalysis';
import { MatchHistory, MatchParticipant, MatchTeam } from '../models/MatchHistory';

// Mock RiotApi
jest.mock('../api/RiotApi');

// Test data
const mockSummoner = {
  id: 'summoner-id',
  accountId: 'account-id',
  puuid: 'puuid-123',
  name: 'TestPlayer',
  profileIconId: 1,
  revisionDate: Date.now(),
  summonerLevel: 30
};

const mockMatchHistory = ['match1', 'match2', 'match3', 'match4', 'match5', 'match6', 'match7', 'match8', 'match9', 'match10'];

// Helper function to create mock match data
const createMockMatch = (
  gameCreation: number,
  puuid: string,
  championId: number,
  win: boolean,
  kills: number,
  deaths: number,
  assists: number,
  cs: number,
  duration: number,
  spell1: number = 4,
  spell2: number = 7
): MatchHistory => ({
  matchId: 'match-' + gameCreation,
  gameCreation: new Date(gameCreation),
  gameDuration: duration,
  gameMode: 'CLASSIC',
  gameType: 'MATCHED_GAME',
  platformId: 'NA1',
  queueId: 420,
  seasonId: 13,
  participants: [{
    puuid,
    summonerId: 'summoner-id',
    summonerName: 'TestPlayer',
    championId,
    championName: 'TestChampion',
    teamId: 100,
    stats: {
      kills,
      deaths,
      assists,
      cs,
      csPerMinute: cs / (duration / 60),
      totalDamageDealt: 15000,
      totalDamageTaken: 12000,
      goldEarned: 12000,
      visionScore: 20,
      win
    },
    runes: [],
    items: [1001, 1002, 1003],
    summonerSpells: {
      spell1Id: spell1,
      spell2Id: spell2
    },
    position: 'MID',
    lane: 'MIDDLE'
  }],
  teams: [{
    teamId: 100,
    win: win,
    objectives: {
      baron: { first: false, kills: 0 },
      dragon: { first: false, kills: 1 },
      herald: { first: false, kills: 1 },
      tower: { first: false, kills: 3 }
    }
  }]
});

describe('SmurfDetectionService', () => {
  let service: SmurfDetectionService;
  let mockRiotApi: jest.Mocked<RiotApi>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock implementation
    mockRiotApi = {
      getSummonerByName: jest.fn(),
      getMatchHistory: jest.fn(),
      getMatchDetails: jest.fn(),
      getChampionMastery: jest.fn(),
      getLeagueEntries: jest.fn()
    } as unknown as jest.Mocked<RiotApi>;

    // Mock successful API responses
    mockRiotApi.getSummonerByName.mockImplementation(async (name: string) => ({
      id: '123',
      accountId: '456',
      puuid: '789',
      name: name,
      profileIconId: 1,
      revisionDate: new Date(),
      summonerLevel: 30
    }));

    mockRiotApi.getMatchHistory.mockImplementation(async () => [
      'match1',
      'match2',
      'match3'
    ]);

    mockRiotApi.getMatchDetails.mockImplementation(async (matchId: string): Promise<MatchHistory> => ({
      matchId,
      gameCreation: new Date(),
      gameDuration: 1800,
      gameMode: 'CLASSIC',
      gameType: 'MATCHED_GAME',
      queueId: 420,
      platformId: 'NA1',
      seasonId: 13,
      teams: [
        {
          teamId: 100,
          win: true,
          objectives: {
            baron: { first: true, kills: 1 },
            dragon: { first: true, kills: 3 },
            herald: { first: true, kills: 1 },
            tower: { first: true, kills: 8 }
          }
        }
      ],
      participants: [
        {
          puuid: '789',
          summonerId: '123',
          summonerName: 'TestPlayer',
          championId: 157,
          championName: 'Yasuo',
          teamId: 100,
          stats: {
            kills: 10,
            deaths: 2,
            assists: 8,
            totalDamageDealt: 25000,
            totalDamageTaken: 15000,
            goldEarned: 15000,
            visionScore: 25,
            cs: 200,
            csPerMinute: 6.67,
            win: true
          },
          runes: [
            { runeId: 8005, rank: 1 },
            { runeId: 8008, rank: 2 },
            { runeId: 8021, rank: 3 },
            { runeId: 8010, rank: 4 }
          ],
          items: [3074, 3071, 3031, 3036, 3006, 3026],
          summonerSpells: {
            spell1Id: 4,
            spell2Id: 14
          },
          position: 'TOP',
          lane: 'TOP'
        }
      ]
    }));

    mockRiotApi.getChampionMastery.mockImplementation(async () => [
      {
        championId: 157,
        championLevel: 7,
        championPoints: 100000,
        lastPlayTime: new Date()
      }
    ]);

    mockRiotApi.getLeagueEntries.mockImplementation(async () => [
      {
        queueType: 'RANKED_SOLO_5x5',
        tier: 'GOLD',
        rank: 'I',
        leaguePoints: 75,
        wins: 100,
        losses: 50
      }
    ]);

    service = new SmurfDetectionService(mockRiotApi);
  });

  describe('analyzePlayer', () => {
    beforeEach(() => {
      mockRiotApi.getSummonerByName.mockResolvedValue(mockSummoner);
      mockRiotApi.getMatchHistory.mockResolvedValue(mockMatchHistory);
    });

    it('should analyze a player and return smurf probability', async () => {
      const matches = [
        createMockMatch(Date.now() - 86400000, 'puuid-123', 157, true, 15, 2, 8, 180, 3600), // 1 day ago
        createMockMatch(Date.now() - 172800000, 'puuid-123', 238, true, 12, 1, 6, 200, 3400), // 2 days ago
        createMockMatch(Date.now() - 259200000, 'puuid-123', 157, true, 18, 3, 10, 175, 3200), // 3 days ago
      ];

      mockRiotApi.getMatchDetails.mockImplementation((matchId: string) => {
        const index = mockMatchHistory.indexOf(matchId);
        if (index !== -1 && matches[index]) {
          return Promise.resolve(matches[index]);
        }
        return Promise.resolve(matches[0]);
      });

      const result = await service.analyzePlayer('TestPlayer');

      expect(result).toBeDefined();
      expect(result.name).toBe('TestPlayer');
      expect(result.smurfProbability).toBeGreaterThanOrEqual(0);
      expect(result.smurfProbability).toBeLessThanOrEqual(1);
      expect(result.analysisFactors).toBeDefined();
    });

    it('should detect high win rates as suspicious', async () => {
      // Create matches with very high win rate and performance - need more than 1 game for proper analysis
      const matches = Array.from({ length: 10 }, (_, i) => 
        createMockMatch(
          Date.now() - (i * 86400000), // Daily matches
          'puuid-123',
          157 + i, // Different champions for each game to trigger first-time champion detection
          true, // All wins
          20, // High kills
          1, // Low deaths
          15, // High assists
          220, // High CS
          3600 // 1 hour games
        )
      );

      mockRiotApi.getMatchDetails.mockImplementation((matchId: string) => {
        const index = mockMatchHistory.indexOf(matchId);
        if (index !== -1 && matches[index]) {
          return Promise.resolve(matches[index]);
        }
        return Promise.resolve(matches[0]);
      });

      const result = await service.analyzePlayer('TestPlayer');

      expect(result.smurfProbability).toBeGreaterThan(0.2); // Should be suspicious, but realistic expectation
      expect(result.analysisFactors.championPerformance.overallPerformanceScore).toBeGreaterThan(0.3);
    });

    it('should detect playtime gaps as suspicious', async () => {
      const now = Date.now();
      const matches = [
        createMockMatch(now - 86400000, 'puuid-123', 157, true, 10, 5, 8, 150, 3600), // 1 day ago
        createMockMatch(now - (30 * 86400000), 'puuid-123', 238, true, 8, 3, 6, 160, 3200), // 30 days ago (big gap)
        createMockMatch(now - (31 * 86400000), 'puuid-123', 91, false, 2, 8, 4, 120, 2800), // 31 days ago
      ];

      mockRiotApi.getMatchDetails.mockImplementation((matchId: string) => {
        const index = mockMatchHistory.indexOf(matchId);
        if (index !== -1 && matches[index]) {
          return Promise.resolve(matches[index]);
        }
        return Promise.resolve(matches[0]);
      });

      const result = await service.analyzePlayer('TestPlayer');

      expect(result.analysisFactors.playtimeGaps.suspiciousGaps.length).toBeGreaterThan(0);
      expect(result.analysisFactors.playtimeGaps.totalGapScore).toBeGreaterThan(0);
    });

    it('should detect summoner spell changes as suspicious', async () => {
      const matches = [
        // Establish Flash on spell1 (D key) pattern - need at least 3 games
        createMockMatch(Date.now() - 432000000, 'puuid-123', 157, true, 10, 5, 8, 150, 3600, 4, 7), // Flash + Ignite (Flash on D)
        createMockMatch(Date.now() - 345600000, 'puuid-123', 157, true, 12, 3, 6, 160, 3200, 4, 7), // Flash + Ignite (Flash on D)
        createMockMatch(Date.now() - 259200000, 'puuid-123', 157, true, 8, 4, 10, 140, 2800, 4, 7), // Flash + Ignite (Flash on D)
        // Flash position swap - Flash moves to spell2 (F key)
        createMockMatch(Date.now() - 172800000, 'puuid-123', 157, true, 12, 3, 6, 160, 3200, 7, 4), // Ignite + Flash (Flash on F) - SWAP!
        createMockMatch(Date.now() - 86400000, 'puuid-123', 157, true, 10, 5, 8, 150, 3600, 14, 4), // Teleport + Flash (Flash on F)
      ];

      mockRiotApi.getMatchDetails.mockImplementation((matchId: string) => {
        const index = mockMatchHistory.indexOf(matchId);
        if (index !== -1 && matches[index]) {
          return Promise.resolve(matches[index]);
        }
        return Promise.resolve(matches[0]);
      });

      const result = await service.analyzePlayer('TestPlayer');

      expect(result.analysisFactors.summonerSpellUsage.patternChangeScore).toBeGreaterThan(0);
    });

    it('should handle insufficient data gracefully', async () => {
      const matches = [
        createMockMatch(Date.now() - 86400000, 'puuid-123', 157, true, 10, 5, 8, 150, 3600)
      ];

      mockRiotApi.getMatchDetails.mockImplementation((matchId: string) => {
        return Promise.resolve(matches[0]);
      });

      const result = await service.analyzePlayer('TestPlayer');

      expect(result).toBeDefined();
      expect(result.smurfProbability).toBeDefined();
      // With insufficient data, probability should be low or neutral
      expect(result.smurfProbability).toBeLessThanOrEqual(0.6);
    });

    it('should handle API errors gracefully', async () => {
      mockRiotApi.getSummonerByName.mockRejectedValue(new Error('Player not found'));

      await expect(service.analyzePlayer('NonexistentPlayer')).rejects.toThrow();
    });
  });

  describe('calculateSmurfProbability', () => {
    it('should return 0 for a new player with no history', () => {
      const mockFactors = {
        playtimeGaps: {
          averageGapHours: 0,
          suspiciousGaps: [],
          totalGapScore: 0
        },
        championPerformance: {
          firstTimeChampions: [],
          overallPerformanceScore: 0
        },
        summonerSpellUsage: {
          spellPlacementChanges: [],
          patternChangeScore: 0
        },
        playerAssociations: {
          highEloAssociations: [],
          associationScore: 0
        }
      };

      const probability = (service as any).calculateSmurfProbability(mockFactors);
      expect(probability).toBe(0);
    });

    it('should detect suspicious champion performance', () => {
      const mockFactors = {
        playtimeGaps: {
          averageGapHours: 0,
          suspiciousGaps: [],
          totalGapScore: 0
        },
        championPerformance: {
          firstTimeChampions: [
            {
              championId: 157,
              championName: 'Yasuo',
              winRate: 0.9,
              kda: 4.5,
              csPerMinute: 8.5,
              suspicionLevel: 0.9
            }
          ],
          overallPerformanceScore: 0.9
        },
        summonerSpellUsage: {
          spellPlacementChanges: [],
          patternChangeScore: 0
        },
        playerAssociations: {
          highEloAssociations: [],
          associationScore: 0
        }
      };

      const probability = (service as any).calculateSmurfProbability(mockFactors);
      expect(probability).toBeGreaterThan(0.6); // Should be high due to champion performance
    });

    it('should detect suspicious summoner spell patterns', () => {
      const mockFactors = {
        playtimeGaps: {
          averageGapHours: 0,
          suspiciousGaps: [],
          totalGapScore: 0
        },
        championPerformance: {
          firstTimeChampions: [],
          overallPerformanceScore: 0
        },
        summonerSpellUsage: {
          spellPlacementChanges: [
            {
              date: new Date(),
              oldPlacement: 'D,F',
              newPlacement: 'F,D'
            }
          ],
          patternChangeScore: 0.8
        },
        playerAssociations: {
          highEloAssociations: [],
          associationScore: 0
        }
      };

      const probability = (service as any).calculateSmurfProbability(mockFactors);
      expect(probability).toBeGreaterThan(0.04); // Updated for 5% weight (0.8 * 0.05 * 1.2 = 0.048)
    });

    it('should detect suspicious playtime gaps', () => {
      const mockFactors = {
        playtimeGaps: {
          averageGapHours: 168, // 1 week
          suspiciousGaps: [
            {
              startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              endDate: new Date(),
              durationHours: 336,
              suspicionLevel: 0.8
            }
          ],
          totalGapScore: 0.8
        },
        championPerformance: {
          firstTimeChampions: [],
          overallPerformanceScore: 0
        },
        summonerSpellUsage: {
          spellPlacementChanges: [],
          patternChangeScore: 0
        },
        playerAssociations: {
          highEloAssociations: [],
          associationScore: 0
        }
      };

      const probability = (service as any).calculateSmurfProbability(mockFactors);
      expect(probability).toBeGreaterThan(0.14); // Updated for 15% weight (0.8 * 0.15 * 1.2 = 0.144)
    });

    it('should detect high-elo associations', () => {
      const mockFactors = {
        playtimeGaps: {
          averageGapHours: 0,
          suspiciousGaps: [],
          totalGapScore: 0
        },
        championPerformance: {
          firstTimeChampions: [],
          overallPerformanceScore: 0
        },
        summonerSpellUsage: {
          spellPlacementChanges: [],
          patternChangeScore: 0
        },
        playerAssociations: {
          highEloAssociations: [
            {
              playerId: '123',
              playerName: 'HighEloPlayer',
              elo: 'CHALLENGER',
              gamesPlayedTogether: 5
            }
          ],
          associationScore: 0.8
        }
      };

      const probability = (service as any).calculateSmurfProbability(mockFactors);
      expect(probability).toBeGreaterThan(0.045); // Should contribute to probability
    });

    it('should combine multiple factors correctly', () => {
      const mockFactors = {
        playtimeGaps: {
          averageGapHours: 168,
          suspiciousGaps: [
            {
              startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              endDate: new Date(),
              durationHours: 336,
              suspicionLevel: 0.8
            }
          ],
          totalGapScore: 0.8
        },
        championPerformance: {
          firstTimeChampions: [
            {
              championId: 157,
              championName: 'Yasuo',
              winRate: 0.9,
              kda: 4.5,
              csPerMinute: 8.5,
              suspicionLevel: 0.9
            }
          ],
          overallPerformanceScore: 0.9
        },
        summonerSpellUsage: {
          spellPlacementChanges: [
            {
              date: new Date(),
              oldPlacement: 'D,F',
              newPlacement: 'F,D'
            }
          ],
          patternChangeScore: 0.8
        },
        playerAssociations: {
          highEloAssociations: [
            {
              playerId: '123',
              playerName: 'HighEloPlayer',
              elo: 'CHALLENGER',
              gamesPlayedTogether: 5
            }
          ],
          associationScore: 0.8
        }
      };

      const probability = (service as any).calculateSmurfProbability(mockFactors);
      expect(probability).toBeGreaterThan(0.7); // Should be very high with all factors
    });
  });

  describe('analyzeChampionPerformance', () => {
    it('should identify first-time champions with high performance', async () => {
      const matches = [
        createMockMatch(Date.now() - 86400000, 'puuid-123', 157, true, 20, 1, 15, 250, 3600), // Excellent Yasuo game
      ];

      const result = await (service as any).analyzeChampionPerformance(matches, 'puuid-123');

      expect(result.firstTimeChampions).toHaveLength(1);
      expect(result.firstTimeChampions[0].championId).toBe(157);
      expect(result.firstTimeChampions[0].winRate).toBe(1.0);
      expect(result.firstTimeChampions[0].suspicionLevel).toBeGreaterThan(0.5);
    });

    it('should not flag normal performance as suspicious', async () => {
      const matches = [
        createMockMatch(Date.now() - 86400000, 'puuid-123', 157, false, 5, 8, 3, 120, 3600), // Average game
      ];

      const result = await (service as any).analyzeChampionPerformance(matches, 'puuid-123');

      expect(result.firstTimeChampions[0].suspicionLevel).toBeLessThan(0.5);
    });
  });

  describe('analyzePlaytimeGaps', () => {
    it('should identify suspicious gaps in gameplay', async () => {
      const now = Date.now();
      const matches = [
        createMockMatch(now, 'puuid-123', 157, true, 10, 5, 8, 150, 3600),
        createMockMatch(now - (10 * 86400000), 'puuid-123', 238, true, 8, 3, 6, 160, 3200), // 10 day gap
        createMockMatch(now - (11 * 86400000), 'puuid-123', 91, false, 2, 8, 4, 120, 2800),
      ];

      const result = await (service as any).analyzePlaytimeGaps(matches);

      expect(result.suspiciousGaps).toHaveLength(1);
      expect(result.suspiciousGaps[0].durationHours).toBeGreaterThan(168); // More than 7 days
      expect(result.totalGapScore).toBeGreaterThan(0);
    });

    it('should not flag normal gaps as suspicious', async () => {
      const now = Date.now();
      const matches = [
        createMockMatch(now, 'puuid-123', 157, true, 10, 5, 8, 150, 3600),
        createMockMatch(now - 86400000, 'puuid-123', 238, true, 8, 3, 6, 160, 3200), // 1 day gap
        createMockMatch(now - (2 * 86400000), 'puuid-123', 91, false, 2, 8, 4, 120, 2800), // 1 day gap
      ];

      const result = await (service as any).analyzePlaytimeGaps(matches);

      expect(result.suspiciousGaps).toHaveLength(0);
      expect(result.totalGapScore).toBe(0);
    });
  });

  describe('Integration tests', () => {
    beforeEach(() => {
      mockRiotApi.getSummonerByName.mockResolvedValue(mockSummoner);
      mockRiotApi.getMatchHistory.mockResolvedValue(mockMatchHistory);
    });

    it('should correctly identify a clear smurf pattern', async () => {
      // Set up a clear smurf scenario:
      // - High performance on multiple different champions
      // - Large playtime gaps
      // - Flash position swaps (key indicator)
      const now = Date.now();
      const matches = [
        // Recent excellent games with Flash on F key (spell2)
        createMockMatch(now - 86400000, 'puuid-123', 157, true, 25, 1, 20, 280, 3600, 7, 4), // Flash on F
        createMockMatch(now - (2 * 86400000), 'puuid-123', 238, true, 20, 2, 15, 250, 3200, 14, 4), // Flash on F
        createMockMatch(now - (3 * 86400000), 'puuid-123', 91, true, 18, 1, 12, 200, 2800, 7, 4), // Flash on F
        
        // Big gap (40 days) then older games with Flash on D key (spell1) - different pattern
        createMockMatch(now - (40 * 86400000), 'puuid-123', 1, false, 2, 10, 3, 80, 2400, 4, 7), // Flash on D - PATTERN ESTABLISHED
        createMockMatch(now - (41 * 86400000), 'puuid-123', 5, false, 1, 8, 2, 60, 2200, 4, 7), // Flash on D
        createMockMatch(now - (42 * 86400000), 'puuid-123', 8, false, 3, 9, 4, 70, 2300, 4, 7), // Flash on D
        createMockMatch(now - (43 * 86400000), 'puuid-123', 11, false, 2, 7, 3, 65, 2100, 4, 7), // Flash on D
      ];

      mockRiotApi.getMatchDetails.mockImplementation((matchId: string) => {
        const index = mockMatchHistory.indexOf(matchId);
        if (index !== -1 && matches[index]) {
          return Promise.resolve(matches[index]);
        }
        return Promise.resolve(matches[0]);
      });

      const result = await service.analyzePlayer('TestPlayer');

      expect(result.smurfProbability).toBeGreaterThan(0.3); // Should be suspicious but with realistic expectations
      expect(result.analysisFactors.championPerformance.overallPerformanceScore).toBeGreaterThan(0.2);
      expect(result.analysisFactors.playtimeGaps.totalGapScore).toBeGreaterThan(0.1);
      expect(result.analysisFactors.summonerSpellUsage.patternChangeScore).toBeGreaterThan(0);
    });

    it('should correctly identify a legitimate player', async () => {
      // Set up a legitimate player scenario:
      // - Consistent but not exceptional performance
      // - Regular play patterns
      // - Consistent summoner spells
      const now = Date.now();
      const matches = Array.from({ length: 10 }, (_, i) => {
        const isWin = Math.random() > 0.45; // ~55% win rate
        const kills = Math.floor(Math.random() * 10) + 3; // 3-13 kills
        const deaths = Math.floor(Math.random() * 8) + 2; // 2-10 deaths
        const assists = Math.floor(Math.random() * 12) + 2; // 2-14 assists
        const cs = Math.floor(Math.random() * 50) + 120; // 120-170 CS
        
        return createMockMatch(
          now - (i * 86400000), // Daily games
          'puuid-123',
          157, // Same champion mostly
          isWin,
          kills,
          deaths,
          assists,
          cs,
          3600,
          4, 7 // Consistent spells
        );
      });

      mockRiotApi.getMatchDetails.mockImplementation((matchId: string) => {
        const index = mockMatchHistory.indexOf(matchId);
        if (index !== -1 && matches[index]) {
          return Promise.resolve(matches[index]);
        }
        return Promise.resolve(matches[0]);
      });

      const result = await service.analyzePlayer('TestPlayer');

      expect(result.smurfProbability).toBeLessThan(0.6); // Should not be very suspicious
    });

    it('should analyze test accounts correctly', async () => {
      const testAccounts = [
        '8lackk#NA1',
        'Wardomm#NA1',
        'Domlax#Rat',
        'Øàth#HIM',
        'El Meat#NA1'
      ];

      for (const account of testAccounts) {
        // Mock specific responses for each test account
        mockRiotApi.getMatchHistory.mockImplementationOnce(async () => [
          'match1',
          'match2',
          'match3'
        ]);

        const analysis = await service.analyzePlayer(account);
        expect(analysis).toBeDefined();
        expect(analysis.smurfProbability).toBeGreaterThanOrEqual(0);
        expect(analysis.smurfProbability).toBeLessThanOrEqual(1);
        expect(analysis.analysisFactors).toBeDefined();
        expect(analysis.lastUpdated).toBeInstanceOf(Date);
      }
    });
  });
}); 