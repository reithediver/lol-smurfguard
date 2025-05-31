"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.riotService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const RIOT_API_BASE_URL = process.env.RIOT_API_BASE_URL || 'https://na1.api.riotgames.com';
const HEADERS = { 'X-Riot-Token': RIOT_API_KEY };
class RiotService {
    constructor() {
        this.region = 'na1';
    }
    async getSummonerByName(summonerName) {
        try {
            const response = await axios_1.default.get(`${RIOT_API_BASE_URL}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`, { headers: HEADERS });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching summoner ${summonerName}:`, error);
            throw error;
        }
    }
    async getMatchHistory(puuid, startTime, count = 20) {
        try {
            const params = { count };
            if (startTime)
                params.startTime = startTime;
            const response = await axios_1.default.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
                headers: HEADERS,
                params,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching match history for ${puuid}:`, error);
            throw error;
        }
    }
    async getMatchDetails(matchId) {
        try {
            const response = await axios_1.default.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`, { headers: HEADERS });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching match details for ${matchId}:`, error);
            throw error;
        }
    }
    async getChampionMastery(summonerId) {
        try {
            const response = await axios_1.default.get(`${RIOT_API_BASE_URL}/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`, { headers: HEADERS });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching champion mastery for ${summonerId}:`, error);
            throw error;
        }
    }
    async getLeagueEntries(summonerId) {
        try {
            const response = await axios_1.default.get(`${RIOT_API_BASE_URL}/lol/league/v4/entries/by-summoner/${summonerId}`, { headers: HEADERS });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching league entries for ${summonerId}:`, error);
            throw error;
        }
    }
}
exports.riotService = new RiotService();
