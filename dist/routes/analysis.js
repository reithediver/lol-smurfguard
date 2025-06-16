"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UnifiedAnalysisService_1 = require("../services/UnifiedAnalysisService");
const RiotApi_1 = require("../api/RiotApi");
const loggerService_1 = require("../utils/loggerService");
const router = (0, express_1.Router)();
const riotApi = new RiotApi_1.RiotApi(process.env.RIOT_API_KEY || '');
const unifiedAnalysisService = new UnifiedAnalysisService_1.UnifiedAnalysisService(riotApi);
router.get('/unified', async (req, res) => {
    try {
        const { summonerName, region } = req.query;
        loggerService_1.logger.info(`[ANALYSIS] Received request for ${summonerName} in region ${region}`);
        if (!summonerName || !region) {
            loggerService_1.logger.warn(`[ANALYSIS] Missing required parameters: summonerName=${summonerName}, region=${region}`);
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        // Parse Riot ID (GameName#Tag)
        let summoner;
        const summonerNameStr = summonerName;
        if (summonerNameStr.includes('#')) {
            loggerService_1.logger.info(`[ANALYSIS] Parsing Riot ID: ${summonerNameStr}`);
            const [gameName, tagLine] = summonerNameStr.split('#');
            loggerService_1.logger.info(`[ANALYSIS] Fetching summoner by Riot ID: ${gameName}#${tagLine}`);
            summoner = await riotApi.getSummonerByRiotId(gameName, tagLine);
        }
        else {
            // Fallback to legacy summoner name lookup
            loggerService_1.logger.info(`[ANALYSIS] Fetching summoner by legacy name: ${summonerNameStr}`);
            summoner = await riotApi.getSummonerByName(summonerNameStr);
        }
        loggerService_1.logger.info(`[ANALYSIS] Found summoner: ${JSON.stringify(summoner)}`);
        loggerService_1.logger.info(`[ANALYSIS] Getting unified analysis for ${summoner.puuid}`);
        const analysis = await unifiedAnalysisService.getUnifiedAnalysis(summoner.puuid, {
            region: region,
            riotId: summoner.gameName && summoner.tagLine ? `${summoner.gameName}#${summoner.tagLine}` : summonerNameStr
        });
        // Transform the analysis to match the frontend interface
        const transformedAnalysis = {
            ...analysis,
            outlierAnalysis: analysis.outlierAnalysis ? {
                outlierGames: analysis.outlierAnalysis.outlierGames.map((game) => ({
                    ...game,
                    gameDate: new Date(game.gameDate),
                    matchUrl: `https://www.op.gg/matches/${region.toLowerCase()}/${game.matchId}`
                }))
            } : undefined
        };
        loggerService_1.logger.info(`[ANALYSIS] Successfully analyzed player ${summonerName}`);
        res.json(transformedAnalysis);
    }
    catch (error) {
        loggerService_1.logger.error(`[ANALYSIS] Error in unified analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        loggerService_1.logger.error(`[ANALYSIS] Stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
        res.status(500).json({
            error: 'Failed to analyze player',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
