# Vercel Setup: Complete Visual Walkthrough

## 🎯 **Quick Start: Deploy Your Frontend to Vercel**

### **Step 1: Create Vercel Account**
1. Go to [vercel.com](https://vercel.com)
2. Click **"Start Deploying"** or **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub

### **Step 2: Import Your Project**
1. In Vercel dashboard, click **"Add New..." → "Project"**
2. You'll see **"Import Git Repository"** section
3. Find your repository in the list (e.g., "Passion Project v2")
4. Click **"Import"** next to your repo

### **Step 3: Configure Project (This is where Environment Variables are!)**

You'll now see the **"Configure Project"** screen with these sections:

#### **3.1 Project Settings**
```
Project Name: frontend (or whatever you prefer)
Framework Preset: Create React App (should auto-detect)
Root Directory: frontend (IMPORTANT: Set this to "frontend")
```

#### **3.2 Build Settings (Usually Auto-Detected)**
```
Build Command: npm run build
Output Directory: build
Install Command: npm ci
```

#### **3.3 Environment Variables (HERE'S WHERE YOU ADD THEM!)**
**Click the arrow next to "Environment Variables" to expand this section**

Then click **"Add New"** and enter:

```
Name: REACT_APP_API_URL
Value: http://localhost:3001
Environment: All (Development, Preview, Production)

Name: REACT_APP_ENVIRONMENT  
Value: development
Environment: All
```

**Note**: We'll update the API URL later when Railway is deployed.

### **Step 4: Deploy**
1. Click **"Deploy"** at the bottom
2. Watch the build process (takes 2-3 minutes)
3. Get your live URL: `https://your-project-name.vercel.app`

---

## 🔧 **After Deployment: Managing Environment Variables**

### **To Add/Edit Environment Variables Later:**

1. **Go to Vercel Dashboard** → Your Project
2. **Click "Settings"** tab (top menu)
3. **Click "Environment Variables"** (left sidebar)
4. **Click "Add New"** or edit existing ones

### **Environment Variable Types in Vercel:**
- **Development**: Used during `vercel dev`
- **Preview**: Used for branch/PR deployments
- **Production**: Used for main branch deployments
- **All**: Applied to all environments (recommended for React apps)

---

## 🚀 **Complete Frontend Environment Setup**

### **Development Environment Variables:**
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development
```

### **Production Environment Variables (Update after Railway deployment):**
```
REACT_APP_API_URL=https://your-railway-app-name.up.railway.app
REACT_APP_ENVIRONMENT=production
```

---

## 🔍 **Troubleshooting Common Issues**

### **"Environment Variables section not visible"**
- Make sure you're on the **"Configure Project"** screen during initial setup
- The section might be **collapsed** - look for a small arrow to expand it
- Try refreshing the page if the interface seems stuck

### **"Can't find my repository"**
- Make sure you've **connected GitHub** to Vercel
- Check that your repository is **public** or Vercel has access to private repos
- Try clicking **"Import Git Repository"** and authorizing more permissions

### **"Build failing with environment variable errors"**
- Make sure environment variables start with **"REACT_APP_"**
- Check that you've set them for the **correct environment** (All/Production)
- Verify the variable names are **exactly** as shown (case-sensitive)

### **"Frontend can't connect to backend"**
- Make sure `REACT_APP_API_URL` points to your **Railway backend URL**
- Check that Railway backend is deployed and running
- Verify CORS is configured in backend to allow your Vercel domain

---

## 📋 **Quick Checklist**

**Before Deploying:**
- [ ] GitHub repository connected to Vercel
- [ ] Project configured with correct framework (Create React App)
- [ ] Root directory set to "frontend"
- [ ] Environment variables added
- [ ] Build settings verified

**After Deploying:**
- [ ] Site loads at Vercel URL
- [ ] No console errors in browser
- [ ] Environment variables applied correctly
- [ ] Ready to connect to Railway backend

---

## 🎉 **Success Indicators**

✅ **Your frontend is successfully deployed when:**
- You get a live Vercel URL (e.g., `https://your-app.vercel.app`)
- The site loads without errors
- You can see your React app interface
- Console shows correct environment variables

✅ **Ready for backend connection when:**
- Environment variables are set in Vercel
- Railway backend is deployed and running
- CORS is configured for your Vercel domain
- API URL is updated to point to Railway

---

## 🔗 **What's Next?**

1. **Deploy Railway Backend** (follow Railway setup guide)
2. **Update REACT_APP_API_URL** in Vercel to point to Railway
3. **Test full application** with frontend + backend connected
4. **Set up custom domain** (optional)
5. **Configure monitoring** and analytics

---

**Need help?** The Vercel interface is very user-friendly, but don't hesitate to ask if you get stuck on any step! 