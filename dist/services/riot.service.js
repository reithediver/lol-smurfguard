"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.riotService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const loggerService_1 = require("../utils/loggerService");
// Load environment variables from .env file
dotenv_1.default.config();
const RIOT_API_BASE_URL = process.env.RIOT_API_BASE_URL || 'https://na1.api.riotgames.com';
class RiotService {
    constructor() {
        this.region = 'na1';
    }
    getHeaders() {
        const apiKey = process.env.RIOT_API_KEY;
        console.log('Using Riot API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined');
        return { 'X-Riot-Token': apiKey };
    }
    async getSummonerByName(summonerName) {
        try {
            const headers = this.getHeaders();
            const url = `${RIOT_API_BASE_URL}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
            console.log('Riot API getSummonerByName URL:', url);
            console.log('Riot API headers:', JSON.stringify(headers));
            const response = await axios_1.default.get(url, { headers });
            console.log('Riot API getSummonerByName status:', response.status);
            return response.data;
        }
        catch (error) {
            loggerService_1.logger.error(`Error fetching summoner ${summonerName}:`, error.response?.status, error.response?.data || error.message);
            throw error;
        }
    }
    async getMatchHistory(puuid, startTime, count = 20) {
        try {
            const headers = this.getHeaders();
            const params = { count };
            if (startTime)
                params.startTime = startTime;
            const url = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
            console.log('Riot API getMatchHistory URL:', url);
            console.log('Riot API headers:', JSON.stringify(headers));
            const response = await axios_1.default.get(url, {
                headers,
                params,
            });
            console.log('Riot API getMatchHistory status:', response.status);
            return response.data;
        }
        catch (error) {
            loggerService_1.logger.error(`Error fetching match history for ${puuid}:`, error.response?.status, error.response?.data || error.message);
            throw error;
        }
    }
    async getMatchDetails(matchId) {
        try {
            const headers = this.getHeaders();
            const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
            console.log('Riot API getMatchDetails URL:', url);
            console.log('Riot API headers:', JSON.stringify(headers));
            const response = await axios_1.default.get(url, { headers });
            console.log('Riot API getMatchDetails status:', response.status);
            return response.data;
        }
        catch (error) {
            loggerService_1.logger.error(`Error fetching match details for ${matchId}:`, error.response?.status, error.response?.data || error.message);
            throw error;
        }
    }
    async getChampionMastery(summonerId) {
        try {
            const headers = this.getHeaders();
            const url = `${RIOT_API_BASE_URL}/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`;
            console.log('Riot API getChampionMastery URL:', url);
            console.log('Riot API headers:', JSON.stringify(headers));
            const response = await axios_1.default.get(url, { headers });
            console.log('Riot API getChampionMastery status:', response.status);
            return response.data;
        }
        catch (error) {
            loggerService_1.logger.error(`Error fetching champion mastery for ${summonerId}:`, error.response?.status, error.response?.data || error.message);
            throw error;
        }
    }
    async getLeagueEntries(summonerId) {
        try {
            const headers = this.getHeaders();
            const url = `${RIOT_API_BASE_URL}/lol/league/v4/entries/by-summoner/${summonerId}`;
            console.log('Riot API getLeagueEntries URL:', url);
            console.log('Riot API headers:', JSON.stringify(headers));
            const response = await axios_1.default.get(url, { headers });
            console.log('Riot API getLeagueEntries status:', response.status);
            return response.data;
        }
        catch (error) {
            loggerService_1.logger.error(`Error fetching league entries for ${summonerId}:`, error.response?.status, error.response?.data || error.message);
            throw error;
        }
    }
    async getChallengersLeague() {
        try {
            const headers = this.getHeaders();
            const url = `${RIOT_API_BASE_URL}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`;
            console.log('Riot API getChallengersLeague URL:', url);
            console.log('Riot API headers:', JSON.stringify(headers));
            const response = await axios_1.default.get(url, { headers });
            console.log('Riot API getChallengersLeague status:', response.status);
            return response.data;
        }
        catch (error) {
            loggerService_1.logger.error('Error fetching challenger league:', error.response?.status, error.response?.data || error.message);
            throw error;
        }
    }
    async getChampionRotation() {
        try {
            const headers = this.getHeaders();
            const url = `${RIOT_API_BASE_URL}/lol/platform/v3/champion-rotations`;
            console.log('Riot API getChampionRotation URL:', url);
            console.log('Riot API headers:', JSON.stringify(headers));
            const response = await axios_1.default.get(url, { headers });
            console.log('Riot API getChampionRotation status:', response.status);
            return response.data;
        }
        catch (error) {
            loggerService_1.logger.error('Error fetching champion rotation:', error.response?.status, error.response?.data || error.message);
            throw error;
        }
    }
}
exports.riotService = new RiotService();
