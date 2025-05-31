"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerRoutes = void 0;
const express_1 = require("express");
const errorHandler_1 = require("../utils/errorHandler");
const riot_service_1 = require("../services/riot.service");
const router = (0, express_1.Router)();
// Get player analysis
router.get('/:summonerName', async (req, res) => {
    try {
        const { summonerName } = req.params;
        const summoner = await riot_service_1.riotService.getSummonerByName(summonerName);
        const leagueEntries = await riot_service_1.riotService.getLeagueEntries(summoner.id);
        const championMastery = await riot_service_1.riotService.getChampionMastery(summoner.puuid);
        const recentMatches = await riot_service_1.riotService.getMatchHistory(summoner.puuid, undefined, 10);
        // TODO: Implement smurf detection logic
        res.status(200).json({
            summoner,
            leagueEntries,
            championMastery,
            recentMatches,
            smurfProbability: 0, // Placeholder for smurf detection algorithm
        });
    }
    catch (error) {
        throw new errorHandler_1.AppError('Error analyzing player', 500);
    }
});
// Get player match history
router.get('/:summonerName/matches', async (req, res) => {
    try {
        const { summonerName } = req.params;
        const summoner = await riot_service_1.riotService.getSummonerByName(summonerName);
        const matchIds = await riot_service_1.riotService.getMatchHistory(summoner.puuid);
        const matches = await Promise.all(matchIds.map((matchId) => riot_service_1.riotService.getMatchDetails(matchId)));
        res.status(200).json({
            matches,
        });
    }
    catch (error) {
        throw new errorHandler_1.AppError('Error fetching match history', 500);
    }
});
// Get player champion statistics
router.get('/:summonerName/champions', async (req, res) => {
    try {
        const { summonerName } = req.params;
        const summoner = await riot_service_1.riotService.getSummonerByName(summonerName);
        const championMastery = await riot_service_1.riotService.getChampionMastery(summoner.puuid);
        res.status(200).json({
            championMastery,
        });
    }
    catch (error) {
        throw new errorHandler_1.AppError('Error fetching champion statistics', 500);
    }
});
exports.playerRoutes = router;
