#!/usr/bin/env python3
"""
AstroAI Backend Setup Script
This script helps you set up the Python backend with all required configurations.
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header():
    print("=" * 60)
    print("🚀 AstroAI Python Backend Setup")
    print("=" * 60)
    print()

def check_python_version():
    """Check if Python version is 3.8+"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required. Current version:", sys.version)
        sys.exit(1)
    print(f"✅ Python version: {sys.version.split()[0]}")

def install_dependencies():
    """Install required packages"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        sys.exit(1)

def setup_environment():
    """Setup environment file"""
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return
    
    if not env_example.exists():
        print("❌ env.example file not found")
        sys.exit(1)
    
    print("\n🔧 Setting up environment file...")
    
    # Copy example to .env
    with open(env_example, 'r') as f:
        content = f.read()
    
    with open(env_file, 'w') as f:
        f.write(content)
    
    print("✅ Created .env file from template")
    print("⚠️  Please edit .env file with your actual API keys")

def setup_firebase_service_account():
    """Guide user to setup Firebase service account"""
    print("\n🔥 Firebase Setup Required:")
    print("1. Go to Firebase Console: https://console.firebase.google.com")
    print("2. Select your project")
    print("3. Go to Project Settings > Service Accounts")
    print("4. Click 'Generate new private key'")
    print("5. Download the JSON file")
    print("6. Copy the values to your .env file:")
    print("   - project_id")
    print("   - private_key_id")
    print("   - private_key")
    print("   - client_email")
    print("   - client_id")

def setup_api_keys():
    """Guide user to setup API keys"""
    print("\n🔑 Required API Keys:")
    print("1. OpenAI API Key:")
    print("   - Go to: https://platform.openai.com/api-keys")
    print("   - Create new secret key")
    print("   - Add to .env: OPENAI_API_KEY=sk-...")
    print()
    print("2. ProKerala API Key:")
    print("   - Go to: https://www.prokerala.com/api/")
    print("   - Sign up and get API key")
    print("   - Add to .env: PROKERAL_API_KEY=...")
    print()
    print("3. Razorpay (for Indian payments):")
    print("   - Go to: https://dashboard.razorpay.com/signup")
    print("   - Get Key ID and Secret from API Keys section")
    print("   - Add to .env: RAZORPAY_KEY_ID=... and RAZORPAY_KEY_SECRET=...")
    print()
    print("4. Stripe (for global payments):")
    print("   - Go to: https://dashboard.stripe.com/test/apikeys")
    print("   - Get Secret key")
    print("   - Add to .env: STRIPE_SECRET_KEY=sk_test_...")

def create_startup_script():
    """Create a startup script"""
    startup_script = """#!/bin/bash
# AstroAI Backend Startup Script

echo "🚀 Starting AstroAI Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run setup.py first"
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
fi

# Start the server
echo "🌐 Starting FastAPI server..."
python main.py
"""
    
    with open("start.sh", "w") as f:
        f.write(startup_script)
    
    os.chmod("start.sh", 0o755)
    print("✅ Created start.sh script")

def main():
    print_header()
    
    # Check Python version
    check_python_version()
    
    # Install dependencies
    install_dependencies()
    
    # Setup environment
    setup_environment()
    
    # Create startup script
    create_startup_script()
    
    # Show setup instructions
    setup_firebase_service_account()
    setup_api_keys()
    
    print("\n" + "=" * 60)
    print("🎉 Setup Complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Edit .env file with your API keys")
    print("2. Run: python main.py")
    print("3. Or run: ./start.sh")
    print("\nAPI will be available at: http://localhost:8000")
    print("API docs at: http://localhost:8000/docs")
    print("\nFor frontend integration:")
    print("- Update VITE_API_BASE in your frontend .env.local")
    print("- Set it to: http://localhost:8000")

if __name__ == "__main__":
    main()

