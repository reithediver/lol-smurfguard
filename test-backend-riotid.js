const axios = require('axios');
require('dotenv').config();

console.log('🧪 Testing Updated Backend with Riot ID Support');
console.log('='.repeat(50));

const testAccounts = [
    'Reinegade#Rei',
    'Rocky#pichu', 
    'C9 Moby White#Whale',
    'Kappa Krusader#na1'
];

async function testBackend() {
    console.log('Starting local backend...');
    
    // Start backend in background
    const { spawn } = require('child_process');
    const backend = spawn('npm', ['run', 'dev'], { 
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true 
    });
    
    // Wait for backend to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📡 Testing endpoints...');
    
    // Test 1: Health check
    try {
        const health = await axios.get('http://localhost:3000/api/health');
        console.log('✅ Health check:', health.data.message);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        process.exit(1);
    }
    
    // Test 2: Test comprehensive endpoint with Riot ID
    for (const riotId of testAccounts) {
        try {
            console.log(`\n🔍 Testing comprehensive analysis: ${riotId}`);
            const response = await axios.get(
                `http://localhost:3000/api/analyze/comprehensive/${encodeURIComponent(riotId)}`,
                { timeout: 15000 }
            );
            
            console.log(`✅ ${riotId}: ${response.data.metadata.analysisType}`);
            if (response.data.data.smurfProbability !== undefined) {
                console.log(`   🎯 Smurf Probability: ${Math.round(response.data.data.smurfProbability * 100)}%`);
            }
            if (response.data.data.riotId) {
                console.log(`   🆔 Riot ID: ${response.data.data.riotId}`);
            }
        } catch (error) {
            console.log(`❌ ${riotId}: ${error.response?.status || error.message}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test 3: Test dedicated Riot ID endpoint
    const [gameName, tagLine] = 'Reinegade#Rei'.split('#');
    try {
        console.log(`\n🔍 Testing dedicated Riot ID endpoint: ${gameName}#${tagLine}`);
        const response = await axios.get(
            `http://localhost:3000/api/analyze/riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
            { timeout: 15000 }
        );
        
        console.log(`✅ Dedicated endpoint success: ${response.data.metadata.analysisType}`);
        if (response.data.data.riotId) {
            console.log(`   🆔 Confirmed Riot ID: ${response.data.data.riotId}`);
        }
    } catch (error) {
        console.log(`❌ Dedicated endpoint failed: ${error.response?.status || error.message}`);
    }
    
    console.log('\n🎯 Backend testing complete!');
    
    // Clean up
    backend.kill();
    process.exit(0);
}

testBackend().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
}); 