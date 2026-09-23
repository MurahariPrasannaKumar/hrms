@echo off
setlocal

set PROJECT_DIR=%~dp0
set PG_SERVICE=postgresql-x64-18
set VENV_DIR=%PROJECT_DIR%.venv

cd /d "%PROJECT_DIR%"

echo ============================================
echo  Horilla HRMS - local startup
echo ============================================

echo.
echo [1/3] Checking PostgreSQL service (%PG_SERVICE%)...
sc query %PG_SERVICE% | find "RUNNING" >nul
if %errorlevel%==0 (
    echo       Postgres is already running.
) else (
    echo       Starting Postgres service ^(may prompt for admin rights^)...
    net start %PG_SERVICE%
    if errorlevel 1 (
        echo       ERROR: could not start Postgres. Start it manually from services.msc and re-run this script.
        pause
        exit /b 1
    )
)

echo.
echo [2/3] Activating virtual environment...
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo       ERROR: venv not found at %VENV_DIR%. Create it first: python -m venv .venv
    pause
    exit /b 1
)
call "%VENV_DIR%\Scripts\activate.bat"

echo.
echo [3/3] Applying migrations and starting Django on port 8000...
python manage.py migrate
if errorlevel 1 (
    echo       ERROR: migrations failed.
    pause
    exit /b 1
)

start "Horilla - Django (port 8000)" cmd /k "call "%VENV_DIR%\Scripts\activate.bat" && python manage.py runserver 0.0.0.0:8000"

echo.
echo Horilla HRMS is starting at http://localhost:8000
echo Postgres is listening on port 5432.
endlocal
