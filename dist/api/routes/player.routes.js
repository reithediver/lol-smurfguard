"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SmurfDetectionService_1 = require("../../services/SmurfDetectionService");
const RiotApi_1 = require("../RiotApi");
const errorHandler_1 = require("../../utils/errorHandler");
const loggerService_1 = require("../../utils/loggerService");
const router = (0, express_1.Router)();
const riotApi = new RiotApi_1.RiotApi(process.env.RIOT_API_KEY || '');
const smurfDetectionService = new SmurfDetectionService_1.SmurfDetectionService(riotApi);
/**
 * @route GET /api/player/:summonerName
 * @desc Analyze a player for smurf detection
 * @access Public
 */
router.get('/:summonerName', async (req, res, next) => {
    try {
        const { summonerName } = req.params;
        if (!summonerName) {
            throw (0, errorHandler_1.createError)(400, 'Summoner name is required');
        }
        loggerService_1.logger.info(`Analyzing player: ${summonerName}`);
        const analysis = await smurfDetectionService.analyzePlayer(summonerName);
        res.json({
            status: 'success',
            data: analysis
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/player/:summonerName/history
 * @desc Get match history for a player
 * @access Public
 */
router.get('/:summonerName/history', async (req, res, next) => {
    try {
        const { summonerName } = req.params;
        const { startTime, endTime } = req.query;
        if (!summonerName) {
            throw (0, errorHandler_1.createError)(400, 'Summoner name is required');
        }
        const summoner = await riotApi.getSummonerByName(summonerName);
        const matchHistory = await riotApi.getMatchHistory(summoner.puuid, startTime ? Number(startTime) : undefined, endTime ? Number(endTime) : undefined);
        res.json({
            status: 'success',
            data: matchHistory
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/player/:summonerName/mastery
 * @desc Get champion mastery for a player
 * @access Public
 */
router.get('/:summonerName/mastery', async (req, res, next) => {
    try {
        const { summonerName } = req.params;
        const { championId } = req.query;
        if (!summonerName) {
            throw (0, errorHandler_1.createError)(400, 'Summoner name is required');
        }
        const summoner = await riotApi.getSummonerByName(summonerName);
        const mastery = await riotApi.getChampionMastery(summoner.puuid, championId ? Number(championId) : 0);
        res.json({
            status: 'success',
            data: mastery
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
