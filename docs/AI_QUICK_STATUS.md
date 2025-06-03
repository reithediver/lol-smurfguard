# AI Quick Status & Reference Guide

⚡ **SINGLE SOURCE OF TRUTH** for AI assistants - Read THIS FIRST instead of multiple docs

---

## 🚀 **CURRENT DEPLOYMENT STATUS**

### **✅ LIVE & WORKING:**
- **Frontend**: https://lol-smurfguard.vercel.app/ (Vercel - LIVE)
- **Backend**: Railway deployment SUCCESSFUL ✅ (as of latest commit)
- **GitHub**: https://github.com/reithediver/lol-smurfguard

### **🔧 Current Git Status:**
- **Current Branch**: `development` (always work here first)
- **Railway Linked**: ✅ Project "SmurfGaurd", Environment: production  
- **User Logged In**: ✅ rei.ale01@gmail.com

### **🎯 Project Phase:**
- **Phase 1**: ✅ Service consolidation COMPLETE
- **Phase 2**: ✅ Railway deployment COMPLETE
- **Phase 3**: Ready for feature enhancements

---

## 📋 **KEY PROJECT INFO**

### **Architecture:**
- **Frontend**: React + TypeScript (Vercel)
- **Backend**: Express + TypeScript (Railway)  
- **API**: Riot Games API (Development key - limited access)

### **Main Features WORKING:**
- ✅ Advanced Smurf Detection (integrated in frontend)
- ✅ Rank benchmarking & outlier detection
- ✅ Champion performance analysis
- ✅ Professional op.gg-style UI
- ✅ Mock data for demo purposes

### **Known Limitations:**
- 🔐 Development API Key = Limited real player data access
- 🎯 Real analysis requires Personal API Key (apply at developer.riotgames.com)

---

## ⚡ **QUICK COMMANDS**

### **Git Workflow:**
```bash
git status                    # Check current state
git checkout development      # Always work from development
railway status               # Check Railway link (Project: SmurfGaurd)
railway up                    # Deploy to Railway
```

### **Testing:**
```bash
npx jest                      # Run backend tests (19/19 passing)
cd frontend && npm run build  # Test frontend build
```

### **URLs to Check:**
- Frontend: https://lol-smurfguard.vercel.app/
- Backend Health: https://[railway-url]/api/health
- API Capabilities: https://[railway-url]/api/analysis/capabilities

---

## 🚨 **CRITICAL AI RULES**

### **✅ DO:**
- Read THIS FILE FIRST - don't check multiple docs
- Work on `development` branch, test, then merge to `main`
- Always check `railway status` and `git status` if needed
- Integrate features into existing structure
- Follow existing component patterns

### **❌ DON'T:**
- Create standalone demos or separate projects
- Push directly to `main` without testing
- Check multiple documentation files - THIS IS THE MASTER
- Duplicate existing functionality

---

## 📁 **QUICK PROJECT STRUCTURE**

```
/frontend/src/components/     # React components (AdvancedSmurfAnalysis.tsx)
/src/services/               # Backend services (all working)
/src/api/                   # Riot API integration
/docs/                      # Documentation (consolidated here)
```

### **Main Components:**
- `AdvancedSmurfAnalysis.tsx` - Advanced detection UI
- `EnhancedPlayerDashboard.tsx` - op.gg-style dashboard  
- All backend services - cleaned and optimized

---

## 🎯 **CURRENT PRIORITIES**

### **Available for AI:**
1. **UI Enhancements** - Polish the advanced detection interface
2. **Error Handling** - Improve user experience for API limitations
3. **Feature Extensions** - Add new analysis capabilities
4. **Documentation** - Update API docs with new endpoints

### **Blocked (Requires Personal API Key):**
1. Real player data analysis
2. Match history deep analysis
3. Full rank detection features

---

## 📊 **HEALTH CHECK**

| Component | Status | URL/Command |
|-----------|--------|-------------|
| Frontend | ✅ Live | https://lol-smurfguard.vercel.app/ |
| Backend | ✅ Live | Railway logs show healthy |
| Tests | ✅ 19/19 | `npx jest` |
| Git | ✅ Clean | `development` branch |
| Railway | ✅ Linked | Project: SmurfGaurd |

---

## 🔄 **LAST UPDATED**

**Date**: 2025-06-02  
**Status**: Railway deployment successful, package.json fixed  
**Next**: Ready for feature work  
**Updated by**: Service consolidation & deployment completion

---

**💡 TIP**: If anything seems unclear, check git/railway status first, then proceed with confidence! 