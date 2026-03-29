@echo off
REM ══════════════════════════════════════════════════════════════════════
REM  MACRO DATA UPDATER - Windows Launcher
REM  Double-click this file to run the updater
REM ══════════════════════════════════════════════════════════════════════

echo.
echo  ============================================================
echo   MACRO ECONOMIC MONITORING SYSTEM - Data Updater
echo  ============================================================
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Python is not installed or not in PATH.
    echo  Download Python from: https://www.python.org/downloads/
    echo  Make sure to check "Add Python to PATH" during install.
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
python -c "import requests, openpyxl" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  Installing required packages...
    pip install -r requirements.txt
    echo.
)

REM Check if config exists
if not exist config.env (
    echo  ERROR: config.env not found.
    echo  Copy config.env and add your FRED API key.
    echo  Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html
    echo.
    pause
    exit /b 1
)

REM Run the updater
echo  Starting data update...
echo.
python macro_data_updater.py %*

echo.
if %ERRORLEVEL% EQU 0 (
    echo  ============================================================
    echo   UPDATE COMPLETE - Check the Excel workbook for new data
    echo  ============================================================
) else (
    echo  ============================================================
    echo   UPDATE FINISHED WITH ERRORS - Check update_log.txt
    echo  ============================================================
)

echo.
pause
