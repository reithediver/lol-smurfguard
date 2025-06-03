# AI Status Reference - READ FIRST

SINGLE SOURCE OF TRUTH - Contains all critical project information in AI-optimized format.

## DEPLOYMENT STATUS

Frontend: LIVE at https://lol-smurfguard.vercel.app/ (Vercel)
Backend: LIVE on Railway (Project: "SmurfGaurd", Environment: production)  
GitHub: https://github.com/reithediver/lol-smurfguard
All tests: 19/19 passing

## GIT STATUS

Current branch: development (always work here first)
Railway: Linked and working
User: rei.ale01@gmail.com logged in

## PROJECT ARCHITECTURE

Frontend: React + TypeScript deployed on Vercel
Backend: Express + TypeScript deployed on Railway
API: Riot Games API with Development key (limited access)
Database: None (stateless API service)

## WORKING FEATURES

- Advanced smurf detection system integrated in frontend
- Rank benchmarking with outlier detection  
- Champion performance analysis
- Professional op.gg-style UI components
- Mock data system for demo purposes
- Health monitoring and performance metrics

## LIMITATIONS

Development API Key restricts real player data access
Full analysis requires Personal API Key from developer.riotgames.com
Mock data used for demonstrations

## CRITICAL COMMANDS

Git workflow:
- git status (check state)
- git checkout development (work branch)  
- railway status (check deployment link)
- railway up (deploy)

Testing:
- npx jest (run all 19 tests)
- cd frontend && npm run build (test frontend)

Health checks:
- Frontend: https://lol-smurfguard.vercel.app/
- Backend: railway logs (view live status)

## PROJECT STRUCTURE

Key directories:
- /frontend/src/components/ (React components)
- /src/services/ (backend business logic - all working)
- /src/api/ (Riot API integration)
- /docs/ (documentation)

Main components:
- AdvancedSmurfAnalysis.tsx (advanced detection UI)
- EnhancedPlayerDashboard.tsx (main dashboard)
- All backend services optimized and duplicate-free

## AI RULES

DO:
- Read this file first instead of checking multiple documents
- Work on development branch, test, then merge to main
- Integrate new features into existing structure
- Check railway status and git status when needed

DO NOT:
- Create standalone demos or separate projects
- Push to main without testing in development
- Check multiple documentation files
- Duplicate existing functionality

## CURRENT PRIORITIES

Available tasks:
1. UI enhancements for advanced detection interface
2. Error handling improvements for API limitations  
3. Feature extensions to analysis capabilities
4. Documentation updates for new endpoints

Blocked (requires Personal API Key):
1. Real player data analysis
2. Match history deep analysis
3. Full rank detection features

## COMPONENT STATUS

Frontend: Live and working
Backend: Live and working  
Tests: All passing
Git: Clean development branch
Railway: Linked Project "SmurfGaurd"
Documentation: Consolidated in this file

## LAST UPDATED

Date: 2025-06-02
Status: Railway deployment successful, package.json fixed, ready for feature work
Phase: Service consolidation complete, deployment complete, ready for enhancements

## QUICK REFERENCE

If unsure about project state:
1. Check git status
2. Check railway status  
3. Run npx jest to verify tests
4. Proceed with confidence

All major setup and deployment work is complete. System is production-ready with mock data. 