import axios from 'axios';
import dotenv from 'dotenv';
import { logger } from '../utils/loggerService';

// Load environment variables from .env file
dotenv.config();

const RIOT_API_BASE_URL = process.env.RIOT_API_BASE_URL || 'https://na1.api.riotgames.com';

class RiotService {
  private readonly region = 'na1';

  getHeaders() {
    const apiKey = process.env.RIOT_API_KEY;
    logger.debug('Using Riot API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined');
    return { 'X-Riot-Token': apiKey };
  }

  async getSummonerByName(summonerName: string) {
    try {
      const headers = this.getHeaders();
      const url = `${RIOT_API_BASE_URL}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
      logger.debug('Riot API getSummonerByName URL:', url);
      logger.debug('Riot API headers:', JSON.stringify(headers));
      const response = await axios.get(url, { headers });
      logger.debug('Riot API getSummonerByName status:', response.status);
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching summoner ${summonerName}:`, error.response?.status, error.response?.data || error.message);
      throw error;
    }
  }

  async getMatchHistory(puuid: string, startTime?: number, count: number = 20) {
    try {
      const headers = this.getHeaders();
      const params: any = { count };
      if (startTime) params.startTime = startTime;
      const url = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
      logger.debug('Riot API getMatchHistory URL:', url);
      logger.debug('Riot API headers:', JSON.stringify(headers));
      const response = await axios.get(url, {
        headers,
        params,
      });
      logger.debug('Riot API getMatchHistory status:', response.status);
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching match history for ${puuid}:`, error.response?.status, error.response?.data || error.message);
      throw error;
    }
  }

  async getMatchDetails(matchId: string) {
    try {
      const headers = this.getHeaders();
      const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`;
      logger.debug('Riot API getMatchDetails URL:', url);
      logger.debug('Riot API headers:', JSON.stringify(headers));
      const response = await axios.get(url, { headers });
      logger.debug('Riot API getMatchDetails status:', response.status);
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching match details for ${matchId}:`, error.response?.status, error.response?.data || error.message);
      throw error;
    }
  }

  async getChampionMastery(summonerId: string) {
    try {
      const headers = this.getHeaders();
      const url = `${RIOT_API_BASE_URL}/lol/champion-mastery/v4/champion-masteries/by-summoner/${summonerId}`;
      logger.debug('Riot API getChampionMastery URL:', url);
      logger.debug('Riot API headers:', JSON.stringify(headers));
      const response = await axios.get(url, { headers });
      logger.debug('Riot API getChampionMastery status:', response.status);
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching champion mastery for ${summonerId}:`, error.response?.status, error.response?.data || error.message);
      throw error;
    }
  }

  async getLeagueEntries(summonerId: string) {
    try {
      const headers = this.getHeaders();
      const url = `${RIOT_API_BASE_URL}/lol/league/v4/entries/by-summoner/${summonerId}`;
      logger.debug('Riot API getLeagueEntries URL:', url);
      logger.debug('Riot API headers:', JSON.stringify(headers));
      const response = await axios.get(url, { headers });
      logger.debug('Riot API getLeagueEntries status:', response.status);
      return response.data;
    } catch (error: any) {
      logger.error(`Error fetching league entries for ${summonerId}:`, error.response?.status, error.response?.data || error.message);
      throw error;
    }
  }

  async getChallengersLeague() {
    try {
      const headers = this.getHeaders();
      const url = `${RIOT_API_BASE_URL}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`;
      logger.debug('Riot API getChallengersLeague URL:', url);
      logger.debug('Riot API headers:', JSON.stringify(headers));
      const response = await axios.get(url, { headers });
      logger.debug('Riot API getChallengersLeague status:', response.status);
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching challenger league:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  }

  async getChampionRotation() {
    try {
      const headers = this.getHeaders();
      const url = `${RIOT_API_BASE_URL}/lol/platform/v3/champion-rotations`;
      logger.debug('Riot API getChampionRotation URL:', url);
      logger.debug('Riot API headers:', JSON.stringify(headers));
      const response = await axios.get(url, { headers });
      logger.debug('Riot API getChampionRotation status:', response.status);
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching champion rotation:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  }
}

export const riotService = new RiotService(); 