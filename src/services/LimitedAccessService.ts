import { RiotApi } from '../api/RiotApi';
import { logger } from '../utils/loggerService';
import { createError } from '../utils/errorHandler';
import axios, { AxiosError } from 'axios';

export class LimitedAccessService {
    constructor(private apiKey: string, private region: string = 'na1') {}

    /**
     * Check what level of access the current API key has
     */
    async checkApiAccess(): Promise<{
        canAccessSummonerData: boolean;
        canAccessMatchData: boolean;
        canAccessChallengerData: boolean;
        canAccessChampionRotation: boolean;
        canAccessPlatformData: boolean;
    }> {
        const result = {
            canAccessSummonerData: false,
            canAccessMatchData: false,
            canAccessChallengerData: false,
            canAccessChampionRotation: false,
            canAccessPlatformData: false
        };

        // 1. Test platform data (should work with any key)
        try {
            await axios.get(`https://${this.region}.api.riotgames.com/lol/status/v4/platform-data`, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            result.canAccessPlatformData = true;
        } catch (error) {
            // Access denied
        }

        // 2. Test champion rotation (should work with any key)
        try {
            await axios.get(`https://${this.region}.api.riotgames.com/lol/platform/v3/champion-rotations`, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            result.canAccessChampionRotation = true;
        } catch (error) {
            // Access denied
        }

        // 3. Test challenger league (should work with any key)
        try {
            await axios.get(`https://${this.region}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            result.canAccessChallengerData = true;
        } catch (error) {
            // Access denied
        }

        // 4. Test summoner data (might not work with development key)
        try {
            await axios.get(`https://${this.region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/Doublelift`, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            result.canAccessSummonerData = true;
        } catch (error) {
            // Access denied
        }

        // 5. Test match data (might not work with development key)
        try {
            // We need a puuid to test match data, but we can't get one if summoner data is restricted
            // So we'll use a known public one for testing
            const knownPuuid = "O7JD9TRWpWwS8TYnBKNPz9sE-FE6ZTGPZXBYnNypYfGfL8c7_HNAslnYKCIW5Yf56DXmcOu_N8yw8g";
            await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${knownPuuid}/ids?start=0&count=1`, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            result.canAccessMatchData = true;
        } catch (error) {
            // Access denied
        }

        return result;
    }

    /**
     * Get challenger players as an alternative to regular player data
     */
    async getChallengerPlayers(): Promise<any[]> {
        try {
            const response = await axios.get(`https://${this.region}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            return response.data.entries;
        } catch (error) {
            const axiosError = error as AxiosError;
            logger.error('Failed to get challenger players:', axiosError.response?.status, axiosError.response?.statusText);
            throw createError(axiosError.response?.status || 500, 'Failed to get challenger players');
        }
    }

    /**
     * Get free champion rotation data
     */
    async getChampionRotation(): Promise<any> {
        try {
            const response = await axios.get(`https://${this.region}.api.riotgames.com/lol/platform/v3/champion-rotations`, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            logger.error('Failed to get champion rotation:', axiosError.response?.status, axiosError.response?.statusText);
            throw createError(axiosError.response?.status || 500, 'Failed to get champion rotation');
        }
    }

    /**
     * Get platform status
     */
    async getPlatformStatus(): Promise<any> {
        try {
            const response = await axios.get(`https://${this.region}.api.riotgames.com/lol/status/v4/platform-data`, {
                headers: { 'X-Riot-Token': this.apiKey }
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            logger.error('Failed to get platform status:', axiosError.response?.status, axiosError.response?.statusText);
            throw createError(axiosError.response?.status || 500, 'Failed to get platform status');
        }
    }
} 