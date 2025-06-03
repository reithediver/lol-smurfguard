import { HybridAnalysisService } from '../src/services/HybridAnalysisService';

/**
 * Example demonstrating the hybrid smurf detection system
 * 
 * This system combines:
 * 1. Quick analysis using RiotWatcher for immediate response
 * 2. Deep historical analysis using Cassiopeia for long-term patterns  
 * 3. Rank-based statistical comparisons
 * 4. Playstyle change detection over time
 */

async function demonstrateSmurfDetection() {
  // Initialize the hybrid analysis service with your Riot API key
  const apiKey = process.env.RIOT_API_KEY || 'YOUR_API_KEY_HERE';
  const hybridService = new HybridAnalysisService(apiKey);

  console.log('🔍 Starting Advanced Smurf Detection Analysis\n');

  try {
    // Example 1: Quick Analysis Only (for fast response times)
    console.log('📊 QUICK ANALYSIS EXAMPLE');
    console.log('='.repeat(50));
    
    const quickResult = await hybridService.performQuickAnalysis('Faker', 'kr');
    
    console.log(`Summoner: ${quickResult.summoner.name}`);
    console.log(`Response Time: ${quickResult.responseTime}ms`);
    console.log(`Suspicion Level: ${quickResult.suspicionLevel}`);
    console.log(`Quick Flags: ${quickResult.quickFlags.join(', ')}`);
    
    console.log('\nRank Comparisons:');
    quickResult.rankComparison.forEach(comparison => {
      console.log(`  ${comparison.metric}: ${comparison.playerValue} vs ${comparison.rankAverage} (rank avg) - ${comparison.status}`);
      if (comparison.suspiciousLevel > 0) {
        console.log(`    ⚠️ Suspicion Level: ${comparison.suspiciousLevel}/100`);
      }
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Example 2: Comprehensive Hybrid Analysis
    console.log('🔬 COMPREHENSIVE HYBRID ANALYSIS EXAMPLE');
    console.log('='.repeat(50));
    
    const hybridResult = await hybridService.performHybridAnalysis('SuspiciousPlayer', 'na1', true);
    
    // Display quick analysis results
    console.log('QUICK ANALYSIS RESULTS:');
    console.log(`  Suspicion Level: ${hybridResult.quick.suspicionLevel}`);
    console.log(`  Response Time: ${hybridResult.quick.responseTime}ms`);
    console.log(`  Flags: ${hybridResult.quick.quickFlags.join(', ')}`);

    // Display deep analysis results if available
    if (hybridResult.deep) {
      console.log('\nDEEP ANALYSIS RESULTS:');
      console.log(`  Historical Matches: ${hybridResult.deep.historicalData.totalMatches}`);
      console.log(`  Time Span: ${hybridResult.deep.historicalData.timeSpanMonths} months`);
      console.log(`  Overall Confidence: ${hybridResult.deep.confidenceScore}/100`);
      
      // Playstyle Evolution Analysis
      console.log('\n  PLAYSTYLE EVOLUTION:');
      console.log(`    Significant Shifts: ${hybridResult.deep.playstyleEvolution.shifts.length}`);
      
      hybridResult.deep.playstyleEvolution.shifts.forEach((shift, index) => {
        console.log(`    Shift ${index + 1}: ${shift.type} (${shift.confidence * 100}% confidence)`);
        console.log(`      ${shift.description}`);
        console.log(`      Suspicion Score: ${shift.suspicionScore}/100`);
      });

      // Champion Evolution Analysis
      console.log('\n  CHAMPION EVOLUTION:');
      hybridResult.deep.playstyleEvolution.championEvolution.forEach(evolution => {
        console.log(`    ${evolution.championName}:`);
        const flags = Object.entries(evolution.suspicionFlags)
          .filter(([_, value]) => value)
          .map(([key, _]) => key);
        if (flags.length > 0) {
          console.log(`      🚩 Flags: ${flags.join(', ')}`);
        }
      });

      // Smurf Indicators
      console.log('\n  SMURF INDICATORS:');
      Object.entries(hybridResult.deep.smurfIndicators).forEach(([indicator, detected]) => {
        console.log(`    ${indicator}: ${detected ? '🚨 DETECTED' : '✅ Clean'}`);
      });
    }

    // Final Recommendation
    console.log('\nFINAL RECOMMENDATION:');
    console.log(`  Action: ${hybridResult.recommendation.action.toUpperCase()}`);
    console.log(`  Confidence: ${hybridResult.recommendation.confidence}/100`);
    console.log(`  Reasoning: ${hybridResult.recommendation.reasoning.join(', ')}`);
    console.log(`  Evidence: ${hybridResult.recommendation.evidence.join(', ')}`);

    console.log('\n' + '='.repeat(50) + '\n');

    // Example 3: Batch Analysis for Multiple Players
    console.log('📈 BATCH ANALYSIS EXAMPLE');
    console.log('='.repeat(50));
    
    const suspiciousPlayers = ['Player1', 'Player2', 'Player3'];
    const batchResults: Array<{
      player: string;
      suspicion: 'low' | 'moderate' | 'high' | 'very_high';
      confidence: number;
      action: 'allow' | 'investigate' | 'flag' | 'ban_recommend';
    }> = [];

    for (const player of suspiciousPlayers) {
      try {
        const result = await hybridService.performHybridAnalysis(player, 'na1', false); // Quick analysis only
        batchResults.push({
          player,
          suspicion: result.quick.suspicionLevel,
          confidence: result.recommendation.confidence,
          action: result.recommendation.action
        });
      } catch (error) {
        console.log(`❌ Failed to analyze ${player}: ${error}`);
      }
    }

    // Sort by suspicion level
    batchResults.sort((a, b) => {
      const suspicionOrder = { very_high: 4, high: 3, moderate: 2, low: 1 };
      return (suspicionOrder[b.suspicion as keyof typeof suspicionOrder] || 0) - 
             (suspicionOrder[a.suspicion as keyof typeof suspicionOrder] || 0);
    });

    console.log('Batch Analysis Results (sorted by suspicion):');
    batchResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.player}: ${result.suspicion} (${result.confidence}% confidence) -> ${result.action}`);
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

/**
 * Example of using individual services for specific analysis
 */
async function demonstrateIndividualServices() {
  console.log('\n🧩 INDIVIDUAL SERVICES EXAMPLE');
  console.log('='.repeat(50));

  // Import individual services
  const { RankBenchmarkService } = await import('../src/services/RankBenchmarkService');
  const { PlaystyleAnalysisService } = await import('../src/services/PlaystyleAnalysisService');

  // Rank comparison example
  const rankService = new RankBenchmarkService();
  const playerMetrics = {
    csPerMin: 7.2,
    kda: 3.8,
    killParticipation: 75,
    visionScore: 28
  };

  const comparisons = rankService.comparePlayerToRank(playerMetrics, 'MIDDLE', 'GOLD');
  
  console.log('RANK COMPARISON EXAMPLE:');
  console.log(`Player performing in GOLD as MIDDLE lane:`);
  comparisons.forEach(comparison => {
    const status = comparison.status === 'exceptional' ? '🔥' : 
                   comparison.status === 'above_average' ? '⬆️' : 
                   comparison.status === 'average' ? '➡️' : '⬇️';
    console.log(`  ${status} ${comparison.metric}: ${comparison.playerValue} (${comparison.percentile}th percentile)`);
  });

  const overallSuspicion = rankService.calculateOverallSuspicion(comparisons);
  console.log(`Overall Suspicion from Rank Comparison: ${overallSuspicion}/100`);

  // Playstyle analysis example (would need real match data)
  const playstyleService = new PlaystyleAnalysisService();
  console.log('\nPLAYSTYLE ANALYSIS EXAMPLE:');
  console.log('(Requires historical match data - see service implementation)');
  
  console.log('\n' + '='.repeat(50));
}

/**
 * Configuration examples for different use cases
 */
function demonstrateConfiguration() {
  console.log('\n⚙️ CONFIGURATION EXAMPLES');
  console.log('='.repeat(50));

  console.log('1. Tournament/Competitive Environment:');
  console.log('   - Use deep analysis for all players');
  console.log('   - Lower thresholds for flagging');
  console.log('   - Extended historical analysis (12+ months)');
  console.log('   - Focus on mechanical consistency and champion mastery');

  console.log('\n2. Ranked Queue Protection:');
  console.log('   - Quick analysis for real-time decisions');
  console.log('   - Deep analysis triggered by multiple reports');
  console.log('   - Focus on rank progression anomalies');
  console.log('   - Consider account age and level');

  console.log('\n3. Educational/Coaching Tool:');
  console.log('   - Use rank comparisons to identify improvement areas');
  console.log('   - Track playstyle evolution over time');
  console.log('   - Benchmark against peers in same rank');
  console.log('   - Focus on positive development patterns');

  console.log('\n4. Anti-Cheating System:');
  console.log('   - Combine with other detection methods');
  console.log('   - High confidence thresholds for actions');
  console.log('   - Cross-reference with known smurf networks');
  console.log('   - Consider IP addresses and hardware fingerprints');
}

// Main execution
if (require.main === module) {
  (async () => {
    await demonstrateSmurfDetection();
    await demonstrateIndividualServices();
    demonstrateConfiguration();
  })();
}

export {
  demonstrateSmurfDetection,
  demonstrateIndividualServices,
  demonstrateConfiguration
}; 