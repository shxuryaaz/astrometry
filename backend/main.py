from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, auth
import openai
import requests
import json
from datetime import datetime, timedelta
import uvicorn

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
# Initialize Firebase only if environment variables are available
firebase_private_key = os.getenv("FIREBASE_PRIVATE_KEY")
if firebase_private_key and not firebase_admin._apps:
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": firebase_private_key.replace('\\n', '\n'),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
    })
    firebase_admin.initialize_app(cred)

# Initialize OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize FastAPI app
app = FastAPI(
    title="AstroAI API",
    description="AI-Powered Astrology Platform Backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
db = firestore.client()

# Pydantic models
class KundliRequest(BaseModel):
    dob: str  # Date of Birth (YYYY-MM-DD)
    tob: str  # Time of Birth (HH:MM)
    pob: str  # Place of Birth
    lat: Optional[float] = None
    lon: Optional[float] = None

class QuestionRequest(BaseModel):
    question: str
    category: str = "general"
    kundli_cache_key: Optional[str] = None

class PaymentRequest(BaseModel):
    amount: int
    currency: str = "INR"
    credits: int
    provider: str = "razorpay"

class UserResponse(BaseModel):
    uid: str
    name: str
    email: str
    credits: int
    role: str

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        uid = decoded_token['uid']
        
        # Get user data from Firestore
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        return UserResponse(
            uid=uid,
            name=user_data.get('name', ''),
            email=user_data.get('email', ''),
            credits=user_data.get('credits', 0),
            role=user_data.get('role', 'end_user')
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Kundli endpoint
@app.post("/kundli")
async def get_kundli(request: KundliRequest, current_user: UserResponse = Depends(get_current_user)):
    cache_key = f"{request.dob}|{request.tob}|{request.pob}"
    
    try:
        # Check cache first
        cache_query = db.collection('kundli_cache').where('cache_key', '==', cache_key).limit(1)
        cache_docs = cache_query.get()
        
        if cache_docs:
            cached_data = cache_docs[0].to_dict()
            return {
                "data": cached_data['payload'],
                "cached": True,
                "cache_id": cache_docs[0].id
            }
        
        # Call ProKerala API
        prokeral_response = requests.post(
            f"{os.getenv('PROKERAL_BASE_URL')}/kundli",
            headers={
                "Authorization": f"Bearer {os.getenv('PROKERAL_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "dob": request.dob,
                "tob": request.tob,
                "pob": request.pob,
                "lat": request.lat,
                "lon": request.lon
            }
        )
        
        if not prokeral_response.ok:
            raise HTTPException(status_code=502, detail="ProKerala API error")
        
        kundli_data = prokeral_response.json()
        
        # Cache the result
        cache_ref = db.collection('kundli_cache').add({
            'cache_key': cache_key,
            'payload': kundli_data,
            'user_id': current_user.uid,
            'created_at': datetime.now()
        })
        
        # Update user's birth details
        db.collection('users').document(current_user.uid).update({
            'date_of_birth': request.dob,
            'time_of_birth': request.tob,
            'place_of_birth': request.pob,
            'latitude': request.lat,
            'longitude': request.lon,
            'last_kundli_generated': datetime.now()
        })
        
        return {
            "data": kundli_data,
            "cached": False,
            "cache_id": cache_ref[1].id
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail="External API error")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# Ask question endpoint
@app.post("/ask")
async def ask_question(request: QuestionRequest, current_user: UserResponse = Depends(get_current_user)):
    if current_user.credits <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    try:
        # Get kundli data if provided
        kundli_facts = ""
        if request.kundli_cache_key:
            kundli_docs = db.collection('kundli_cache').where('cache_key', '==', request.kundli_cache_key).limit(1).get()
            if kundli_docs:
                kundli_facts = json.dumps(kundli_docs[0].to_dict()['payload'])
        
        # Create prompt for OpenAI
        prompt = f"""
        You are an expert astrologer. Answer the following question based on the provided kundli data and your knowledge of Vedic astrology.
        
        KUNDLI DATA:
        {kundli_facts or "No kundli data provided"}
        
        QUESTION: {request.question}
        
        Please provide a detailed astrological analysis including:
        1. A percentage score (0-100) representing the likelihood/probability
        2. A brief explanation (2-4 sentences)
        3. Key astrological factors influencing this
        4. Practical advice or recommendations
        
        Respond in JSON format:
        {{
            "shortAnswer": "Brief 2-3 sentence answer",
            "percentScore": 75,
            "explanation": "Detailed explanation in 2-4 sentences",
            "confidenceBreakdown": {{
                "astrology": 0.45,
                "knowledge": 0.30,
                "ai": 0.25
            }},
            "sources": [
                {{
                    "id": "astrology_principle_1",
                    "snippet": "Relevant astrological principle",
                    "source": "Vedic_Astrology"
                }}
            ]
        }}
        """
        
        # Call OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert astrologer. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        answer_text = response.choices[0].message.content
        answer_data = json.loads(answer_text)
        
        # Store question in database
        question_ref = db.collection('questions').add({
            'user_id': current_user.uid,
            'category': request.category,
            'question_text': request.question,
            'answer': answer_data,
            'kundli_cache_key': request.kundli_cache_key,
            'verified': False,
            'created_at': datetime.now()
        })
        
        # Decrement user credits
        db.collection('users').document(current_user.uid).update({
            'credits': current_user.credits - 1,
            'last_question_at': datetime.now()
        })
        
        return {
            "id": question_ref[1].id,
            "answer": answer_data,
            "credits_remaining": current_user.credits - 1
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# Payment endpoints
@app.post("/payment/create-order")
async def create_payment_order(request: PaymentRequest, current_user: UserResponse = Depends(get_current_user)):
    try:
        if request.provider == "razorpay":
            import razorpay
            client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID'), os.getenv('RAZORPAY_KEY_SECRET')))
            
            order = client.order.create({
                'amount': request.amount * 100,  # Amount in paise
                'currency': request.currency,
                'receipt': f'astroai_{current_user.uid}_{datetime.now().timestamp()}',
                'notes': {
                    'user_id': current_user.uid,
                    'credits': request.credits
                }
            })
            
            # Store payment record
            payment_ref = db.collection('payments').add({
                'user_id': current_user.uid,
                'amount': request.amount,
                'currency': request.currency,
                'credits': request.credits,
                'provider': 'razorpay',
                'provider_order_id': order['id'],
                'status': 'created',
                'created_at': datetime.now()
            })
            
            return {
                "order_id": order['id'],
                "amount": order['amount'],
                "currency": order['currency'],
                "key": os.getenv('RAZORPAY_KEY_ID'),
                "payment_id": payment_ref[1].id
            }
            
        elif request.provider == "stripe":
            import stripe
            stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
            
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': request.currency.lower(),
                        'product_data': {
                            'name': f'{request.credits} AstroAI Credits',
                        },
                        'unit_amount': request.amount * 100,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{os.getenv('FRONTEND_URL')}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{os.getenv('FRONTEND_URL')}/payment/cancel",
                metadata={
                    'user_id': current_user.uid,
                    'credits': str(request.credits)
                }
            )
            
            # Store payment record
            payment_ref = db.collection('payments').add({
                'user_id': current_user.uid,
                'amount': request.amount,
                'currency': request.currency,
                'credits': request.credits,
                'provider': 'stripe',
                'provider_order_id': session.id,
                'status': 'created',
                'created_at': datetime.now()
            })
            
            return {
                "session_id": session.id,
                "url": session.url,
                "payment_id": payment_ref[1].id
            }
        
        else:
            raise HTTPException(status_code=400, detail="Invalid payment provider")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail="Payment creation failed")

# Get user questions
@app.get("/questions")
async def get_user_questions(limit: int = 10, current_user: UserResponse = Depends(get_current_user)):
    try:
        questions_query = db.collection('questions')\
            .where('user_id', '==', current_user.uid)\
            .order_by('created_at', direction=firestore.Query.DESCENDING)\
            .limit(limit)
        
        questions = []
        for doc in questions_query.stream():
            question_data = doc.to_dict()
            questions.append({
                "id": doc.id,
                **question_data,
                "created_at": question_data['created_at'].isoformat() if 'created_at' in question_data else None
            })
        
        return {"questions": questions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch questions")

# Get user profile
@app.get("/profile")
async def get_user_profile(current_user: UserResponse = Depends(get_current_user)):
    return current_user

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if os.getenv("DEBUG") == "True" else False
    )

