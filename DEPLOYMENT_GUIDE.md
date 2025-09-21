# 🚀 AstroAI Deployment Guide

## 📋 **Overview**
- **Backend**: Deploy to Render (FastAPI + ProKerala API)
- **Frontend**: Deploy to Vercel (React + TypeScript + Vite)

## 🔧 **Backend Deployment (Render)**

### 1. Prepare Backend
```bash
cd astrometry/backend
```

### 2. Deploy to Render
1. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `astrometry/backend` folder

2. **Configure Service**
   - **Name**: `astroai-backend`
   - **Runtime**: `Python 3.11`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn fastapi_server:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables**
   ```
   PROKERALA_CLIENT_ID=f40e44ec-48d6-4f45-b280-19316a31c6c2
   PROKERALA_CLIENT_SECRET=ycZr4mAkBp36I9vngyfKTP34t5bORA5IqLm349da
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://astroai-backend.onrender.com`)

## 🎨 **Frontend Deployment (Vercel)**

### 1. Prepare Frontend
```bash
cd astrometry
```

### 2. Deploy to Vercel
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard**
   ```
   VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Redeploy**
   ```bash
   vercel --prod
   ```

## 🔗 **Connect Frontend to Backend**

1. **Update Frontend Environment**
   - In Vercel dashboard, set `VITE_API_BASE_URL` to your Render backend URL
   - Redeploy frontend

2. **Update CORS in Backend**
   - Backend already configured for production origins

## ✅ **Testing Deployment**

1. **Test Backend**
   ```bash
   curl https://your-render-backend-url.onrender.com/health
   ```

2. **Test Frontend**
   - Visit your Vercel URL
   - Try generating a kundli

## 🐛 **Troubleshooting**

### Backend Issues
- Check Render logs for errors
- Verify environment variables are set
- Ensure ProKerala credentials are valid

### Frontend Issues
- Check Vercel deployment logs
- Verify environment variables in Vercel dashboard
- Check browser console for API errors

### CORS Issues
- Backend is configured to allow Vercel domains
- If issues persist, check CORS configuration in `fastapi_server.py`

## 📊 **Monitoring**

### Backend (Render)
- Monitor logs in Render dashboard
- Check service health and uptime
- Monitor ProKerala API usage

### Frontend (Vercel)
- Monitor deployment status in Vercel dashboard
- Check analytics and performance
- Monitor error rates

## 🔄 **Updates**

### Backend Updates
1. Push changes to GitHub
2. Render auto-deploys from main branch
3. Monitor deployment status

### Frontend Updates
1. Push changes to GitHub
2. Run `vercel --prod` or configure auto-deploy
3. Monitor deployment status

## 💰 **Costs**
- **Render**: Free tier available (sleeps after inactivity)
- **Vercel**: Free tier available (generous limits)
- **ProKerala**: Pay per API call (5k free credits)

## 🔐 **Security**
- Environment variables are encrypted in both platforms
- Never commit secrets to Git
- Use platform-specific environment variable management
