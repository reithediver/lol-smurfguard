const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('This script will help you set up your Riot API key in the .env file');
console.log('You can get a development API key from https://developer.riotgames.com/');
console.log('Note: Development keys expire in 24 hours, so you may need to run this script daily\n');

rl.question('Please paste your Riot API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.error('Error: No API key provided');
    rl.close();
    return;
  }

  // Clean up the key in case there are spaces
  const cleanKey = apiKey.trim();
  
  // Create or update the .env file with the API key
  const envContent = `# Riot Games API Key (get yours from https://developer.riotgames.com/)
RIOT_API_KEY=${cleanKey}
`;

  try {
    fs.writeFileSync('.env', envContent);
    console.log('\nSuccess! Your Riot API key has been saved to the .env file.');
    console.log('Remember that development keys expire after 24 hours.');
  } catch (err) {
    console.error('Error writing to .env file:', err.message);
  }

  rl.close();
}); 