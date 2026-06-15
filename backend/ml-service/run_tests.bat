@echo off
echo ========================================
echo SecondLife Commerce - API Test Runner
echo ========================================
echo.

echo Checking Python installation...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

echo.
echo Installing test dependencies...
pip install requests --quiet

echo.
echo ========================================
echo Starting API tests...
echo ========================================
echo.

python test_all_apis.py

echo.
echo ========================================
echo Tests complete!
echo ========================================
pause
