# 🔑 API Keys Setup Guide

This guide shows you exactly where to get each API key needed for AstroAI.

## 🚀 Quick Setup (5 minutes)

### 1. OpenAI API Key (Required)
**Where to get it:**
1. Go to: https://platform.openai.com/api-keys
2. Sign up/Login with your email
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to `backend/.env`: `OPENAI_API_KEY=sk-your_key_here`

### 2. ProKerala API Key (Required)
**Where to get it:**
1. Go to: https://www.prokerala.com/api/
2. Click "Get Started" or "Sign Up"
3. Fill in basic details (name, email)
4. Verify your email
5. Go to "API Keys" section
6. Copy your API key
7. Add to `backend/.env`: `PROKERAL_API_KEY=your_key_here`

### 3. Firebase Service Account (Required)
**Where to get it:**
1. Go to: https://console.firebase.google.com
2. Select your project (or create one)
3. Click the gear icon ⚙️ > "Project settings"
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. Copy these values to `backend/.env`:
   ```env
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY_ID=your_private_key_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your_client_id
   ```

### 4. Razorpay (Optional - for Indian payments)
**Where to get it:**
1. Go to: https://dashboard.razorpay.com/signup
2. Sign up with business details
3. Complete verification
4. Go to "Settings" > "API Keys"
5. Copy "Key ID" and "Key Secret"
6. Add to `backend/.env`:
   ```env
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```

### 5. Stripe (Optional - for global payments)
**Where to get it:**
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Sign up/Login
3. Copy "Secret key" (starts with `sk_test_`)
4. Add to `backend/.env`: `STRIPE_SECRET_KEY=sk_test_your_key_here`

## 📝 Complete .env File Example

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=my-astroai-project
FIREBASE_PRIVATE_KEY_ID=abc123def456
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@my-astroai-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# OpenAI
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef

# ProKerala API
PROKERAL_API_KEY=pk_1234567890abcdef
PROKERAL_BASE_URL=https://api.prokerala.com

# Razorpay (India)
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Stripe (Global)
STRIPE_SECRET_KEY=sk_test_1234567890abcdef
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef

# App Configuration
APP_NAME=AstroAI
DEBUG=True
SECRET_KEY=your_secret_key_here

# CORS
ALLOWED_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
```

## 💰 Cost Information

### Free Tiers Available:
- **OpenAI**: $5 free credit (enough for ~1000 questions)
- **ProKerala**: Free tier with limited requests
- **Firebase**: Generous free tier
- **Razorpay**: No setup fees, only transaction fees
- **Stripe**: No monthly fees, only transaction fees

### Estimated Costs:
- **OpenAI**: ~$0.02 per question
- **ProKerala**: Free for basic usage
- **Firebase**: Free for small apps
- **Payments**: 2-3% per transaction

## 🔧 Setup Steps

1. **Get the required keys** (OpenAI + ProKerala + Firebase)
2. **Edit `backend/.env`** with your keys
3. **Run the setup script:**
   ```bash
   cd backend
   python setup.py
   ```
4. **Start the backend:**
   ```bash
   python main.py
   ```
5. **Start the frontend:**
   ```bash
   npm run dev
   ```

## 🆘 Need Help?

### Common Issues:

**"OpenAI API error"**
- Check if you have credits in your OpenAI account
- Verify the API key format (starts with `sk-`)

**"Firebase not initialized"**
- Make sure all Firebase fields in `.env` are correct
- Check if the service account has proper permissions

**"ProKerala API error"**
- Verify your API key is correct
- Check if you've exceeded rate limits

**"Authentication failed"**
- Ensure Firebase project is properly configured
- Check if user authentication is enabled in Firebase Console

### Support:
- Check the logs: `python main.py` will show detailed error messages
- Visit API docs: http://localhost:8000/docs
- Test individual endpoints with curl or Postman

## 🎯 Minimum Setup

For testing, you only need:
1. ✅ OpenAI API Key
2. ✅ ProKerala API Key  
3. ✅ Firebase Service Account

Optional (for payments):
4. Razorpay credentials
5. Stripe credentials

That's it! You can start testing the astrology features immediately with just 3 API keys.

