#!/usr/bin/env python3
"""
Simple AstroAI Backend - Minimal version that works with Python 3.13
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
import os
from datetime import datetime

class AstroAIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "message": "AstroAI Simple Backend is running!"
            }
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>AstroAI Backend</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
                    .method { color: #007acc; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 AstroAI Simple Backend</h1>
                    <p>This is a minimal backend server for AstroAI.</p>
                    
                    <h2>Available Endpoints:</h2>
                    <div class="endpoint">
                        <span class="method">GET</span> /health - Health check
                    </div>
                    <div class="endpoint">
                        <span class="method">POST</span> /kundli - Get kundli data (mock)
                    </div>
                    <div class="endpoint">
                        <span class="method">POST</span> /ask - Ask AI question (mock)
                    </div>
                    
                    <h2>Next Steps:</h2>
                    <ol>
                        <li>Configure API keys in environment variables</li>
                        <li>Set up Firebase project</li>
                        <li>Add OpenAI API key</li>
                        <li>Add ProKerala API key</li>
                    </ol>
                    
                    <h2>Frontend:</h2>
                    <p>Your React frontend is running at: <a href="http://localhost:5173">http://localhost:5173</a></p>
                </div>
            </body>
            </html>
            """
            self.wfile.write(html.encode())
        
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except:
            data = {}
        
        if self.path == '/kundli':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            
            # Get ProKerala credentials from environment or config file
            client_id = os.getenv('PROKERALA_CLIENT_ID')
            client_secret = os.getenv('PROKERALA_CLIENT_SECRET')
            
            # If not in environment, try to read from config file
            if not client_id or not client_secret:
                try:
                    with open('config.txt', 'r') as f:
                        for line in f:
                            if line.startswith('PROKERALA_CLIENT_ID='):
                                client_id = line.split('=', 1)[1].strip()
                            elif line.startswith('PROKERALA_CLIENT_SECRET='):
                                client_secret = line.split('=', 1)[1].strip()
                except FileNotFoundError:
                    pass
            
            if not client_id or not client_secret:
                # Return mock data with setup instructions
                response = {
                    "data": {
                        "sun_sign": "Aries",
                        "moon_sign": "Taurus", 
                        "rising_sign": "Gemini",
                        "message": "This is mock kundli data. Configure ProKerala credentials to get real data.",
                        "cached": False
                    },
                    "setup_required": {
                        "client_id": "Set PROKERALA_CLIENT_ID environment variable",
                        "client_secret": "Set PROKERALA_CLIENT_SECRET environment variable",
                        "registration_url": "https://client-api.prokerala.com/getting-started",
                        "instructions": [
                            "1. Register at https://client-api.prokerala.com/getting-started",
                            "2. Get your Client ID and Client Secret from dashboard",
                            "3. Set environment variables:",
                            "   export PROKERALA_CLIENT_ID=your_client_id",
                            "   export PROKERALA_CLIENT_SECRET=your_client_secret",
                            "4. Restart the server"
                        ]
                    },
                    "message": "Mock kundli data - configure ProKerala credentials for real data"
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Implement real ProKerala API call
            print(f"[DEBUG] Client ID found: {client_id[:8] if client_id else 'None'}...")
            print(f"[DEBUG] Client Secret found: {'Yes' if client_secret else 'No'}")
            
            # Extract birth details from request
            dob = data.get('dob', '1990-01-01')
            tob = data.get('tob', '10:30')
            pob = data.get('pob', 'Mumbai')
            lat = data.get('lat', 19.0760)  # Default to Mumbai
            lon = data.get('lon', 72.8777)
            
            try:
                # Use ProKerala official client library
                from prokerala_api import ApiClient
                
                print(f"[API] Initializing ProKerala client...")
                
                # Initialize the API client
                client = ApiClient(client_id, client_secret)
                
                # Prepare parameters for Kundli request
                params = {
                    'ayanamsa': 1,  # Lahiri ayanamsa
                    'coordinates': f"{lat},{lon}",
                    'datetime': f"{dob}T{tob}:00+00:00"
                }
                
                print(f"[API] Calling ProKerala API with params: {params}")
                
                # Make API request for basic kundli data
                kundli_data = client.get('v2/astrology/kundli/advanced', params)
                
                # Make API request for planet positions
                planet_data = client.get('v2/astrology/planet-position', params)
                
                print(f"[API] ProKerala responses received successfully")
                
                # Process the real kundli data
                processed_data = self._process_real_kundli_data(kundli_data, planet_data, dob, tob, pob)
                
                response = {
                    "data": processed_data,
                    "cached": False,
                    "source": "ProKerala API",
                    "timestamp": datetime.now().isoformat()
                }
                
            except Exception as e:
                print(f"[ERROR] ProKerala API call failed: {str(e)}")
                response = {
                    "data": {
                        "sun_sign": "Error",
                        "moon_sign": "Error", 
                        "rising_sign": "Error",
                        "message": f"ProKerala API Error: {str(e)}",
                        "cached": False
                    },
                    "error": "API Error",
                    "message": "Failed to fetch kundli data from ProKerala"
                }
            
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/ask':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            
            response = {
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
            self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def _process_real_kundli_data(self, kundli_data, planet_data, dob, tob, pob):
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
                rasi_chart = self._generate_rasi_chart_from_planets(planets)
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
    
    def _generate_rasi_chart_from_planets(self, planets):
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
    
    def log_message(self, format, *args):
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def run_server(port=8000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, AstroAIHandler)
    print(f"🚀 AstroAI Simple Backend starting on http://localhost:{port}")
    print(f"📋 Frontend is running at: http://localhost:5173")
    print(f"🔗 Backend API docs: http://localhost:{port}")
    print(f"❤️  Health check: http://localhost:{port}/health")
    print("\n📝 To get real kundli functionality:")
    print("   1. Register at: https://client-api.prokerala.com/getting-started")
    print("   2. Get Client ID and Client Secret from your dashboard")
    print("   3. Set environment variables:")
    print("      export PROKERALA_CLIENT_ID=your_client_id")
    print("      export PROKERALA_CLIENT_SECRET=your_client_secret")
    print("   4. Restart the server")
    print("\n🔑 ProKerala Free Plan:")
    print("   - 5,000 credits per month")
    print("   - Basic kundli data")
    print("   - Perfect for testing!")
    print("\n🛑 Press Ctrl+C to stop")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    run_server()

