#!/bin/bash

echo "🚀 Starting AstroAI with Python Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Setup Python backend
echo "📦 Setting up Python backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Running setup..."
    python setup.py
    echo ""
    echo "📝 Please edit backend/.env with your API keys, then run this script again."
    exit 0
fi

echo "✅ Python backend setup complete!"
echo ""

# Go back to root and start frontend
cd ..

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Copy environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating frontend environment file..."
    cp env.example .env.local
    echo "⚠️  Please edit .env.local with your Firebase configuration"
fi

echo ""
echo "🎉 Setup complete! Starting services..."
echo ""
echo "📋 To get API keys, see:"
echo "   - backend/README.md for detailed instructions"
echo "   - Or run: python backend/setup.py"
echo ""
echo "🚀 Starting Python backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo "🌐 Starting frontend..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services started!"
echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait

