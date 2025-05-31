require('dotenv').config();

console.log('Checking environment variables:');
console.log('RIOT_API_KEY:', process.env.RIOT_API_KEY ? `${process.env.RIOT_API_KEY.substring(0, 8)}...` : 'undefined');

if (!process.env.RIOT_API_KEY) {
  console.error('RIOT_API_KEY is missing in environment variables!');
  console.log('Current .env file content:');
  
  const fs = require('fs');
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log(envContent);
  } catch (err) {
    console.error('Error reading .env file:', err.message);
  }
} 