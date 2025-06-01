import dotenv from 'dotenv';
import { RiotApi } from './api/RiotApi';
import { SmurfDetectionService } from './services/SmurfDetectionService';
import { logger } from './utils/loggerService';

// Load environment variables
dotenv.config();

const apiKey = process.env.RIOT_API_KEY;
if (!apiKey) {
  logger.error('RIOT_API_KEY environment variable is not set. Please add it to your .env file.');
  process.exit(1);
}

// Get summoner names from command line arguments
const summonerNames = process.argv.slice(2);
if (summonerNames.length === 0) {
  logger.info('Usage: npm run test-summoners <summoner1> <summoner2> ...');
  logger.info('Example: npm run test-summoners "8lackk#NA1" "Wardomm#NA1" "Domlax#Rat"');
  process.exit(0);
}

async function analyzeSummoners() {
  try {
    const riotApi = new RiotApi(apiKey as string);
    const smurfDetectionService = new SmurfDetectionService(riotApi);

    logger.info(`Analyzing ${summonerNames.length} summoners...`);

    for (const summonerName of summonerNames) {
      logger.info(`\n========================`);
      logger.info(`Analyzing summoner: ${summonerName}`);
      logger.info(`========================`);

      try {
        const analysis = await smurfDetectionService.analyzePlayer(summonerName);
        
        // Print analysis results
        logger.info(`Summoner: ${analysis.name} (Level ${analysis.level})`);
        logger.info(`Smurf Probability: ${(analysis.smurfProbability * 100).toFixed(2)}%`);
        
        // Playtime gaps analysis
        logger.info(`\nPlaytime Gaps Analysis:`);
        logger.info(`- Average Gap Hours: ${analysis.analysisFactors.playtimeGaps.averageGapHours.toFixed(2)}`);
        logger.info(`- Suspicious Gaps: ${analysis.analysisFactors.playtimeGaps.suspiciousGaps.length}`);
        logger.info(`- Total Gap Score: ${analysis.analysisFactors.playtimeGaps.totalGapScore.toFixed(2)}`);
        
        // Champion performance analysis
        logger.info(`\nChampion Performance Analysis:`);
        logger.info(`- First-time Champions: ${analysis.analysisFactors.championPerformance.firstTimeChampions.length}`);
        analysis.analysisFactors.championPerformance.firstTimeChampions.forEach(champion => {
          logger.info(`  - Champion ${champion.championId}: KDA ${champion.kda.toFixed(2)}, CS/min ${champion.csPerMinute.toFixed(2)}, Win Rate ${(champion.winRate * 100).toFixed(0)}%`);
        });
        logger.info(`- Performance Score: ${analysis.analysisFactors.championPerformance.overallPerformanceScore.toFixed(2)}`);
        
        // Summoner spell usage
        logger.info(`\nSummoner Spell Analysis:`);
        logger.info(`- Spell Changes: ${analysis.analysisFactors.summonerSpellUsage.spellPlacementChanges.length}`);
        logger.info(`- Pattern Change Score: ${analysis.analysisFactors.summonerSpellUsage.patternChangeScore.toFixed(2)}`);
        
        // Player associations
        logger.info(`\nPlayer Association Analysis:`);
        logger.info(`- High Elo Associations: ${analysis.analysisFactors.playerAssociations.highEloAssociations.length}`);
        analysis.analysisFactors.playerAssociations.highEloAssociations.forEach(association => {
          logger.info(`  - ${association.playerName} (${association.elo}): ${association.gamesPlayedTogether} games together`);
        });
        logger.info(`- Association Score: ${analysis.analysisFactors.playerAssociations.associationScore.toFixed(2)}`);
        
      } catch (error) {
        logger.error(`Error analyzing ${summonerName}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in analysis:', error);
  }
}

// Run the analysis
analyzeSummoners().catch(error => {
  logger.error('Unhandled error:', error);
}); 