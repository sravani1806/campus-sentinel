@echo off
title Campus Sentinel - Launching All Services
echo ====================================================================
echo  🛡️  CAMPUS SENTINEL: AGENTIC AI EMERGENCY EVACUATION SYSTEM
echo ====================================================================
echo.

echo [1/3] Starting Python AI & Routing Microservice (Port 8000)...
start "Campus Sentinel - Python AI Microservice (Port 8000)" cmd /k "cd ai-service && .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting Real-Time Node.js Backend Gateway (Port 5000)...
start "Campus Sentinel - Node.js Backend (Port 5000)" cmd /k "cd backend && npm run dev"

echo [3/3] Starting React Vite Command Center & PWA (Port 5173)...
start "Campus Sentinel - React Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================================
echo  ✅ ALL SERVICES LAUNCHED SUCCESSFULLY!
echo  👉 Web Command Dashboard: http://localhost:5173
echo  📡 Node.js Real-Time Hub: http://localhost:5000
echo  🤖 Python AI Microservice: http://localhost:8000/docs
echo ====================================================================
