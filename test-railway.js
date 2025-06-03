console.log('🧪 Testing Railway Deployment Endpoints...\n');

const baseUrl = 'https://smurfgaurd-production.up.railway.app';

const endpoints = [
  '/api/health',
  '/api/integration/status',
  '/api/analyze/opgg-enhanced/testuser',
  '/api/capabilities',
  '/api/analysis/capabilities'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing: ${endpoint}`);
    const response = await fetch(`${baseUrl}${endpoint}`);
    
    if (response.ok) {
      const data = await response.text();
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      
      // Only show first 200 chars of response
      const preview = data.length > 200 ? data.substring(0, 200) + '...' : data;
      console.log(`   Response: ${preview}\n`);
    } else {
      console.log(`❌ ${endpoint} - Status: ${response.status} ${response.statusText}\n`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - Error: ${error.message}\n`);
  }
}

async function runTests() {
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('🏁 Railway endpoint testing complete!');
}

runTests(); 