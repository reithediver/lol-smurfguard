const fs = require('fs');

// API key provided by the user
const apiKey = 'RGAPI-a0bd850a-1a9a-4ead-8dff-5200948e7f65';

// Create the .env file content
const envContent = `# Riot Games API Key (get yours from https://developer.riotgames.com/)
RIOT_API_KEY=${apiKey}
`;

// Write to the .env file
try {
  fs.writeFileSync('.env', envContent);
  console.log('Success! Your Riot API key has been saved to the .env file.');
} catch (err) {
  console.error('Error writing to .env file:', err.message);
} 