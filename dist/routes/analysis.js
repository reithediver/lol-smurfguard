"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UnifiedAnalysisService_1 = require("../services/UnifiedAnalysisService");
const RiotApi_1 = require("../api/RiotApi");
const router = (0, express_1.Router)();
const riotApi = new RiotApi_1.RiotApi(process.env.RIOT_API_KEY || '');
const unifiedAnalysisService = new UnifiedAnalysisService_1.UnifiedAnalysisService(riotApi);
router.get('/unified', async (req, res) => {
    try {
        const { summonerName, region } = req.query;
        if (!summonerName || !region) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        // Get summoner info first to get PUUID
        const summoner = await riotApi.getSummonerByName(summonerName);
        const analysis = await unifiedAnalysisService.getUnifiedAnalysis(summoner.puuid, {
            region: region,
            riotId: `${summoner.gameName}#${summoner.tagLine}`
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
        res.json(transformedAnalysis);
    }
    catch (error) {
        console.error('Error in unified analysis:', error);
        res.status(500).json({
            error: 'Failed to analyze player',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
