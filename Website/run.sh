#!/bin/bash

# Function to kill background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT

echo "🚀 Starting Genshin AI Mentor..."

# --- 1. Environment Check & Setup ---
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "📦 Installing dependencies from requirements.txt..."
    ./venv/bin/pip install -r requirements.txt
    echo "✅ Setup complete!"
else
    echo "✅ Virtual environment found."
fi

# --- 2. Start Services ---
# Start Backend
echo "Starting Backend (Port 8000)..."
./venv/bin/python backend/api.py &
BACKEND_PID=$!

# Wait a moment
sleep 2

# Start Frontend
echo "Starting Frontend (Port 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ App is running!"
echo "👉 Open http://localhost:5173 in your browser"
echo "Press Ctrl+C to stop."

wait
