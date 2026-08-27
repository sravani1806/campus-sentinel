Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host " 🛡️  CAMPUS SENTINEL: AGENTIC AI EMERGENCY EVACUATION SYSTEM" -ForegroundColor White
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Starting Python AI & Routing Microservice (Port 8000)..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\ai-service'; .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Real-Time Node.js Backend Gateway (Port 5000)..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "[3/3] Starting React Vite Command Center & PWA (Port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Green
Write-Host " ✅ ALL SERVICES LAUNCHED SUCCESSFULLY!" -ForegroundColor Green
Write-Host " 👉 Web Command Dashboard: http://localhost:5173" -ForegroundColor Cyan
Write-Host " 📡 Node.js Real-Time Hub: http://localhost:5000" -ForegroundColor Cyan
Write-Host " 🤖 Python AI Microservice: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Green
