@echo off
echo ====================================
echo    FoodConnect - Backend Server
echo ====================================
echo.

cd /d "%~dp0backend"

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt -q

echo.
echo Starting server on http://0.0.0.0:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo ====================================
echo.

python main.py

pause
