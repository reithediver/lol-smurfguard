# Complete Deployment Setup Guide

## Overview: How Modern Web App Hosting Works

Our League of Legends Smurf Detection app uses a **"microservices"** approach:

- **Frontend (React)** → **Vercel** (Static files served globally)
- **Backend (Node.js API)** → **Railway** (Server processing)
- **GitHub** → **Automatic deployments** for both

```
[GitHub Repo] 
    ↓ (Push Code)
[GitHub Actions] → [Build & Test]
    ↓ (Deploy)
[Railway Backend] ← → [Vercel Frontend]
    ↓ (Serve)
[Your Users] → [league-smurf-detector.com]
```

## Step 1: Railway Backend Setup

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended)
3. Verify your email

### 1.2 Deploy Backend
```bash
# In your project root
railway login
railway init
# Enter project name: "league-smurf-backend"
```

**Railway will automatically:**
- Detect Node.js project (sees package.json)
- Run `npm ci --only=production`
- Run `npm run build` 
- Start with `npm start`
- Monitor health at `/health` endpoint

### 1.3 Set Environment Variables
In Railway dashboard:
```
NODE_ENV=production
RIOT_API_KEY=your_production_key_here
PORT=3001
```

### 1.4 Generate Domain
Railway gives you: `league-smurf-backend-production.up.railway.app`

## Step 2: Vercel Frontend Setup

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Connect your repository

### 2.2 Deploy Frontend
```bash
# In frontend directory
cd frontend
vercel
# Follow prompts, select project settings
```

### 2.3 Set Environment Variables
In Vercel dashboard:
```
REACT_APP_API_URL=https://league-smurf-backend-production.up.railway.app
REACT_APP_ENVIRONMENT=production
```

### 2.4 Generate Domain
Vercel gives you: `league-smurf-detector.vercel.app`

## Step 3: GitHub Actions (Automatic Deployment)

### 3.1 Set GitHub Secrets
Go to GitHub repo → Settings → Secrets:
```
RAILWAY_TOKEN=your_railway_token
VERCEL_TOKEN=your_vercel_token
RIOT_API_KEY_PRODUCTION=your_production_api_key
```

### 3.2 Test Deployment Pipeline
```bash
# Create develop branch for staging
git checkout -b develop
git push origin develop
# This triggers staging deployment

# Deploy to production
git checkout main
git push origin main
# This triggers production deployment
```

## Step 4: Custom Domain (Optional)

### 4.1 Purchase Domain
- Recommended: Namecheap, Google Domains, or Vercel
- Example: `league-smurf-detector.com`

### 4.2 Configure DNS
In your domain registrar:
```
# For frontend (Vercel)
CNAME: www → cname.vercel-dns.com
A: @ → 76.76.19.19

# For backend (Railway)  
CNAME: api → railway-production-url
```

### 4.3 SSL Certificates
Both Railway and Vercel provide **automatic SSL** certificates!

## Step 5: Monitoring & Maintenance

### 5.1 Health Monitoring
- **Railway**: Built-in monitoring dashboard
- **Vercel**: Analytics and performance metrics
- **Custom**: Our `/health` endpoint

### 5.2 Log Monitoring
```bash
# Railway logs
railway logs

# Vercel logs (in dashboard)
# GitHub Actions logs (in Actions tab)
```

## Cost Breakdown

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Railway | Hobby | $5.00 |
| Vercel | Hobby | $0.00 |
| Domain | Annual | ~$1.00/month |
| **Total** | | **~$6/month** |

## Deployment Checklist

### Before First Deployment:
- [ ] Railway account created and project initialized
- [ ] Vercel account created and connected to GitHub
- [ ] GitHub secrets configured
- [ ] Environment variables set in both platforms
- [ ] Production API key obtained from Riot Games
- [ ] DNS configured (if using custom domain)

### For Each Deployment:
- [ ] Tests passing locally (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Health check working (`npm run health-check`)
- [ ] Environment variables updated
- [ ] Database migrations run (if applicable)

### Post-Deployment:
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Analytics/monitoring configured
- [ ] SSL certificates active

## Troubleshooting Common Issues

### Backend (Railway) Issues:
```bash
# Check logs
railway logs

# Verify environment variables
railway variables

# Test health endpoint
curl https://your-app.railway.app/health
```

### Frontend (Vercel) Issues:
```bash
# Check build logs in Vercel dashboard
# Verify environment variables in Vercel settings
# Test API connectivity from browser console
```

### GitHub Actions Issues:
```bash
# Check Actions tab in GitHub
# Verify secrets are set correctly
# Check workflow files in .github/workflows/
```

## Security Best Practices

### API Keys:
- ✅ Store in environment variables
- ✅ Use different keys for staging/production
- ✅ Rotate keys regularly
- ❌ Never commit keys to Git

### CORS Configuration:
```javascript
// Only allow your frontend domain
corsOrigins: [
  'https://league-smurf-detector.com',
  'https://league-smurf-detector.vercel.app'
]
```

### Rate Limiting:
```javascript
// Production settings
rateLimiting: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // 50 requests per 15 minutes
}
```

## Next Steps After Deployment

1. **Set up monitoring alerts**
2. **Configure backup procedures**
3. **Implement analytics tracking**
4. **Set up error reporting (Sentry)**
5. **Configure performance monitoring**
6. **Plan for scaling**

## Support Resources

- **Railway**: [railway.app/help](https://railway.app/help)
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Riot API**: [developer.riotgames.com](https://developer.riotgames.com)
- **Project Documentation**: See `/docs` folder

---

**Remember**: Start with the Railway hobby plan ($5/month) and Vercel free plan. You can always upgrade later as your application grows! 