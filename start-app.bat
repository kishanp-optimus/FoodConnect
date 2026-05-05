@echo off
echo ====================================
echo    FoodConnect - Full Stack Startup
echo ====================================
echo.
echo This will start both backend and frontend servers.
echo.

start "FoodConnect Backend" cmd /c "%~dp0start-backend.bat"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

start "FoodConnect Frontend" cmd /c "%~dp0start-frontend.bat"

echo.
echo ====================================
echo Both servers are starting...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo ====================================
echo.
pause
