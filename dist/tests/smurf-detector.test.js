"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const smurf_detector_service_1 = require("../services/smurf-detector.service");
describe('SmurfDetectorService', () => {
    let service;
    let mockPlayer;
    beforeEach(() => {
        service = new smurf_detector_service_1.SmurfDetectorService();
        // Create a mock player with suspicious patterns
        mockPlayer = {
            summonerId: 'test123',
            accountId: 'acc123',
            puuid: 'puuid123',
            name: 'TestPlayer',
            profileIconId: 1,
            summonerLevel: 30,
            revisionDate: Date.now(),
            smurfProbability: 0,
            suspiciousPatterns: [],
            matchHistory: [],
            championStats: [],
            leagueEntries: [],
            lastUpdated: new Date()
        };
    });
    describe('calculateSmurfProbability', () => {
        it('should return 0 for a new player with no history', () => {
            const probability = service.calculateSmurfProbability(mockPlayer);
            expect(probability).toBe(0);
        });
        it('should detect suspicious playtime gaps', () => {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            const fortyDays = 40 * oneDay;
            mockPlayer.matchHistory = [
                {
                    matchId: '1',
                    gameCreation: now,
                    gameDuration: 1800,
                    gameMode: 'CLASSIC',
                    gameType: 'MATCHED_GAME',
                    gameVersion: '13.1',
                    mapId: 11,
                    participants: [],
                    teams: [],
                    queueId: 420,
                    platformId: 'NA1'
                },
                {
                    matchId: '2',
                    gameCreation: now - fortyDays,
                    gameDuration: 1800,
                    gameMode: 'CLASSIC',
                    gameType: 'MATCHED_GAME',
                    gameVersion: '13.1',
                    mapId: 11,
                    participants: [],
                    teams: [],
                    queueId: 420,
                    platformId: 'NA1'
                }
            ];
            const probability = service.calculateSmurfProbability(mockPlayer);
            expect(probability).toBeGreaterThan(0);
        });
        it('should detect suspicious champion performance', () => {
            mockPlayer.championStats = [
                {
                    championId: 1,
                    championName: 'Annie',
                    gamesPlayed: 1,
                    wins: 1,
                    losses: 0,
                    winRate: 1,
                    averageKDA: 4.0,
                    averageCS: 8.5,
                    averageVisionScore: 25,
                    firstTimePerformance: {
                        kda: 4.0,
                        csPerMinute: 8.5,
                        visionScore: 25,
                        win: true,
                        gameId: '1',
                        timestamp: new Date()
                    },
                    masteryLevel: 1,
                    masteryPoints: 0,
                    lastPlayed: new Date()
                }
            ];
            const probability = service.calculateSmurfProbability(mockPlayer);
            expect(probability).toBeGreaterThan(0);
        });
        it('should detect suspicious summoner spell patterns', () => {
            const now = Date.now();
            mockPlayer.matchHistory = [
                {
                    matchId: '1',
                    gameCreation: now,
                    gameDuration: 1800,
                    gameMode: 'CLASSIC',
                    gameType: 'MATCHED_GAME',
                    gameVersion: '13.1',
                    mapId: 11,
                    participants: [{
                            puuid: mockPlayer.puuid,
                            summonerName: mockPlayer.name,
                            championId: 1,
                            championName: 'Annie',
                            teamId: 100,
                            spell1Id: 4,
                            spell2Id: 6,
                            stats: {
                                kills: 10,
                                deaths: 2,
                                assists: 5,
                                totalDamageDealt: 15000,
                                totalDamageTaken: 5000,
                                goldEarned: 10000,
                                totalMinionsKilled: 150,
                                neutralMinionsKilled: 10,
                                visionScore: 25,
                                win: true
                            },
                            timeline: {
                                lane: 'MIDDLE',
                                role: 'SOLO',
                                csDiffPerMinDeltas: {},
                                damageTakenPerMinDeltas: {},
                                goldPerMinDeltas: {},
                                xpPerMinDeltas: {}
                            }
                        }],
                    teams: [],
                    queueId: 420,
                    platformId: 'NA1'
                },
                {
                    matchId: '2',
                    gameCreation: now - 3600000,
                    gameDuration: 1800,
                    gameMode: 'CLASSIC',
                    gameType: 'MATCHED_GAME',
                    gameVersion: '13.1',
                    mapId: 11,
                    participants: [{
                            puuid: mockPlayer.puuid,
                            summonerName: mockPlayer.name,
                            championId: 1,
                            championName: 'Annie',
                            teamId: 100,
                            spell1Id: 6,
                            spell2Id: 4,
                            stats: {
                                kills: 10,
                                deaths: 2,
                                assists: 5,
                                totalDamageDealt: 15000,
                                totalDamageTaken: 5000,
                                goldEarned: 10000,
                                totalMinionsKilled: 150,
                                neutralMinionsKilled: 10,
                                visionScore: 25,
                                win: true
                            },
                            timeline: {
                                lane: 'MIDDLE',
                                role: 'SOLO',
                                csDiffPerMinDeltas: {},
                                damageTakenPerMinDeltas: {},
                                goldPerMinDeltas: {},
                                xpPerMinDeltas: {}
                            }
                        }],
                    teams: [],
                    queueId: 420,
                    platformId: 'NA1'
                }
            ];
            const probability = service.calculateSmurfProbability(mockPlayer);
            expect(probability).toBeGreaterThan(0);
        });
    });
});
