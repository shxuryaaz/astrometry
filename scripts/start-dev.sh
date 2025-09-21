#!/bin/bash

# Start development environment with Firebase emulators

echo "🚀 Starting AstroAI development environment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase:"
    firebase login
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "functions/node_modules" ]; then
    echo "📦 Installing functions dependencies..."
    cd functions && npm install && cd ..
fi

# Start emulators
echo "🔥 Starting Firebase emulators..."
firebase emulators:start --only auth,firestore,functions,storage &

# Wait for emulators to start
echo "⏳ Waiting for emulators to start..."
sleep 10

# Set environment variables for emulator
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
export FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
export FIREBASE_FUNCTIONS_EMULATOR_HOST=localhost:5001
export FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
export VITE_API_BASE=http://localhost:5001/your-project-id/us-central1/api

echo "🌐 Starting Vite development server..."
npm run dev &

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔥 Firebase Emulator UI: http://localhost:4000"
echo ""
echo "📋 Available emulators:"
echo "  - Auth: localhost:9099"
echo "  - Firestore: localhost:8080"
echo "  - Functions: localhost:5001"
echo "  - Storage: localhost:9199"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Wait for any process to exit
wait

