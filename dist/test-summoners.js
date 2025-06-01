"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const RiotApi_1 = require("./api/RiotApi");
const SmurfDetectionService_1 = require("./services/SmurfDetectionService");
const loggerService_1 = require("./utils/loggerService");
// Load environment variables
dotenv_1.default.config();
const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
    loggerService_1.logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
    process.exit(1);
}
// Get summoner names from command line arguments
const summonerNames = process.argv.slice(2);
if (summonerNames.length === 0) {
    loggerService_1.logger.info('Usage: npm run test-summoners <summoner1> <summoner2> ...');
    loggerService_1.logger.info('Example: npm run test-summoners "8lackk#NA1" "Wardomm#NA1" "Domlax#Rat"');
    process.exit(0);
}
async function analyzeSummoners() {
    try {
        const riotApi = new RiotApi_1.RiotApi(apiKey);
        const smurfDetectionService = new SmurfDetectionService_1.SmurfDetectionService(riotApi);
        loggerService_1.logger.info(`Analyzing ${summonerNames.length} summoners...`);
        for (const summonerName of summonerNames) {
            loggerService_1.logger.info(`\n========================`);
            loggerService_1.logger.info(`Analyzing summoner: ${summonerName}`);
            loggerService_1.logger.info(`========================`);
            try {
                const analysis = await smurfDetectionService.analyzePlayer(summonerName);
                // Print analysis results
                loggerService_1.logger.info(`Summoner: ${analysis.name} (Level ${analysis.level})`);
                loggerService_1.logger.info(`Smurf Probability: ${(analysis.smurfProbability * 100).toFixed(2)}%`);
                // Playtime gaps analysis
                loggerService_1.logger.info(`\nPlaytime Gaps Analysis:`);
                loggerService_1.logger.info(`- Average Gap Hours: ${analysis.analysisFactors.playtimeGaps.averageGapHours.toFixed(2)}`);
                loggerService_1.logger.info(`- Suspicious Gaps: ${analysis.analysisFactors.playtimeGaps.suspiciousGaps.length}`);
                loggerService_1.logger.info(`- Total Gap Score: ${analysis.analysisFactors.playtimeGaps.totalGapScore.toFixed(2)}`);
                // Champion performance analysis
                loggerService_1.logger.info(`\nChampion Performance Analysis:`);
                loggerService_1.logger.info(`- First-time Champions: ${analysis.analysisFactors.championPerformance.firstTimeChampions.length}`);
                analysis.analysisFactors.championPerformance.firstTimeChampions.forEach(champion => {
                    loggerService_1.logger.info(`  - Champion ${champion.championId}: KDA ${champion.kda.toFixed(2)}, CS/min ${champion.csPerMinute.toFixed(2)}, Win Rate ${(champion.winRate * 100).toFixed(0)}%`);
                });
                loggerService_1.logger.info(`- Performance Score: ${analysis.analysisFactors.championPerformance.overallPerformanceScore.toFixed(2)}`);
                // Summoner spell usage
                loggerService_1.logger.info(`\nSummoner Spell Analysis:`);
                loggerService_1.logger.info(`- Spell Changes: ${analysis.analysisFactors.summonerSpellUsage.spellPlacementChanges.length}`);
                loggerService_1.logger.info(`- Pattern Change Score: ${analysis.analysisFactors.summonerSpellUsage.patternChangeScore.toFixed(2)}`);
                // Player associations
                loggerService_1.logger.info(`\nPlayer Association Analysis:`);
                loggerService_1.logger.info(`- High Elo Associations: ${analysis.analysisFactors.playerAssociations.highEloAssociations.length}`);
                analysis.analysisFactors.playerAssociations.highEloAssociations.forEach(association => {
                    loggerService_1.logger.info(`  - ${association.playerName} (${association.elo}): ${association.gamesPlayedTogether} games together`);
                });
                loggerService_1.logger.info(`- Association Score: ${analysis.analysisFactors.playerAssociations.associationScore.toFixed(2)}`);
            }
            catch (error) {
                loggerService_1.logger.error(`Error analyzing ${summonerName}:`, error);
            }
        }
    }
    catch (error) {
        loggerService_1.logger.error('Error in analysis:', error);
    }
}
// Run the analysis
analyzeSummoners().catch(error => {
    loggerService_1.logger.error('Unhandled error:', error);
});
