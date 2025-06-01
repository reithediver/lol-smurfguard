# Riot API Key Limitations

## Current Status

Your Riot API key has limited permissions. Our testing shows that the key can only access:
- Platform status data
- Champion rotation data
- Challenger league data

It **cannot** access:
- Summoner data (by name, by ID, etc.)
- Match history data
- Spectator/game data

## Why This Happens

Riot Games provides different types of API keys with varying levels of access:

1. **Development API Key**: 
   - Limited access to endpoints (cannot access summoner data)
   - Rate limits of 20 requests per second
   - Expires in 24 hours
   - Intended for development and testing only

2. **Personal API Key**:
   - Full access to all endpoints
   - Rate limits of 20 requests per second and 100 requests every 2 minutes
   - Does not expire as frequently
   - Intended for personal projects, not for public consumption
   - Requires product registration but no verification process

3. **Production API Key**:
   - Full access to all endpoints
   - Higher rate limits (500 requests per 10 seconds, 30,000 requests per 10 minutes)
   - No expiration (unless terms are violated)
   - Requires application and approval from Riot Games
   - Intended for public applications with significant traffic

## How to Fix

The application has been updated to handle this limitation by:
1. Detecting when the API key lacks necessary permissions
2. Providing alternative data that's accessible with the current key
3. Returning a clear error message with instructions

To get full access, you'll need to:
1. Visit https://developer.riotgames.com/
2. Log in with your Riot account
3. Click on "Register Product" 
4. Choose "Personal API Key" (for development) or "Production API Key" (for public applications)
5. Fill out the application form
6. Wait for approval (instant for Personal keys, can take days to weeks for Production keys)

## Temporary Solution

Until you get a Personal or Production API key, the application will continue to provide useful information that's accessible with your current key, such as:
- The current challenger league players
- Free champion rotation
- Platform status

This allows you to continue testing the application's basic functionality while waiting for full API access. 

## Next Steps

1. Apply for a Personal API Key if you're developing/testing the application
2. Apply for a Production API Key if you plan to release the application publicly
3. Make sure to update your .env file with the new API key when you receive it 