@echo off
echo ============================================================
echo   Kolors Virtual Try-On - Windows Setup
echo ============================================================
echo.

echo [1/5] Checking Python installation...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found. Please install Python 3.9+ first.
    pause
    exit /b 1
)

echo.
echo [2/5] Installing dependencies...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install diffusers transformers accelerate gradio-client safetensors sentencepiece

echo.
echo [3/5] Checking GPU availability...
python -c "import torch; print('GPU Available:', torch.cuda.is_available())"

echo.
echo [4/5] Running setup script...
python setup_kolors_vto.py

echo.
echo [5/5] Setup complete!
echo.
echo ============================================================
echo   Ready to use Kolors VTO!
echo ============================================================
echo.
echo To test: python kolors_vto_local.py person.jpg garment.jpg
echo To run server: uvicorn main:app --reload --port 8000
echo.
pause
