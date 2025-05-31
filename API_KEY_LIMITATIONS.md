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
   - Limited access to endpoints
   - Rate limits of 20 requests per second
   - Expires in 24 hours
   - Intended for development and testing only

2. **Personal API Key**:
   - Similar to Development key but lasts longer
   - Still has endpoint restrictions

3. **Production API Key**:
   - Full access to all endpoints
   - Higher rate limits
   - No expiration (unless terms are violated)
   - Requires application and approval from Riot Games

## How to Fix

The application has been updated to handle this limitation by:
1. Detecting when the API key lacks necessary permissions
2. Providing alternative data that's accessible with the current key
3. Returning a clear error message with instructions

To get full access, you'll need to:
1. Visit https://developer.riotgames.com/
2. Log in with your Riot account
3. Click on "Register Product"
4. Fill out the application form
5. Wait for Riot's approval (can take several days to weeks)

## Temporary Solution

Until you get a production API key, the application will continue to return limited data. However, it will provide useful information that's accessible with your current key, such as:
- The current challenger league players
- Free champion rotation

This allows you to continue testing the application's basic functionality while waiting for full API access. 