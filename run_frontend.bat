@echo off
echo ========================================================
echo   Starting SecondLife Commerce Frontend UI
echo ========================================================

cd frontend

echo Checking and installing npm dependencies...
call npm install

echo Starting Vite React Dev Server...
npm run dev
