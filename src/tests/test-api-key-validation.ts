import { ApiKeyValidator, ApiKeyValidationResult } from '../utils/api-key-validator';
import { logger } from '../utils/loggerService';

async function runApiKeyValidationTests() {
  logger.info('🧪 Starting API Key Validation Tests...');

  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    logger.error('❌ RIOT_API_KEY environment variable not set');
    return;
  }

  const validator = new ApiKeyValidator(apiKey);

  try {
    // Test 1: Quick validation
    logger.info('\n📝 Test 1: Quick Validation');
    const quickResult = await validator.quickValidation();
    logger.info(`Quick validation result: ${quickResult.isValid ? '✅ Valid' : '❌ Invalid'}`);
    logger.info(`Message: ${quickResult.message}`);

    if (!quickResult.isValid) {
      logger.error('❌ Quick validation failed - skipping full validation');
      return;
    }

    // Test 2: Full validation
    logger.info('\n📝 Test 2: Full API Key Validation');
    const fullResult = await validator.validateApiKey();
    
    // Display results
    displayValidationResults(fullResult);

    // Test 3: Performance metrics
    logger.info('\n📝 Test 3: Testing Performance Metrics');
    await testPerformanceMetrics();

    logger.info('\n✅ All API key validation tests completed successfully!');

  } catch (error) {
    logger.error('❌ API key validation tests failed:', error);
  }
}

function displayValidationResults(result: ApiKeyValidationResult) {
  logger.info('\n📊 API Key Validation Results:');
  logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  // Basic info
  logger.info(`🔑 Key Type: ${result.keyType.toUpperCase()}`);
  logger.info(`✅ Valid: ${result.isValid ? 'Yes' : 'No'}`);
  logger.info(`📅 Validated: ${result.validationTimestamp.toISOString()}`);

  // Permissions
  logger.info('\n🛡️ Permissions:');
  const permissions = result.permissions;
  Object.entries(permissions).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    logger.info(`   ${icon} ${name}`);
  });

  // Rate limits
  logger.info('\n⚡ Rate Limits:');
  logger.info(`   Personal: ${result.rateLimit.personalLimit}/second`);
  logger.info(`   Application: ${result.rateLimit.applicationLimit}/second`);

  // Regional access
  logger.info('\n🌍 Regional Access:');
  if (result.regions.length > 0) {
    result.regions.forEach(region => {
      logger.info(`   ✅ ${region.toUpperCase()}`);
    });
  } else {
    logger.info('   ❌ No regional access detected');
  }

  // Warnings
  if (result.warnings.length > 0) {
    logger.info('\n⚠️ Warnings:');
    result.warnings.forEach(warning => {
      logger.warn(`   • ${warning}`);
    });
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    logger.info('\n💡 Recommendations:');
    result.recommendations.forEach(rec => {
      logger.info(`   • ${rec}`);
    });
  }

  // Errors
  if (result.errors.length > 0) {
    logger.info('\n❌ Errors:');
    result.errors.forEach(error => {
      logger.error(`   • ${error}`);
    });
  }

  logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

async function testPerformanceMetrics() {
  try {
    // Make a few test requests to generate metrics
    const validator = new ApiKeyValidator(process.env.RIOT_API_KEY!);
    
    logger.info('Making test requests to generate performance metrics...');
    
    // Make several quick validation calls
    for (let i = 0; i < 3; i++) {
      await validator.quickValidation();
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    logger.info('✅ Performance metrics test completed');

  } catch (error) {
    logger.error('❌ Performance metrics test failed:', error);
  }
}

// Export function for use in other tests
export { runApiKeyValidationTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runApiKeyValidationTests().catch(console.error);
} 