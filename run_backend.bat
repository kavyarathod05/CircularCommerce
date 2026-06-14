@echo off
echo ========================================================
echo   Starting SecondLife Commerce Backend Services
echo ========================================================

cd backend\ml-service

echo Checking and installing Python dependencies...
pip install -r requirements.txt

echo.
echo [1/2] Starting Unified ML FastAPI Server (Port 8000)...
echo        (This single server hosts NSGA-II Routing, Sustainable Fleet MILP,
echo         Serial Verification, Fraud GNN, and Virtual Try-On engines)
start "FastAPI ML Microservice" cmd /k "python -m uvicorn main:app --port 8000"

echo [2/2] Starting Real-Time Logistics WebSocket Server (Port 8765)...
start "Logistics Telemetry WS" cmd /k "python logistics_ws_server.py"

echo.
echo All backend services have been launched in separate windows!
echo Keep those windows open to keep the services running.
echo.
cd ..\..
