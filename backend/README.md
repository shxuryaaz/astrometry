# AstroAI Python Backend

A simple FastAPI backend for the AstroAI astrology platform. Much easier to set up and manage than Cloud Functions!

## 🚀 Quick Start

### 1. Setup

```bash
cd backend
python setup.py
```

This will:
- Install all dependencies
- Create `.env` file from template
- Show you where to get API keys

### 2. Configure Environment

Edit `.env` file with your API keys:

```env
# Firebase (get from Firebase Console > Service Accounts)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com

# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your_openai_api_key

# ProKerala (get from https://www.prokerala.com/api/)
PROKERAL_API_KEY=your_prokeral_api_key
PROKERAL_BASE_URL=https://api.prokerala.com

# Razorpay (get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Stripe (get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### 3. Run the Server

```bash
python main.py
# or
./start.sh
```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

Once running, visit:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔑 Required API Keys

### 1. Firebase Service Account
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **"Generate new private key"**
5. Download JSON file and copy values to `.env`

### 2. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy to `.env`: `OPENAI_API_KEY=sk-...`

### 3. ProKerala API Key
1. Go to [ProKerala API](https://www.prokerala.com/api/)
2. Sign up for free account
3. Get API key from dashboard
4. Copy to `.env`: `PROKERAL_API_KEY=...`

### 4. Razorpay (India)
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/signup)
2. Get **Key ID** and **Secret** from API Keys section
3. Copy to `.env`: `RAZORPAY_KEY_ID=...` and `RAZORPAY_KEY_SECRET=...`

### 5. Stripe (Global)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Get **Secret key**
3. Copy to `.env`: `STRIPE_SECRET_KEY=sk_test_...`

## 🔗 Frontend Integration

Update your frontend `.env.local`:

```env
VITE_API_BASE=http://localhost:8000
```

## 📋 API Endpoints

### Authentication Required (all endpoints except /health)
Include Firebase ID token in Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

### Endpoints:

- `GET /health` - Health check
- `POST /kundli` - Get kundli data from ProKerala
- `POST /ask` - Ask AI astrology question
- `POST /payment/create-order` - Create payment order
- `GET /questions` - Get user's question history
- `GET /profile` - Get user profile

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test with authentication (replace TOKEN with Firebase ID token)
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/profile
```

## 🔧 Development

### Virtual Environment (Recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Auto-reload during development
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🚀 Deployment

### Local Development
```bash
python main.py
```

### Production (using Gunicorn)
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Firebase not initialized"**
   - Check Firebase service account credentials in `.env`
   - Ensure all Firebase fields are properly set

2. **"OpenAI API error"**
   - Verify `OPENAI_API_KEY` is correct
   - Check if you have credits in OpenAI account

3. **"ProKerala API error"**
   - Verify `PROKERAL_API_KEY` is correct
   - Check ProKerala API documentation for rate limits

4. **"Authentication failed"**
   - Ensure Firebase ID token is valid
   - Check if user exists in Firestore

### Debug Mode
Set in `.env`:
```env
DEBUG=True
```

## 📊 Features

✅ **Firebase Authentication** - JWT token verification  
✅ **ProKerala Integration** - Real astrology data  
✅ **OpenAI Integration** - AI-powered insights  
✅ **Payment Processing** - Razorpay & Stripe  
✅ **Firestore Database** - User data and questions  
✅ **Caching** - Kundli data caching  
✅ **Credit System** - Question-based credits  
✅ **Auto Documentation** - FastAPI automatic docs  

## 🔒 Security

- JWT token verification for all endpoints
- Firebase Admin SDK for secure database access
- Input validation with Pydantic
- CORS configuration for frontend
- Environment variable protection

## 📈 Performance

- FastAPI for high performance
- Firestore for scalable database
- OpenAI GPT-4 for accurate responses
- Caching for repeated requests
- Async/await for concurrent operations

This Python backend is much simpler to set up and manage compared to Cloud Functions, while providing all the same functionality!

