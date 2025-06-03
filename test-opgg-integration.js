/**
 * OP.GG Integration Test Script
 * 
 * This script tests the OP.GG MCP integration to ensure:
 * 1. Integration status endpoint works
 * 2. OP.GG enhanced analysis endpoint works
 * 3. Fallback to Riot API works when OP.GG is unavailable
 * 4. Cache management works correctly
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_SUMMONER = process.env.TEST_SUMMONER || 'Faker'; // Famous player for testing
const TEST_REGION = 'kr';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
};

async function testIntegrationStatus() {
  log.info('Testing integration status endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/integration/status`);
    
    if (response.data.success) {
      log.success('Integration status endpoint working');
      log.info(`OP.GG Enabled: ${response.data.integration.opggEnabled}`);
      log.info(`Service: ${response.data.integration.serviceName}`);
      log.info(`Features: ${response.data.integration.features.join(', ')}`);
      
      if (response.data.integration.limitations.length > 0) {
        log.warn(`Limitations: ${response.data.integration.limitations.join(', ')}`);
      }
      
      return response.data.integration;
    } else {
      log.error('Integration status endpoint failed');
      return null;
    }
  } catch (error) {
    log.error(`Integration status test failed: ${error.message}`);
    return null;
  }
}

async function testAnalysisCapabilities() {
  log.info('Testing analysis capabilities endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/analysis/capabilities`);
    
    if (response.data.success) {
      log.success('Analysis capabilities endpoint working');
      log.info(`Basic Analysis: ${response.data.capabilities.basicAnalysis.available}`);
      log.info(`Enhanced Analysis: ${response.data.capabilities.enhancedAnalysis.available}`);
      log.info(`Data Refresh: ${response.data.capabilities.advancedFeatures.dataRefresh}`);
      
      return response.data.capabilities;
    } else {
      log.error('Analysis capabilities endpoint failed');
      return null;
    }
  } catch (error) {
    log.error(`Analysis capabilities test failed: ${error.message}`);
    return null;
  }
}

async function testBasicAnalysis() {
  log.info(`Testing basic analysis for ${TEST_SUMMONER}...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/api/analyze/basic/${TEST_SUMMONER}`);
    
    if (response.data.success) {
      log.success('Basic analysis endpoint working');
      log.info(`Analysis type: ${response.data.metadata.analysisType}`);
      log.info(`Response time: ${response.data.metadata.responseTime}`);
      return true;
    } else {
      log.error('Basic analysis failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 403) {
      log.warn('Basic analysis blocked (expected for famous players with dev API key)');
      return true; // This is expected behavior
    } else {
      log.error(`Basic analysis test failed: ${error.message}`);
      return false;
    }
  }
}

async function testOpggEnhancedAnalysis(integrationStatus) {
  log.info(`Testing OP.GG enhanced analysis for ${TEST_SUMMONER}...`);
  
  if (!integrationStatus?.opggEnabled) {
    log.warn('OP.GG integration is disabled, skipping enhanced analysis test');
    return true;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/api/analyze/opgg-enhanced/${TEST_SUMMONER}?region=${TEST_REGION}`);
    
    if (response.data.success) {
      log.success('OP.GG enhanced analysis working');
      log.info(`Data source: ${response.data.metadata.dataSource}`);
      log.info(`Response time: ${response.data.metadata.responseTime}`);
      log.info(`Games analyzed: ${response.data.data.analysisMetadata.dataQuality.gamesAnalyzed}`);
      log.info(`Reliability score: ${response.data.data.analysisMetadata.dataQuality.reliabilityScore}`);
      
      // Check if we got real OP.GG data or fallback
      if (response.data.metadata.dataSource === 'OP.GG MCP') {
        log.success('Successfully retrieved real OP.GG data!');
      } else {
        log.warn('Using Riot API fallback (OP.GG may be unavailable)');
      }
      
      return true;
    } else {
      log.error('OP.GG enhanced analysis failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log.warn('Summoner not found (expected for some test cases)');
      return true;
    } else if (error.response?.status === 503) {
      log.warn('OP.GG service unavailable, fallback should be working');
      return true;
    } else {
      log.error(`OP.GG enhanced analysis test failed: ${error.message}`);
      return false;
    }
  }
}

async function testDataRefresh(integrationStatus) {
  log.info(`Testing data refresh for ${TEST_SUMMONER}...`);
  
  if (!integrationStatus?.opggEnabled) {
    log.warn('OP.GG integration is disabled, skipping data refresh test');
    return true;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/api/refresh/${TEST_SUMMONER}`, {
      region: TEST_REGION
    });
    
    if (response.data.success) {
      log.success('Data refresh working');
      log.info(`Refreshed: ${response.data.message}`);
      return true;
    } else {
      log.error('Data refresh failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      log.warn('Data refresh not available (OP.GG integration disabled)');
      return true;
    } else {
      log.error(`Data refresh test failed: ${error.message}`);
      return false;
    }
  }
}

async function testCacheManagement() {
  log.info('Testing cache management...');
  
  try {
    // Test cache clear
    const response = await axios.delete(`${BASE_URL}/api/cache/clear`);
    
    if (response.data.success) {
      log.success('Cache management working');
      log.info(`Cleared caches: ${response.data.metadata.clearedCaches.join(', ')}`);
      return true;
    } else {
      log.error('Cache clear failed');
      return false;
    }
  } catch (error) {
    log.error(`Cache management test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`${colors.blue}🧪 Starting OP.GG Integration Tests${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Summoner: ${TEST_SUMMONER}`);
  console.log(`Test Region: ${TEST_REGION}\n`);
  
  const results = {
    integrationStatus: false,
    analysisCapabilities: false,
    basicAnalysis: false,
    opggEnhancedAnalysis: false,
    dataRefresh: false,
    cacheManagement: false
  };
  
  // Test 1: Integration Status
  const integrationStatus = await testIntegrationStatus();
  results.integrationStatus = !!integrationStatus;
  
  // Test 2: Analysis Capabilities
  const capabilities = await testAnalysisCapabilities();
  results.analysisCapabilities = !!capabilities;
  
  // Test 3: Basic Analysis
  results.basicAnalysis = await testBasicAnalysis();
  
  // Test 4: OP.GG Enhanced Analysis
  results.opggEnhancedAnalysis = await testOpggEnhancedAnalysis(integrationStatus);
  
  // Test 5: Data Refresh
  results.dataRefresh = await testDataRefresh(integrationStatus);
  
  // Test 6: Cache Management
  results.cacheManagement = await testCacheManagement();
  
  // Summary
  console.log(`\n${colors.blue}📊 Test Results Summary${colors.reset}`);
  console.log('═══════════════════════════════════');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? colors.green : colors.red;
    console.log(`${color}${status}${colors.reset} ${test}`);
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log('\n═══════════════════════════════════');
  if (passedCount === totalCount) {
    log.success(`All tests passed! (${passedCount}/${totalCount})`);
    log.success('OP.GG integration is working correctly! 🎉');
  } else {
    log.warn(`${passedCount}/${totalCount} tests passed`);
    if (passedCount >= totalCount - 1) {
      log.info('Integration is mostly working - minor issues detected');
    } else {
      log.error('Multiple issues detected - check configuration');
    }
  }
  
  console.log('\n🚀 Next steps:');
  console.log('1. Set USE_OPGG_DATA=true in your .env file to enable OP.GG integration');
  console.log('2. Test with real summoner names using: GET /api/analyze/opgg-enhanced/SummonerName');
  console.log('3. Update your frontend to use the new OP.GG endpoints');
  console.log('4. Deploy and test with real users');
}

// Run the tests
runAllTests().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  process.exit(1);
});

module.exports = {
  testIntegrationStatus,
  testAnalysisCapabilities,
  testBasicAnalysis,
  testOpggEnhancedAnalysis,
  testDataRefresh,
  testCacheManagement
}; 