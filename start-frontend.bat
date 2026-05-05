@echo off
echo ====================================
echo    FoodConnect - Frontend Server
echo ====================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting React development server...
echo Frontend will be available at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ====================================
echo.

npm start
