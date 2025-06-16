# AI Assistant Guide for League of Legends Smurf Detection Project

## Project Structure
- `frontend/`: React frontend (TypeScript)
- `src/`: Backend Node.js server (TypeScript)
- `dist/`: Compiled backend code
- `public/`: Static assets

## Key API Endpoints

### Backend API Routes
- `/api/analyze/unified/:riotId` - Main unified analysis endpoint
- `/api/analyze/comprehensive/:identifier` - Comprehensive analysis endpoint
- `/api/analyze/riot-id/:gameName/:tagLine` - Dedicated Riot ID endpoint
- `/api/debug/riot-id/:riotId` - Debug endpoint for testing Riot ID parsing

### Frontend API Service
- All API calls should go through `frontend/src/services/api.ts`
- The base URL is automatically determined based on environment

## Riot ID Handling

### Important: Riot ID Format
- Modern format: `GameName#TagLine` (e.g., `Reinegade#Rei`)
- Always use `RiotApi.parseRiotId()` to parse Riot IDs
- When calling Riot API:
  - Use `getSummonerByRiotId(gameName, tagLine)` for modern IDs
  - Do NOT use `getSummonerByName()` with the full Riot ID string

### Parsing Example
```typescript
const riotIdParts = RiotApi.parseRiotId(riotId);
if (riotIdParts) {
  const { gameName, tagLine } = riotIdParts;
  const summoner = await riotApi.getSummonerByRiotId(gameName, tagLine);
}
```

## Data Flow

1. User enters Riot ID in frontend
2. Frontend calls `/api/analyze/unified/:riotId` endpoint
3. Backend parses Riot ID and calls Riot API
4. Backend processes data through analysis services
5. Frontend displays results in components

## Common Patterns

### Error Handling
- Backend should return structured error objects:
  ```typescript
  {
    success: false,
    error: 'ERROR_TYPE',
    message: 'Human-readable message',
    suggestions?: string[]
  }
  ```

- Frontend should handle specific error types:
  - `PLAYER_NOT_FOUND`
  - `API_ACCESS_FORBIDDEN`
  - `ANALYSIS_FAILED`
  - `TIMEOUT_ERROR`

### Loading States
- Use the `ProgressBar` component for long operations
- Provide status updates during analysis
- Typical analysis takes 20-30 seconds

## Performance Considerations

- Backend caches API responses and analysis results
- Default analysis processes 500+ matches for comprehensive results
- API rate limits are handled automatically with retries
- Persistent storage system for optimized performance
- Progress tracking during long operations
- Comprehensive logging system for debugging

## Deployment

- Backend: Railway
- Frontend: Vercel
- Environment variables are managed in respective platforms

## Troubleshooting

### Common Issues
1. **Endpoint mismatches**: Ensure frontend API calls match backend routes exactly
2. **Riot ID parsing**: Always split GameName#TagLine correctly
3. **Timeouts**: Long-running operations should have progress indicators

### Debug Tools
- Use `/api/debug/riot-id/:riotId` endpoint to test Riot ID parsing
- Check browser console for detailed API logs
- Railway logs show backend errors

## Code Conventions

### TypeScript
- Use strong typing for all functions and variables
- Define interfaces for API responses and component props

### React Components
- Follow functional component pattern with hooks
- Use styled-components for styling

### API Services
- Centralize API calls in service classes
- Include proper error handling and logging

## Recent Changes

- Added progress bar for better UX during analysis
- Fixed API endpoint URL structure
- Enhanced timeout handling and added retry mechanisms
- Added debug endpoints for troubleshooting
- Implemented persistent storage system
- Added comprehensive logging system
- Optimized Git workflow with proper .gitignore
- Enhanced error handling and user feedback

## Known Issues

### Current Deployment Issues (2024-03-16)
- **499 Error**: The application is currently experiencing 499 (Client Closed Request) errors in production
- **Status**: Investigation in progress
- **Affected Areas**:
  - Match history fetching
  - Batch processing of match details
  - Rate limiting implementation
- **Temporary Workarounds**: None currently available
- **Next Steps**:
  1. Investigate client-side timeout settings
  2. Review server-side request handling
  3. Consider implementing request queuing
  4. Evaluate alternative API call strategies

## Future Work

- Enhance error handling with more specific messages
- Improve caching strategies for faster analysis
- Expand outlier detection algorithms
- Implement advanced data visualization
- Add more detailed performance metrics
- Enhance the progress tracking system
- Resolve 499 error issues in production 