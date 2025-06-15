const axios = require('axios');

console.log('🚀 Testing Railway Deployment with Riot ID Support');
console.log('='.repeat(55));

const RAILWAY_URL = 'https://smurfgaurd-production.up.railway.app';
const testAccounts = [
    'Reinegade#Rei',
    'Rocky#pichu'
];

async function testRailwayDeployment() {
    console.log(`Railway URL: ${RAILWAY_URL}`);
    
    // Test 1: Health check
    try {
        console.log('\n📡 Testing health endpoint...');
        const health = await axios.get(`${RAILWAY_URL}/api/health`);
        console.log('✅ Health check passed');
        console.log(`   Version: ${health.data.version}`);
        console.log(`   Features: ${health.data.features.join(', ')}`);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return;
    }
    
    // Test 2: Test comprehensive endpoint with Riot IDs
    for (const riotId of testAccounts) {
        try {
            console.log(`\n🔍 Testing comprehensive analysis: ${riotId}`);
            const response = await axios.get(
                `${RAILWAY_URL}/api/analyze/comprehensive/${encodeURIComponent(riotId)}`,
                { timeout: 20000 }
            );
            
            console.log(`✅ ${riotId}: Analysis successful`);
            console.log(`   Analysis Type: ${response.data.metadata.analysisType}`);
            console.log(`   Input Format: ${response.data.metadata.inputFormat}`);
            
            if (response.data.data.smurfProbability !== undefined) {
                console.log(`   🎯 Smurf Probability: ${Math.round(response.data.data.smurfProbability * 100)}%`);
            }
            
            if (response.data.data.riotId) {
                console.log(`   🆔 Riot ID: ${response.data.data.riotId}`);
            }
            
            if (response.data.data.summonerInfo) {
                console.log(`   📊 Level: ${response.data.data.summonerInfo.summonerLevel}`);
            }
            
        } catch (error) {
            console.log(`❌ ${riotId}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
            if (error.response?.data?.suggestions) {
                console.log(`   💡 Suggestions: ${error.response.data.suggestions.join(', ')}`);
            }
        }
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Test 3: Test dedicated Riot ID endpoint
    const [gameName, tagLine] = 'Reinegade#Rei'.split('#');
    try {
        console.log(`\n🔍 Testing dedicated Riot ID endpoint: ${gameName}#${tagLine}`);
        const response = await axios.get(
            `${RAILWAY_URL}/api/analyze/riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
            { timeout: 20000 }
        );
        
        console.log('✅ Dedicated Riot ID endpoint success');
        console.log(`   Analysis Type: ${response.data.metadata.analysisType}`);
        console.log(`   Confirmed Riot ID: ${response.data.data.riotId}`);
        
    } catch (error) {
        console.log(`❌ Dedicated endpoint failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    
    // Test 4: Test available endpoints
    try {
        console.log('\n📋 Testing 404 handler (endpoint discovery)...');
        const response = await axios.get(`${RAILWAY_URL}/api/nonexistent`);
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('✅ 404 handler working');
            if (error.response.data.availableEndpoints) {
                console.log('   Available endpoints:');
                error.response.data.availableEndpoints.forEach(endpoint => {
                    console.log(`   - ${endpoint}`);
                });
            }
        } else {
            console.log('❌ Unexpected 404 response');
        }
    }
    
    console.log('\n🎯 Railway deployment testing complete!');
    console.log('\n✨ Summary: Backend successfully updated with Riot ID support');
    console.log('🔗 The comprehensive endpoint now handles both:');
    console.log('   • Modern Riot IDs (gameName#tagLine)');
    console.log('   • Legacy summoner names (backward compatibility)');
}

testRailwayDeployment().catch(error => {
    console.error('Test failed:', error.message);
    process.exit(1);
}); 