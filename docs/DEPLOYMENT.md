# Deployment Guide

## Overview
This guide covers deploying the League of Legends Smurf Detection application to various environments including staging and production.

## Prerequisites

### Required Environment Variables
```bash
# Core API Configuration
RIOT_API_KEY=your_riot_api_key_here
NODE_ENV=production|staging|development

# Environment-specific URLs
PRODUCTION_API_URL=https://api.league-smurf-detector.com
PRODUCTION_FRONTEND_URL=https://league-smurf-detector.com
STAGING_API_URL=https://staging-api.league-smurf-detector.com
STAGING_FRONTEND_URL=https://staging.league-smurf-detector.com

# Deployment Tokens (for CI/CD)
RAILWAY_TOKEN=your_railway_token
VERCEL_TOKEN=your_vercel_token
```

### Required Tools
- Node.js 18+
- Docker (for containerized deployment)
- Git
- Railway CLI (for Railway deployment)
- Vercel CLI (for Vercel deployment)

## Deployment Options

### 1. Railway + Vercel (Recommended)

#### Backend Deployment (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new

# Deploy backend
railway up

# Set environment variables
railway variables set RIOT_API_KEY=your_key_here
railway variables set NODE_ENV=production
```

#### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy frontend
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
# REACT_APP_API_URL=https://your-railway-app.railway.app
# REACT_APP_ENVIRONMENT=production
```

### 2. Docker Deployment

#### Development Environment
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop environment
docker-compose down
```

#### Production Environment
```bash
# Build and start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop environment
docker-compose -f docker-compose.prod.yml down
```

### 3. Manual Deployment

#### Backend
```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start application
npm start
```

#### Frontend
```bash
# Install dependencies
cd frontend
npm ci --only=production

# Build application
npm run build

# Serve static files (using serve or nginx)
npx serve -s build -l 3000
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### Continuous Integration (`ci.yml`)
- Runs on every push to `main` and `develop`
- Executes backend and frontend tests
- Performs security audits
- Builds application artifacts
- Uploads coverage reports

#### Staging Deployment (`deploy-staging.yml`)
- Triggers on push to `develop` branch
- Deploys to staging environment
- Runs health checks
- Notifies deployment status

#### Production Deployment (`deploy-production.yml`)
- Triggers on push to `main` branch
- Includes additional security checks
- Deploys to production environment
- Performs comprehensive health checks
- Sets up monitoring

### Setting Up GitHub Secrets
Navigate to your repository settings and add these secrets:

```
RIOT_API_KEY_PRODUCTION=your_production_api_key
STAGING_API_URL=https://staging-api.league-smurf-detector.com
PRODUCTION_API_URL=https://api.league-smurf-detector.com
STAGING_FRONTEND_URL=https://staging.league-smurf-detector.com
PRODUCTION_FRONTEND_URL=https://league-smurf-detector.com
RAILWAY_TOKEN=your_railway_token
VERCEL_TOKEN=your_vercel_token
```

## Environment Configuration

### Development
- Local development with hot reloading
- Debug logging enabled
- Permissive rate limiting
- No SSL required

### Staging
- Production-like environment for testing
- Moderate rate limiting
- SSL enabled
- Performance monitoring
- Error tracking

### Production
- Optimized for performance and security
- Strict rate limiting
- SSL required
- Comprehensive monitoring
- Error tracking and alerting

## Health Checks and Monitoring

### Health Endpoints
- `/health` - Basic health check for load balancers
- `/api/health` - Comprehensive health check with detailed status

### Health Check Response
```json
{
  "status": "healthy|unhealthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "api": true,
    "database": true,
    "riotApi": true,
    "cache": true
  },
  "uptime": 3600000,
  "memoryUsage": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  }
}
```

### Monitoring Setup
1. **Application Performance Monitoring (APM)**
   - New Relic or DataDog integration
   - Performance metrics tracking
   - Error rate monitoring

2. **Log Management**
   - Centralized logging with Winston
   - Log aggregation and analysis
   - Error alerting

3. **Uptime Monitoring**
   - External uptime monitoring service
   - Health check endpoint monitoring
   - Alert notifications

## Security Considerations

### Production Security Checklist
- [ ] API keys stored securely in environment variables
- [ ] HTTPS enabled with valid SSL certificates
- [ ] CORS configured for specific domains only
- [ ] Rate limiting implemented and tested
- [ ] Security headers enabled (Helmet.js)
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive information
- [ ] Dependencies regularly updated and audited

### SSL/TLS Configuration
```nginx
# Example Nginx configuration for SSL
server {
    listen 443 ssl http2;
    server_name league-smurf-detector.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Common Issues

#### 1. API Key Issues
```bash
# Test API key validity
npm run verify-key

# Check API permissions
npm run test-api
```

#### 2. Build Failures
```bash
# Clear build cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Frontend build issues
cd frontend
rm -rf node_modules package-lock.json build
npm install
npm run build
```

#### 3. Health Check Failures
```bash
# Run manual health check
npm run health-check

# Check application logs
docker-compose logs app

# Verify environment variables
printenv | grep RIOT_API_KEY
```

#### 4. Performance Issues
```bash
# Monitor memory usage
docker stats

# Check application metrics
curl http://localhost:3001/api/health

# Analyze logs for errors
docker-compose logs app | grep ERROR
```

### Log Analysis
```bash
# View real-time logs
docker-compose logs -f app

# Search for specific errors
docker-compose logs app | grep "ERROR\|WARN"

# Check health check logs
docker-compose logs app | grep "health"
```

## Rollback Procedures

### Quick Rollback
```bash
# Rollback to previous Docker image
docker-compose down
docker-compose pull
docker-compose up -d

# Rollback via Git
git revert HEAD
git push origin main
```

### Database Rollback
Since the application uses on-demand data fetching without persistent storage, no database rollback is required.

## Performance Optimization

### Production Optimizations
1. **Caching Strategy**
   - 5-minute cache for API responses
   - CDN for static assets
   - Browser caching headers

2. **Resource Optimization**
   - Gzip compression enabled
   - Minified JavaScript and CSS
   - Optimized Docker images

3. **Monitoring and Alerting**
   - Response time monitoring
   - Error rate tracking
   - Resource usage alerts

## Support and Maintenance

### Regular Maintenance Tasks
- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly performance reviews
- [ ] API key rotation (as needed)

### Emergency Contacts
- Development Team: [contact information]
- Infrastructure Team: [contact information]
- Riot Games API Support: [support channels]

---

For additional support or questions about deployment, please refer to the project documentation or contact the development team. 