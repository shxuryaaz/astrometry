# Environment Setup Guide

## 🔧 Frontend Environment Variables

Create a `.env.local` file in the root directory (copy from `env.example`):

```bash
cp env.example .env.local
```

### Required Variables

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_SITE_URL=https://your-domain.com
VITE_API_BASE=https://us-central1-your_project.cloudfunctions.net
```

### Development Environment

For local development with emulators:

```env
# Development URLs
VITE_SITE_URL=http://localhost:5173
VITE_API_BASE=http://localhost:5001/your_project/us-central1/api
```

## ☁️ Cloud Functions Environment Variables

Set these using Firebase CLI:

```bash
# ProKerala API
firebase functions:config:set \
  prokeral.api_key="your_prokeral_api_key" \
  prokeral.base_url="https://api.prokerala.com"

# OpenAI API
firebase functions:config:set \
  openai.api_key="your_openai_api_key"

# Pinecone Vector Database
firebase functions:config:set \
  pinecone.api_key="your_pinecone_api_key"

# Razorpay (India)
firebase functions:config:set \
  razorpay.key_id="your_razorpay_key_id" \
  razorpay.key_secret="your_razorpay_secret" \
  razorpay.webhook_secret="your_razorpay_webhook_secret"

# Stripe (Global)
firebase functions:config:set \
  stripe.secret_key="your_stripe_secret_key" \
  stripe.webhook_secret="your_stripe_webhook_secret"

# Application URLs
firebase functions:config:set \
  app.site_url="https://your-domain.com" \
  app.api_base="https://us-central1-your_project.cloudfunctions.net"
```

## 🔑 How to Get API Keys

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on your web app or create one
6. Copy the configuration values

### 2. OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up/Login
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 3. Pinecone API Key

1. Go to [Pinecone Console](https://app.pinecone.io)
2. Sign up/Login
3. Go to API Keys section
4. Copy your API key
5. Note your environment (usually `us-east-1-aws`)

### 4. ProKerala API Key

1. Go to [ProKerala API](https://www.prokerala.com/api/)
2. Sign up for an account
3. Get your API key from dashboard
4. Note the base URL

### 5. Razorpay Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up/Login
3. Go to Settings > API Keys
4. Copy Key ID and Key Secret
5. Set up webhook endpoint for payment confirmation

### 6. Stripe Credentials

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up/Login
3. Go to Developers > API Keys
4. Copy Secret Key
5. Set up webhook endpoint for payment confirmation

## 🧪 Testing Environment

For testing, you can use these test values:

```env
# Test Firebase Project (use Firebase emulators)
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_FIREBASE_STORAGE_BUCKET=demo-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Test API URLs
VITE_SITE_URL=http://localhost:5173
VITE_API_BASE=http://localhost:5001/demo-project/us-central1/api
```

## 🔒 Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:
```
.env.local
.env.production
.env.staging
service-account-key.json
```

### 2. Use Different Projects

- **Development**: Use Firebase emulators
- **Staging**: Separate Firebase project
- **Production**: Separate Firebase project with billing

### 3. Rotate Keys Regularly

- Rotate API keys every 90 days
- Monitor usage for suspicious activity
- Use least privilege principle

### 4. Environment Validation

The app validates required environment variables on startup:

```typescript
// Check if all required env vars are set
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_AUTH_DOMAIN'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing environment variables:', missingVars);
}
```

## 🚀 Deployment Environments

### Development
```bash
# Use emulators
firebase emulators:start
npm run dev
```

### Staging
```bash
# Deploy to staging project
firebase use staging-project
firebase deploy
```

### Production
```bash
# Deploy to production project
firebase use production-project
firebase deploy
```

## 🐛 Troubleshooting

### Common Issues

1. **"Firebase app not initialized"**
   - Check if all Firebase env vars are set
   - Verify project ID is correct

2. **"API calls failing"**
   - Check VITE_API_BASE URL
   - Verify Cloud Functions are deployed

3. **"Authentication not working"**
   - Check authorized domains in Firebase Console
   - Verify OAuth consent screen setup

4. **"Environment variables undefined"**
   - Restart development server
   - Check .env.local file exists
   - Verify variable names start with VITE_

### Debug Mode

Enable debug logging:

```env
# Add to .env.local
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

## 📋 Environment Checklist

Before deploying:

- [ ] All Firebase env vars set
- [ ] API keys configured
- [ ] Payment credentials set up
- [ ] Webhook URLs configured
- [ ] Authorized domains added
- [ ] Service account created
- [ ] Security rules deployed
- [ ] Monitoring enabled

## 🔄 Environment Migration

When moving between environments:

1. **Export current config:**
   ```bash
   firebase functions:config:get > config.json
   ```

2. **Import to new environment:**
   ```bash
   firebase functions:config:set $(cat config.json)
   ```

3. **Update frontend env vars:**
   ```bash
   # Update .env.local with new project details
   ```

This ensures consistent configuration across all environments.

