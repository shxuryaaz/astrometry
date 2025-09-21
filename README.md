# AstroAI - AI-Powered Astrology Platform

A modern React + TypeScript application with Firebase backend integration for AI-powered astrology insights and predictions.

## 🌟 Features

- **Firebase Authentication** with Google Sign-In
- **AI-Powered Question Flow** with RAG (Retrieval Augmented Generation)
- **Interactive Kundli Visualization** with ProKerala API integration
- **Payment Integration** (Razorpay for India, Stripe globally)
- **PDF Report Generation** with Cloud Run
- **Knowledge Base Ingestion** with vector embeddings
- **Role-based Access Control** (Users, Astrologers, Admins)

## 🏗️ Architecture

### Option 1: Python Backend (Recommended - Easier Setup)
```
Frontend (React + Vite + Tailwind)
    ↓
Python FastAPI Backend
    ↓
External APIs:
- ProKerala (Astrology Data)
- OpenAI (LLM)
- Razorpay/Stripe (Payments)
- Firebase (Database & Auth)
```

### Option 2: Firebase Functions (Advanced)
```
Frontend (React + Vite + Tailwind)
    ↓
Firebase Functions (Node.js + TypeScript)
    ↓
External APIs:
- ProKerala (Astrology Data)
- OpenAI (LLM & Embeddings)
- Pinecone (Vector Database)
- Razorpay/Stripe (Payments)
```

## 🚀 Quick Start

### Option 1: Python Backend (Recommended)

#### Prerequisites
- Node.js 18+
- Python 3.8+
- Firebase Project
- OpenAI API Key
- ProKerala API Key
- Razorpay/Stripe Account (optional)

#### Setup
```bash
# Clone and setup
git clone <repository-url>
cd astrometry

# Start everything with Python backend
./start-python-backend.sh
```

This will guide you through:
1. Setting up Python backend
2. Getting API keys
3. Starting both frontend and backend

### Option 2: Firebase Functions (Advanced)

#### Prerequisites
- Node.js 18+
- Firebase CLI
- Google Cloud Project
- OpenAI API Key
- Pinecone Account
- Razorpay/Stripe Account

### 1. Clone and Install

```bash
git clone <repository-url>
cd astrometry
npm install
cd functions && npm install && cd ..
```

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init

# Select features: Auth, Firestore, Functions, Storage, Hosting
```

### 3. Environment Configuration

Copy the example environment file and configure:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Firebase project details. See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed instructions on getting all required API keys.

Set Cloud Functions environment variables:

```bash
firebase functions:config:set \
  prokeral.api_key="your_prokeral_key" \
  prokeral.base_url="https://api.prokerala.com" \
  openai.api_key="your_openai_key" \
  pinecone.api_key="your_pinecone_key" \
  razorpay.key_id="your_razorpay_key_id" \
  razorpay.key_secret="your_razorpay_secret" \
  stripe.secret_key="your_stripe_secret"
```

### 4. Local Development

```bash
# Start all services (emulators + dev server)
./scripts/start-dev.sh

# Or start individually:
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Start frontend
npm run dev
```

## 📁 Project Structure

```
astrometry/
├── src/                          # Frontend source
│   ├── components/               # Reusable UI components
│   ├── context/                  # React contexts (Auth)
│   ├── lib/                      # Utilities (Firebase, API)
│   ├── pages/                    # Page components
│   └── main.tsx                  # App entry point
├── functions/                    # Cloud Functions
│   ├── src/
│   │   ├── handlers/             # API endpoints
│   │   ├── lib/                  # Utilities (RAG, KB processing)
│   │   ├── middleware/           # Express middleware
│   │   └── index.ts              # Functions entry point
│   └── package.json
├── scripts/                      # Development scripts
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Firestore security rules
└── storage.rules                 # Storage security rules
```

## 🔧 Development Workflow

### 1. Authentication

The app uses Firebase Authentication with Google Sign-In. Users are automatically created in Firestore with initial credits.

### 2. API Endpoints

All API calls go through Firebase Functions with JWT token authentication:

- `POST /kundli` - Generate/cache kundli data
- `POST /ask` - AI question answering
- `POST /payment/create-order/razorpay` - Create payment order
- `POST /payment/webhook/razorpay` - Payment webhook
- `POST /pdf/generate` - Generate PDF reports

### 3. Knowledge Base

Upload PDFs to Firebase Storage in the `kb/` folder. The system will:
1. Extract text from PDFs
2. Split into chunks with overlap
3. Generate embeddings using OpenAI
4. Store in Pinecone vector database

```bash
# Manual KB ingestion
npm run ingest-kb ./docs/astrology-guide.pdf kb/guides/astrology-guide.pdf
```

## 🧪 Testing

```bash
# Frontend tests
npm test

# Functions tests
cd functions && npm test

# Integration tests with emulators
firebase emulators:exec --only firestore,functions "npm test"
```

## 🚀 Deployment

### Automatic Deployment (CI/CD)

The GitHub Actions workflow automatically deploys on push to `main`:

1. Runs tests and linting
2. Builds frontend and functions
3. Deploys to Firebase Hosting
4. Deploys Cloud Functions
5. Updates Firestore and Storage rules

### Manual Deployment

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 🔐 Security

### Firestore Rules

Users can only access their own data. Admins can access all data:

```javascript
// Users can read/write their own documents
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Storage Rules

- KB documents: Readable by authenticated users, writable by admins
- Reports: Only accessible by owner or admins

## 📊 Monitoring

### Cloud Functions Monitoring

- Error rates and latency in Firebase Console
- Custom metrics for LLM usage and costs
- Rate limiting to prevent abuse

### Analytics

User interactions are tracked in Firestore `analytics` collection for:
- Question types and success rates
- User engagement metrics
- Feature usage statistics

## 🛠️ Troubleshooting

### Common Issues

1. **Emulator Connection Issues**
   ```bash
   # Reset emulators
   firebase emulators:start --only auth,firestore,functions,storage
   ```

2. **Function Deployment Errors**
   ```bash
   # Check function logs
   firebase functions:log
   
   # Test locally
   firebase functions:shell
   ```

3. **Authentication Issues**
   - Verify Firebase project configuration
   - Check OAuth consent screen setup
   - Ensure authorized domains are configured

### Debug Mode

Set environment variables for detailed logging:

```bash
export DEBUG=firebase:* functions:*
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

### Code Style

- ESLint + Prettier for formatting
- TypeScript strict mode
- Conventional commit messages

## 📝 API Documentation

### Authentication

All API calls require a Firebase ID token in the Authorization header:

```javascript
const token = await user.getIdToken();
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Question Flow

```javascript
// Ask a question
const response = await fetch('/api/ask', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: "What does my love life look like in 2025?",
    category: "love",
    kundliCacheKey: "optional_cache_key"
  })
});
```

### Payment Flow

```javascript
// Create payment order
const order = await fetch('/api/payment/create-order/razorpay', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 1000, // ₹10
    currency: 'INR',
    credits: 10
  })
});
```

## 🔄 Migration from Mock Data

Run the migration script to convert existing mock data to Firestore:

```bash
npm run migrate-mock-data
```

This will create sample users, questions, and kundli data for testing.

## 📞 Support

For issues and questions:
- Create a GitHub issue
- Check Firebase Console logs
- Review Cloud Functions logs

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.