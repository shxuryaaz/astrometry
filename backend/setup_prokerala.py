#!/usr/bin/env python3
"""
ProKerala API Setup Helper
This script helps you get and configure the ProKerala API key for real kundli data.
"""

import os
import webbrowser
import sys

def print_header():
    print("=" * 60)
    print("🔮 ProKerala API Setup for Real Kundli Data")
    print("=" * 60)
    print()

def open_prokerala_website():
    """Open ProKerala API website in browser"""
    url = "https://www.prokerala.com/api/"
    print(f"🌐 Opening ProKerala API website: {url}")
    try:
        webbrowser.open(url)
        print("✅ Website opened in your browser")
    except Exception as e:
        print(f"❌ Could not open browser: {e}")
        print(f"   Please manually visit: {url}")

def get_api_key_from_user():
    """Get API key from user input"""
    print("\n📝 Please follow these steps:")
    print("1. Sign up for a free account on ProKerala")
    print("2. Go to your dashboard/API section")
    print("3. Generate a new API key")
    print("4. Copy the API key")
    print()
    
    api_key = input("🔑 Enter your ProKerala API key: ").strip()
    
    if not api_key:
        print("❌ No API key provided")
        return None
    
    if len(api_key) < 10:
        print("⚠️  API key seems too short. Please check and try again.")
        return None
    
    return api_key

def test_api_key(api_key):
    """Test the API key with a simple request"""
    try:
        import requests
        
        print("\n🧪 Testing your API key...")
        
        # Test with a simple API call
        test_url = "https://api.prokerala.com/v2/astrology/kundli"
        params = {
            'client_id': api_key,
            'dob': '1990-01-01',
            'tob': '10:30',
            'pob': 'Mumbai',
            'lat': 19.0760,
            'lon': 72.8777,
            'format': 'json'
        }
        
        response = requests.get(test_url, params=params, timeout=10)
        
        if response.status_code == 200:
            print("✅ API key is working!")
            return True
        else:
            print(f"❌ API test failed: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except ImportError:
        print("⚠️  requests library not available for testing")
        return True  # Assume it's working if we can't test
    except Exception as e:
        print(f"❌ API test error: {e}")
        return False

def setup_environment(api_key):
    """Set up environment variable"""
    print(f"\n🔧 Setting up environment variable...")
    
    # Create a simple .env file
    env_content = f"""# ProKerala API Configuration
PROKERAL_API_KEY={api_key}

# Other API Keys (optional)
# OPENAI_API_KEY=sk-your_openai_key_here
# FIREBASE_PROJECT_ID=your_firebase_project_id
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ Created .env file with your API key")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def show_usage_instructions():
    """Show how to use the API key"""
    print("\n🚀 Usage Instructions:")
    print("1. Your API key is now saved in the .env file")
    print("2. Restart the backend server:")
    print("   cd backend")
    print("   python3 simple_main.py")
    print("3. Test the kundli endpoint:")
    print("   curl -X POST http://localhost:8000/kundli \\")
    print("     -H 'Content-Type: application/json' \\")
    print("     -d '{\"dob\":\"1990-01-01\",\"tob\":\"10:30\",\"pob\":\"Mumbai\"}'")
    print("\n📊 ProKerala Free Plan:")
    print("   - 5,000 credits per month")
    print("   - Basic kundli data")
    print("   - Perfect for testing!")

def main():
    print_header()
    
    # Check if API key already exists
    existing_key = os.getenv('PROKERAL_API_KEY')
    if existing_key:
        print(f"✅ ProKerala API key already configured: {existing_key[:10]}...")
        choice = input("Do you want to update it? (y/n): ").lower()
        if choice != 'y':
            print("Keeping existing API key.")
            return
    
    # Open ProKerala website
    open_prokerala_website()
    
    # Get API key from user
    api_key = get_api_key_from_user()
    if not api_key:
        print("❌ Setup cancelled")
        return
    
    # Test API key
    if not test_api_key(api_key):
        choice = input("API test failed. Continue anyway? (y/n): ").lower()
        if choice != 'y':
            print("❌ Setup cancelled")
            return
    
    # Set up environment
    if setup_environment(api_key):
        print("🎉 ProKerala API setup complete!")
        show_usage_instructions()
    else:
        print("❌ Setup failed")

if __name__ == '__main__':
    main()
