# Production Deployment Guide

This guide covers deploying AstroAI to production using Firebase and Google Cloud Platform.

## 🚀 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Firebase Project** linked to your GCP project
3. **Required APIs enabled:**
   - Firebase Authentication API
   - Cloud Firestore API
   - Cloud Functions API
   - Cloud Storage API
   - Cloud Run API (for PDF generation)

## 🔧 Environment Setup

### 1. Firebase Project Configuration

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and select project
firebase login
firebase use your-project-id
```

### 2. Environment Variables

Set up environment variables for Cloud Functions:

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
  app.api_base="https://us-central1-your-project.cloudfunctions.net"
```

### 3. Service Account Setup

Create a service account for admin operations:

```bash
# Create service account
gcloud iam service-accounts create astroai-admin \
  --display-name="AstroAI Admin Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:astroai-admin@your-project-id.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# Download service account key
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=astroai-admin@your-project-id.iam.gserviceaccount.com
```

## 🏗️ Deployment Steps

### 1. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Storage Rules

```bash
firebase deploy --only storage
```

### 3. Deploy Cloud Functions

```bash
cd functions
npm ci
npm run build
cd ..
firebase deploy --only functions
```

### 4. Deploy Frontend

```bash
# Build the frontend
npm ci
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### 5. Deploy PDF Service (Cloud Run)

```bash
# Build and push Docker image
cd functions
gcloud builds submit --tag gcr.io/your-project-id/pdf-generator

# Deploy to Cloud Run
gcloud run deploy pdf-generator \
  --image gcr.io/your-project-id/pdf-generator \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars="FIREBASE_PROJECT_ID=your-project-id"
```

## 🔐 Security Configuration

### 1. Authentication Setup

Configure Google OAuth in Firebase Console:

1. Go to Authentication > Sign-in method
2. Enable Google provider
3. Add authorized domains:
   - `your-domain.com`
   - `localhost` (for development)

### 2. Custom Claims for Admin Users

Set admin custom claims for your users:

```javascript
// In Firebase Functions shell
const admin = require('firebase-admin');

// Set admin claim for a user
admin.auth().setCustomUserClaims('user-uid', { admin: true });

// Update user role in Firestore
admin.firestore().collection('users').doc('user-uid').update({
  role: 'admin'
});
```

### 3. Firestore Security Rules

The security rules are already configured in `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules
```

### 4. Storage Security Rules

Deploy storage rules:

```bash
firebase deploy --only storage
```

## 📊 Monitoring Setup

### 1. Cloud Monitoring

Enable monitoring for key metrics:

```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# Set up alerts for:
# - Function error rates > 5%
# - Function latency > 10s
# - High LLM API usage
```

### 2. Logging Configuration

Set up log retention and filtering:

```bash
# Set log retention to 30 days
gcloud logging sinks create astroai-logs \
  bigquery.googleapis.com/projects/your-project/datasets/astroai_logs \
  --log-filter="resource.type=cloud_function"
```

## 🔄 CI/CD Pipeline

### GitHub Actions Secrets

Add these secrets to your GitHub repository:

- `FIREBASE_SERVICE_ACCOUNT`: Service account JSON key
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `OPENAI_API_KEY`: OpenAI API key
- `PINECONE_API_KEY`: Pinecone API key
- `RAZORPAY_KEY_SECRET`: Razorpay secret key
- `STRIPE_SECRET_KEY`: Stripe secret key

### Automatic Deployment

The CI/CD pipeline will automatically deploy on push to `main` branch:

1. Run tests and linting
2. Build frontend and functions
3. Deploy to Firebase Hosting
4. Deploy Cloud Functions
5. Update security rules

## 🗄️ Database Migration

### 1. Run Migration Script

```bash
npm run migrate-mock-data
```

### 2. Seed Knowledge Base

```bash
# Upload PDFs to Firebase Storage
gsutil cp ./docs/astrology-guide.pdf gs://your-bucket/kb/guides/

# Or use the CLI script
npm run ingest-kb ./docs/astrology-guide.pdf kb/guides/astrology-guide.pdf
```

## 🔍 Post-Deployment Verification

### 1. Health Checks

```bash
# Check Cloud Functions health
curl https://us-central1-your-project.cloudfunctions.net/api/health

# Check Firestore connectivity
firebase firestore:indexes

# Check Authentication
firebase auth:export users.json
```

### 2. Test User Flows

1. **Authentication**: Sign up with Google
2. **Question Flow**: Ask a test question
3. **Payment**: Test with Stripe test mode
4. **PDF Generation**: Generate a test report
5. **Admin Functions**: Test admin operations

### 3. Performance Monitoring

Monitor these key metrics:

- Function response times
- Error rates
- User conversion rates
- Payment success rates
- PDF generation times

## 🚨 Troubleshooting

### Common Issues

1. **Function Timeouts**
   ```bash
   # Increase timeout in firebase.json
   {
     "functions": {
       "timeout": "540s"
     }
   }
   ```

2. **Memory Issues**
   ```bash
   # Increase memory allocation
   firebase functions:config:set functions.memory=2GB
   ```

3. **Authentication Errors**
   - Check authorized domains
   - Verify OAuth consent screen
   - Ensure service account permissions

### Log Analysis

```bash
# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only api

# Export logs for analysis
gcloud logging read "resource.type=cloud_function" --limit=1000 --format=json > logs.json
```

## 📈 Scaling Considerations

### 1. Database Scaling

- Enable Firestore automatic scaling
- Set up composite indexes for complex queries
- Consider data partitioning for large datasets

### 2. Function Scaling

- Use Cloud Run for CPU-intensive tasks
- Implement caching for expensive operations
- Set up auto-scaling policies

### 3. Storage Scaling

- Use Cloud CDN for static assets
- Implement image optimization
- Set up automated backups

## 🔒 Security Best Practices

1. **Regular Security Audits**
   - Review Firestore rules quarterly
   - Audit service account permissions
   - Monitor for suspicious activity

2. **Data Protection**
   - Enable audit logging
   - Implement data encryption
   - Regular backup verification

3. **API Security**
   - Rate limiting on all endpoints
   - Input validation and sanitization
   - Regular dependency updates

## 📞 Support and Maintenance

### Monitoring Dashboard

Set up a monitoring dashboard with:

- Real-time user metrics
- Function performance
- Error tracking
- Payment analytics

### Regular Maintenance

- Weekly security updates
- Monthly performance reviews
- Quarterly capacity planning
- Annual security audits

### Backup Strategy

- Daily Firestore backups
- Weekly Storage backups
- Monthly configuration exports
- Quarterly disaster recovery tests

