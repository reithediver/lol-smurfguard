# AI Status Reference - READ FIRST

SINGLE SOURCE OF TRUTH - Contains all critical project information in AI-optimized format.

## DEPLOYMENT STATUS

Frontend: LIVE at https://lol-smurfguard.vercel.app/ (Vercel)
Backend: LIVE on Railway (Project: "SmurfGaurd", Environment: production)  
GitHub: https://github.com/reithediver/lol-smurfguard
All tests: 19/19 passing

## NEW: OP.GG MCP INTEGRATION ✅ COMPLETE

**Status:** Phase 1 & 2 Complete - Backend Integration Done
**What's New:** Real data integration via OP.GG MCP replacing mock data
**Toggle:** `USE_OPGG_DATA=true/false` in environment variables
**Endpoints Added:** 
- `/api/analyze/opgg-enhanced/:summonerName` - Real OP.GG analysis
- `/api/integration/status` - OP.GG status monitoring
- `/api/refresh/:summonerName` - Data refresh capability

## GIT STATUS

Current branch: development (always work here first)
Railway: Linked and working
User: rei.ale01@gmail.com logged in

## PROJECT ARCHITECTURE

Frontend: React + TypeScript deployed on Vercel
Backend: Express + TypeScript deployed on Railway
API: **ENHANCED** - Riot Games API + OP.GG MCP integration
Database: None (stateless API service)
New Services: OpggDataAdapter, Enhanced DataFetchingService

## WORKING FEATURES

**Core Smurf Detection:**
- Advanced smurf detection system integrated in frontend
- Rank benchmarking with outlier detection  
- Champion performance analysis
- Professional op.gg-style UI components

**NEW - OP.GG Enhanced Features:**
- ✅ Real summoner data via OP.GG MCP
- ✅ Enhanced match history analysis
- ✅ Champion mastery verification
- ✅ Meta comparison capabilities
- ✅ Data refresh functionality
- ✅ Automatic fallback to Riot API

**Infrastructure:**
- Health monitoring and performance metrics
- Comprehensive caching system
- Error handling with fallback support

## DATA SOURCES

**Primary:** OP.GG MCP (when enabled)
- Real summoner information
- Match history and champion data
- Position statistics and meta data
- Automatic data refresh capability

**Fallback:** Riot API + Mock Data
- Development API key limitations
- Mock data for demonstrations
- Maintains full functionality

## LIMITATIONS - GREATLY REDUCED

**Before OP.GG Integration:**
- Development API Key restricted real player data access
- Limited to mock data demonstrations

**After OP.GG Integration:**
- ✅ Real player data available via OP.GG
- ✅ Enhanced analysis capabilities
- Remaining: Some advanced features require Personal API Key

## CRITICAL COMMANDS

**OP.GG Integration Testing:**
- `node test-opgg-integration.js` (run integration tests)
- `USE_OPGG_DATA=true npm start` (enable OP.GG)
- Test endpoint: `GET /api/analyze/opgg-enhanced/SummonerName`

**Standard Commands:**
- `git status` (check state)
- `git checkout development` (work branch)  
- `railway status` (check deployment link)
- `railway up` (deploy)

**Testing:**
- `npx jest` (run all 19 tests)
- `cd frontend && npm run build` (test frontend)

**Health checks:**
- Frontend: https://lol-smurfguard.vercel.app/
- Backend: railway logs (view live status)
- OP.GG Status: GET /api/integration/status

## PROJECT STRUCTURE

**Key directories:**
- `/frontend/src/components/` (React components - ready for OP.GG data)
- `/src/services/` (backend business logic - OP.GG integrated)
- `/src/api/` (Riot API + OP.GG integration)
- `/docs/` (documentation including OP.GG integration plan)

**New/Updated components:**
- `OpggDataAdapter.ts` (OP.GG MCP integration)
- `DataFetchingService.ts` (enhanced with OP.GG)
- Main server (enhanced endpoints)

## AI RULES - UPDATED

**DO:**
- Use OP.GG integration for real data analysis
- Test with `/api/analyze/opgg-enhanced/` for enhanced features
- Check `/api/integration/status` for OP.GG availability
- Work on development branch, test, then merge to main
- Integrate new features into existing structure

**DO NOT:**
- Recreate OP.GG integration (already complete)
- Create standalone demos or separate projects
- Push to main without testing in development
- Remove OP.GG integration or fallback systems

**NEW - OP.GG Specific:**
- Check integration status before making OP.GG assumptions
- Use fallback gracefully when OP.GG unavailable
- Test both OP.GG enabled and disabled modes
- Leverage real data capabilities for enhanced analysis

## CURRENT PRIORITIES - UPDATED

**Ready for immediate work:**
1. **Frontend OP.GG Integration** - Update UI to use enhanced endpoints
2. UI enhancements for OP.GG data display
3. Real data validation and testing
4. Enhanced tooltips and meta information

**Available but not urgent:**
1. Error handling improvements
2. Feature extensions to analysis capabilities
3. Testing and documentation improvements

**Blocked (requires Personal API Key):**
1. Some advanced Riot API features
2. Historical match data deep analysis

## COMPONENT STATUS

Frontend: Live and ready for OP.GG integration
Backend: **Enhanced** - OP.GG integration complete
OP.GG Services: Complete and functional
Tests: All passing (19/19)
Git: Clean development branch
Railway: Linked Project "SmurfGaurd"
Documentation: Updated with OP.GG integration

## INTEGRATION TESTING

**Test OP.GG Integration:**
```bash
# Run comprehensive integration tests
node test-opgg-integration.js

# Enable OP.GG and test enhanced endpoint
USE_OPGG_DATA=true
curl http://localhost:3000/api/analyze/opgg-enhanced/Faker?region=kr

# Check integration status
curl http://localhost:3000/api/integration/status
```

## LAST UPDATED

Date: 2025-12-02
Status: OP.GG MCP integration complete, ready for frontend enhancement
Phase: Backend integration complete, frontend integration ready to begin

## QUICK REFERENCE

**For OP.GG Integration Questions:**
1. Check `/api/integration/status` for current status
2. Run `node test-opgg-integration.js` to verify functionality  
3. Use `/api/analyze/opgg-enhanced/` for real data analysis
4. Toggle with `USE_OPGG_DATA` environment variable

**For Traditional Workflow:**
1. Check git status
2. Check railway status  
3. Run npx jest to verify tests
4. Proceed with confidence

**Next Steps:**
- Frontend integration to use OP.GG enhanced endpoints
- Real data testing with actual summoner names
- Enhanced UI elements for OP.GG-specific features

All major setup, deployment, and OP.GG integration work is complete. System is production-ready with real data capabilities! 