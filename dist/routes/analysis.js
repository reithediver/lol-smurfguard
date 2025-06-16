"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UnifiedAnalysisService_1 = require("../services/UnifiedAnalysisService");
const RiotApi_1 = require("../api/RiotApi");
const loggerService_1 = __importDefault(require("../utils/loggerService"));
const SmurfDetectionService_1 = require("../services/SmurfDetectionService");
const DataFetchingService_1 = require("../services/DataFetchingService");
const OutlierGameDetectionService_1 = require("../services/OutlierGameDetectionService");
const router = express_1.default.Router();
const riotApi = new RiotApi_1.RiotApi(process.env.RIOT_API_KEY || 'demo-key');
const smurfDetectionService = new SmurfDetectionService_1.SmurfDetectionService(riotApi);
const dataFetchingService = new DataFetchingService_1.DataFetchingService();
const outlierGameDetectionService = new OutlierGameDetectionService_1.OutlierGameDetectionService();
const unifiedAnalysisService = new UnifiedAnalysisService_1.UnifiedAnalysisService(riotApi, smurfDetectionService, dataFetchingService, outlierGameDetectionService);
router.get('/unified', async (req, res) => {
    try {
        const { summonerName, region } = req.query;
        loggerService_1.default.info(`[ANALYSIS] Received request for ${summonerName} in region ${region}`);
        if (!summonerName || !region) {
            loggerService_1.default.warn(`[ANALYSIS] Missing required parameters: summonerName=${summonerName}, region=${region}`);
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        // Parse Riot ID (GameName#Tag)
        let summoner;
        const summonerNameStr = summonerName;
        if (summonerNameStr.includes('#')) {
            loggerService_1.default.info(`[ANALYSIS] Parsing Riot ID: ${summonerNameStr}`);
            const [gameName, tagLine] = summonerNameStr.split('#');
            loggerService_1.default.info(`[ANALYSIS] Fetching summoner by Riot ID: ${gameName}#${tagLine}`);
            summoner = await riotApi.getSummonerByRiotId(gameName, tagLine);
        }
        else {
            // Fallback to legacy summoner name lookup
            loggerService_1.default.info(`[ANALYSIS] Fetching summoner by legacy name: ${summonerNameStr}`);
            summoner = await riotApi.getSummonerByName(summonerNameStr);
        }
        loggerService_1.default.info(`[ANALYSIS] Found summoner: ${JSON.stringify(summoner)}`);
        loggerService_1.default.info(`[ANALYSIS] Getting unified analysis for ${summoner.puuid}`);
        const analysis = await unifiedAnalysisService.getUnifiedAnalysis(summoner.puuid, {
            region: region,
            riotId: summoner.gameName && summoner.tagLine ? `${summoner.gameName}#${summoner.tagLine}` : summonerNameStr
        });
        // Transform the analysis to match the frontend interface
        const transformedAnalysis = {
            ...analysis,
            outlierAnalysis: analysis.outlierAnalysis ? {
                outlierGames: analysis.outlierAnalysis.outlierGames.map(game => ({
                    ...game,
                    gameDate: new Date(game.gameDate),
                    matchUrl: `https://www.op.gg/matches/${region.toLowerCase()}/${game.matchId}`,
                    // Ensure all required fields are present
                    queueType: game.queueType || 'Unknown',
                    position: game.position || 'Unknown',
                    kda: game.kda || 0,
                    kills: game.kills || 0,
                    deaths: game.deaths || 0,
                    assists: game.assists || 0,
                    csPerMinute: game.csPerMinute || 0,
                    damageShare: game.damageShare || 0,
                    visionScore: game.visionScore || 0,
                    killParticipation: game.killParticipation || 0,
                    outlierScore: game.outlierScore || 0,
                    outlierFlags: game.outlierFlags || [],
                    teamMVP: game.teamMVP || false,
                    perfectGame: game.perfectGame || false,
                    gameCarried: game.gameCarried || false
                }))
            } : undefined
        };
        loggerService_1.default.info(`[ANALYSIS] Successfully analyzed player ${summonerName}`);
        res.json(transformedAnalysis);
    }
    catch (error) {
        loggerService_1.default.error(`[ANALYSIS] Error in unified analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
        loggerService_1.default.error(`[ANALYSIS] Stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
        res.status(500).json({
            error: 'Failed to analyze player',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
