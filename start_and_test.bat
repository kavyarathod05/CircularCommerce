@echo off
echo =========================================================================
echo SecondLife Commerce - Server Startup and Comprehensive Testing
echo =========================================================================
echo.

REM Check Python
echo [1/5] Checking Python installation...
python --version 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found! Please install Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python installed
echo.

REM Install/Update dependencies
echo [2/5] Installing/Updating dependencies...
cd backend\ml-service
pip install -r requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Some dependencies may have failed to install
    echo Continuing anyway...
)
echo ✅ Dependencies installed
echo.

REM Check if server is already running
echo [3/5] Checking if server is already running...
curl -s http://localhost:8000/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Server is already running on port 8000
    echo.
    goto :run_tests
)

REM Start server in background
echo [4/5] Starting FastAPI server...
echo Starting uvicorn on http://localhost:8000
start /B python -m uvicorn main:app --port 8000 > server.log 2>&1

REM Wait for server to start
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Check if server started successfully
:check_server
set /a counter=0
:wait_loop
curl -s http://localhost:8000/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Server started successfully!
    echo.
    goto :run_tests
)
set /a counter+=1
if %counter% LSS 10 (
    echo Still waiting... (%counter%/10)
    timeout /t 2 /nobreak >nul
    goto :wait_loop
)

echo ❌ ERROR: Server failed to start after 20 seconds
echo Check server.log for details
type server.log
pause
exit /b 1

:run_tests
echo [5/5] Running comprehensive API tests...
echo =========================================================================
echo.
python test_all_apis.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================================
    echo 🎉 ALL TESTS PASSED! System is ready for demo!
    echo =========================================================================
) else (
    echo.
    echo =========================================================================
    echo ❌ Some tests failed. Please review the output above.
    echo =========================================================================
)

echo.
echo Server is still running at http://localhost:8000
echo Press any key to stop the server and exit...
pause >nul

REM Kill uvicorn process
echo.
echo Stopping server...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq uvicorn*" 2>nul
echo Server stopped.
