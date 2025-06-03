# AI Task Management & Workflow Rules

CRITICAL RULES FOR AI ASSISTANTS - Follow these workflows to prevent duplicate work and confusion.

## PROJECT SETUP VERIFICATION

Before starting any task:
1. Read AI_QUICK_STATUS.md first - contains current deployment status, git state, and project info
2. Check this task list for available work
3. Never create standalone demos - always integrate into existing structure
4. Ask user for clarification if task seems like duplicate work

## PROJECT STRUCTURE - DO NOT MODIFY

league-smurf-detector/
├── frontend/ (React app - LIVE on Vercel)
│   ├── src/components/ (Integrated React components)
│   └── src/services/ (Frontend API services)
├── src/ (Backend - LIVE on Railway)
│   ├── services/ (Backend business logic)
│   ├── api/ (Riot API integration)
│   └── utils/ (Utilities and helpers)
├── docs/ (Documentation - AI optimized)
└── tests/ (19/19 passing)

## COMPLETED TASKS - DO NOT REPEAT

MAJOR FEATURES COMPLETE:
- Service consolidation (removed duplicates: smurf-detector.service.ts, riot.service.ts)
- Advanced smurf detection system integrated into frontend
- RankBenchmarkService with role-specific comparisons
- PlaystyleAnalysisService with 30-day time window analysis
- HybridAnalysisService with quick/deep/hybrid modes
- Professional op.gg-style UI components
- Railway deployment working and live
- Package.json fixed for proper backend deployment
- All 19 tests passing
- Frontend builds successfully
- Documentation consolidated

BACKEND SERVICES WORKING:
- SmurfDetectionService.ts (core detection algorithms)
- AdvancedDataService.ts (comprehensive analysis)
- RankBenchmarkService.ts (role-specific rank comparisons)
- PlaystyleAnalysisService.ts (dramatic playstyle change detection)
- HybridAnalysisService.ts (combined analysis modes)
- All TODO comments fixed
- Champion name mapping implemented
- Dynamic region support added

FRONTEND COMPONENTS WORKING:
- AdvancedSmurfAnalysis.tsx (advanced detection interface)
- EnhancedPlayerDashboard.tsx (op.gg-style dashboard)
- Tab system integration complete
- Professional styling with outlier detection

## AVAILABLE TASKS FOR AI ASSISTANTS

PRIORITY 1 - UI ENHANCEMENTS:
- Polish advanced detection interface
- Improve error messages for API limitations
- Add loading states and progress indicators
- Enhance responsive design for mobile

PRIORITY 2 - ERROR HANDLING:
- Better user experience when Development API Key limits hit
- Graceful degradation for missing data
- Improved error messages and recovery suggestions
- API rate limit handling improvements

PRIORITY 3 - FEATURE EXTENSIONS:
- Additional analysis modes
- Extended champion performance metrics
- Historical trend analysis (within API limitations)
- Export functionality for analysis results

PRIORITY 4 - DOCUMENTATION:
- Update API documentation with new endpoints
- Code documentation improvements
- User guide for frontend features

## BLOCKED TASKS - REQUIRE PERSONAL API KEY

These tasks cannot be completed with Development API Key:
- Real player data analysis
- Match history deep analysis (beyond basic endpoints)
- Full rank detection features
- Historical player performance tracking

## WORKFLOW RULES

GIT WORKFLOW:
- Always work on development branch first
- Test everything before merging to main
- Railway deploys automatically when code pushed
- User must confirm before production deployment

INTEGRATION RULES:
- Never create standalone projects or demos
- Always integrate features into existing components
- Follow existing component patterns and styling
- Maintain consistency with current architecture

TESTING REQUIREMENTS:
- Run npx jest to verify all 19 tests pass
- Test frontend build with npm run build
- Verify Railway deployment still works
- Check both frontend and backend health endpoints

## SERVICE REFERENCE

EXISTING SERVICES (working - do not duplicate):
- RankBenchmarkService.ts
- PlaystyleAnalysisService.ts  
- HybridAnalysisService.ts
- SmurfDetectionService.ts
- AdvancedDataService.ts
- ChallengerService.ts
- ChampionService.ts
- LimitedAccessService.ts

REMOVED SERVICES (do not recreate):
- smurf-detector.service.ts (duplicate)
- riot.service.ts (duplicate)
- EnhancedAnalysisService.ts.disabled (40+ TypeScript errors)

## API ENDPOINTS WORKING

Advanced analysis endpoints:
- /api/analyze/advanced-smurf/:summonerName
- /api/analyze/champion-outliers/:summonerName
- /api/analyze/basic/:summonerName
- /api/analyze/historical/:summonerName
- /api/analyze/champions/:summonerName
- /api/analysis/capabilities

Health and monitoring:
- /api/health (comprehensive health check)
- /health (basic health for load balancers)
- /api/metrics (performance metrics)
- /metrics (Prometheus format)

## CURRENT PROJECT PHASE

Phase completed: Service consolidation and Railway deployment
Current status: Production-ready with mock data
Ready for: Feature enhancements and UI improvements
Limitation: Development API Key restricts real player data access

## QUICK REFERENCE

Git status: development branch (clean)
Railway status: Project "SmurfGaurd" linked and deployed
Tests: 19/19 passing
Frontend: Live at https://lol-smurfguard.vercel.app/
Backend: Live on Railway

If unsure about project state, check AI_QUICK_STATUS.md first. 