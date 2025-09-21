from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import os
import json

# ProKerala API imports
# from prokerala_api import ApiClient  # Not needed - using direct HTTP requests

app = FastAPI(title="AstroAI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class KundliRequest(BaseModel):
    dob: str
    tob: str
    pob: str
    lat: float
    lon: float

class AskRequest(BaseModel):
    question: str

import requests
import json

# Global token cache
access_token = None
token_expires = 0

def get_prokerala_access_token():
    """Get ProKerala access token using client credentials"""
    global access_token, token_expires
    
    client_id = os.getenv('PROKERALA_CLIENT_ID')
    client_secret = os.getenv('PROKERALA_CLIENT_SECRET')
    
    print(f"[CREDENTIALS] Environment CLIENT_ID: {client_id[:8]}...{client_id[-8:] if client_id else 'None'}")
    print(f"[CREDENTIALS] Environment CLIENT_SECRET: {client_secret[:8]}...{client_secret[-8:] if client_secret else 'None'}")
    
    # Fallback to config file
    if not client_id or not client_secret:
        print("[CREDENTIALS] Environment variables not found, checking config.txt...")
        try:
            with open('config.txt', 'r') as f:
                lines = f.read().strip().split('\n')
                for line in lines:
                    if line.startswith('PROKERALA_CLIENT_ID='):
                        client_id = line.split('=')[1]
                    elif line.startswith('PROKERALA_CLIENT_SECRET='):
                        client_secret = line.split('=')[1]
        except:
            pass
        
        print(f"[CREDENTIALS] Config file CLIENT_ID: {client_id[:8]}...{client_id[-8:] if client_id else 'None'}")
        print(f"[CREDENTIALS] Config file CLIENT_SECRET: {client_secret[:8]}...{client_secret[-8:] if client_secret else 'None'}")
    
    if not client_id or not client_secret:
        print("[CREDENTIALS] No valid credentials found!")
        raise HTTPException(status_code=500, detail="ProKerala credentials not configured")
    
    print(f"[CREDENTIALS] Using CLIENT_ID: {client_id[:8]}...{client_id[-8:]}")
    print(f"[CREDENTIALS] Using CLIENT_SECRET: {client_secret[:8]}...{client_secret[-8:]}")
    
    # Check if we have a valid token
    import time
    current_time = time.time()
    if access_token and current_time < token_expires:
        print(f"[TOKEN] Using cached access token")
        return access_token
    
    # Get new access token
    print(f"[TOKEN] Requesting new access token...")
    token_url = "https://api.prokerala.com/token"
    token_data = {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret
    }
    
    try:
        response = requests.post(token_url, data=token_data)
        response.raise_for_status()
        token_response = response.json()
        
        access_token = token_response['access_token']
        expires_in = token_response.get('expires_in', 3600)
        token_expires = current_time + expires_in - 60  # Refresh 1 minute early
        
        print(f"[TOKEN] Access token obtained successfully, expires in {expires_in}s")
        return access_token
        
    except Exception as e:
        print(f"[ERROR] Failed to get access token: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get ProKerala access token: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "message": "AstroAI FastAPI Backend is running!"
    }

@app.post("/kundli")
async def generate_kundli(request: KundliRequest):
    """Generate kundli using ProKerala API"""
    try:
        print(f"[API] Generating kundli for {request.dob} {request.tob} at {request.lat},{request.lon}")
        
        # Get access token
        access_token = get_prokerala_access_token()
        client_id = os.getenv('PROKERALA_CLIENT_ID', '')
        client_secret = os.getenv('PROKERALA_CLIENT_SECRET', '')
        
        # Prepare parameters
        params = {
            'ayanamsa': 1,  # Lahiri ayanamsa
            'coordinates': f"{request.lat},{request.lon}",
            'datetime': f"{request.dob}T{request.tob}:00+00:00"
        }
        
        print(f"[API] Calling ProKerala API with params: {params}")
        
        # Make API requests with proper authentication
        try:
            print(f"[API] Attempting ProKerala API call with Bearer token...")
            
            # Make requests with Bearer token
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Call kundli endpoint
            kundli_url = "https://api.prokerala.com/v2/astrology/kundli/advanced"
            kundli_response = requests.get(kundli_url, params=params, headers=headers)
            kundli_response.raise_for_status()
            kundli_data = kundli_response.json()
            
            # Call planet position endpoint
            planet_url = "https://api.prokerala.com/v2/astrology/planet-position"
            planet_response = requests.get(planet_url, params=params, headers=headers)
            planet_response.raise_for_status()
            planet_data = planet_response.json()
            
            print(f"[API] ProKerala responses received successfully")
            
            # Process the data
            processed_data = process_real_kundli_data(kundli_data, planet_data, request.dob, request.tob, request.pob)
            
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] ProKerala API call failed: {error_msg}")
            
            # Return detailed error information
            return {
                "data": {
                    "sun_sign": "Error",
                    "moon_sign": "Error", 
                    "rising_sign": "Error",
                    "message": f"ProKerala API Error: {error_msg}",
                    "debug_info": {
                        "credentials_used": {
                            "client_id": f"{client_id[:8]}...{client_id[-8:] if client_id else 'None'}",
                            "client_secret": f"{client_secret[:8]}...{client_secret[-8:] if client_secret else 'None'}"
                        },
                        "api_params": params,
                        "error_details": error_msg
                    },
                    "cached": False,
                    "source": "Error"
                },
                "error": "API Error",
                "message": f"ProKerala API failed: {error_msg}"
            }
        
        return {
            "data": processed_data,
            "cached": False,
            "source": "ProKerala API",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"[ERROR] ProKerala API call failed: {str(e)}")
        return {
            "data": {
                "sun_sign": "Error",
                "moon_sign": "Error", 
                "rising_sign": "Error",
                "message": f"API Error: {str(e)}",
                "cached": False
            },
            "error": "API Error",
            "message": "Failed to fetch kundli data from ProKerala"
        }

@app.post("/ask")
async def ask_question(request: AskRequest):
    """Ask AI question (mock for now)"""
    return {
        "id": "mock_question_123",
        "answer": {
            "shortAnswer": "This is a mock AI response. Add OPENAI_API_KEY to get real AI answers.",
            "percentScore": 75,
            "explanation": "Mock explanation - configure OpenAI API for real astrology insights.",
            "confidenceBreakdown": {
                "astrology": 0.45,
                "knowledge": 0.30,
                "ai": 0.25
            },
            "sources": [
                {
                    "id": "mock_source_1",
                    "snippet": "Mock astrological principle",
                    "source": "Mock_Astrology"
                }
            ]
        },
        "credits_remaining": 9,
        "message": "Mock AI response - add OPENAI_API_KEY to get real answers"
    }

def process_real_kundli_data(kundli_data, planet_data, dob, tob, pob):
    """Process real ProKerala API response for your UI"""
    try:
        print(f"[DEBUG] Processing kundli data structure...")
        
        # Initialize the response structure for your UI
        processed = {
            # Basic signs
            "sun_sign": "Unknown",
            "moon_sign": "Unknown", 
            "rising_sign": "Unknown",
            
            # Chart data for your Rasi Chart
            "rasi_chart": {
                "houses": [],
                "planets": []
            },
            
            # Planet positions for right panel
            "planet_positions": [],
            
            # Today's transits
            "todays_transits": [],
            
            # Birth details
            "birth_details": {
                "date_of_birth": dob,
                "time_of_birth": tob,
                "place_of_birth": pob
            },
            
            "cached": False,
            "source": "ProKerala API"
        }
        
        # Process the Kundli data for basic signs
        if 'data' in kundli_data:
            data = kundli_data['data']
            print(f"[DEBUG] Found kundli data with keys: {list(data.keys())}")
            
            # Extract basic signs from nakshatra_details
            if 'nakshatra_details' in data:
                nakshatra_details = data['nakshatra_details']
                
                # Sun sign
                if 'soorya_rasi' in nakshatra_details:
                    processed['sun_sign'] = nakshatra_details['soorya_rasi']['name']
                
                # Moon sign
                if 'chandra_rasi' in nakshatra_details:
                    processed['moon_sign'] = nakshatra_details['chandra_rasi']['name']
                
                # Rising sign (Ascendant)
                if 'zodiac' in nakshatra_details:
                    processed['rising_sign'] = nakshatra_details['zodiac']['name']
        
        # Process the Planet data for detailed positions
        if 'data' in planet_data and 'planet_position' in planet_data['data']:
            planets = planet_data['data']['planet_position']
            print(f"[DEBUG] Found {len(planets)} planets in planet data")
            
            planet_positions = []
            
            # Map ProKerala planets to your UI format
            planet_symbols = {
                'Sun': 'S', 'Moon': 'M', 'Mercury': 'Me', 'Venus': 'V',
                'Mars': 'Ma', 'Jupiter': 'J', 'Saturn': 'Sa', 
                'Rahu': 'R', 'Ketu': 'K', 'Ascendant': 'As'
            }
            
            for planet in planets:
                planet_name = planet['name']
                if planet_name in planet_symbols:
                    # Create planet position entry
                    position_entry = {
                        'planet': planet_name,
                        'symbol': planet_symbols[planet_name],
                        'sign': planet['rasi']['name'],
                        'degree': f"{planet['degree']:.2f}°",
                        'house': f"House {planet['position']}",
                        'nakshatra': 'Unknown',  # Not available in planet-position endpoint
                        'retrograde': planet['is_retrograde']
                    }
                    
                    planet_positions.append(position_entry)
            
            processed['planet_positions'] = planet_positions
            
            # Generate Rasi Chart data from planet positions
            rasi_chart = generate_rasi_chart_from_planets(planets)
            processed['rasi_chart'] = rasi_chart
            
            print(f"[DEBUG] Processed {len(planet_positions)} planets")
            print(f"[DEBUG] Sun: {processed['sun_sign']}, Moon: {processed['moon_sign']}, Rising: {processed['rising_sign']}")
        
        # Generate mock transits (ProKerala might not provide this)
        processed['todays_transits'] = [
            "Moon: Entering Sagittarius",
            "Mercury: Direct in Capricorn"
        ]
        
        return processed
        
    except Exception as e:
        print(f"[ERROR] Failed to process real kundli data: {str(e)}")
        return {
            "sun_sign": "Error",
            "moon_sign": "Error", 
            "rising_sign": "Error",
            "message": f"Processing error: {str(e)}",
            "cached": False,
            "raw_data": {"kundli": kundli_data, "planets": planet_data}
        }

def generate_rasi_chart_from_planets(planets):
    """Generate Rasi Chart data structure from planet positions"""
    try:
        rasi_chart = {
            "houses": [],
            "planets": []
        }
        
        # Generate 12 houses
        for i in range(1, 13):
            house = {
                "number": i,
                "sign": f"House {i}",
                "planets": []
            }
            rasi_chart["houses"].append(house)
        
        # Add planets to houses based on their positions
        planet_symbols = {
            'Sun': 'S', 'Moon': 'M', 'Mercury': 'Me', 'Venus': 'V',
            'Mars': 'Ma', 'Jupiter': 'J', 'Saturn': 'Sa', 
            'Rahu': 'R', 'Ketu': 'K', 'Ascendant': 'As'
        }
        
        for planet in planets:
            planet_name = planet['name']
            if planet_name in planet_symbols:
                house_number = planet['position']
                
                if 1 <= house_number <= 12:
                    planet_data = {
                        "symbol": planet_symbols[planet_name],
                        "name": planet_name,
                        "house": house_number,
                        "sign": planet['rasi']['name'],
                        "degree": planet['degree'],
                        "retrograde": planet['is_retrograde']
                    }
                    rasi_chart["planets"].append(planet_data)
        
        return rasi_chart
        
    except Exception as e:
        print(f"[ERROR] Failed to generate rasi chart: {str(e)}")
        return {"houses": [], "planets": []}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True, log_level="info")

