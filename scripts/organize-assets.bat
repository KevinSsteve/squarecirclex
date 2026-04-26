@echo off
REM Asset Organization Batch Script
REM Double-click this file to organize downloaded assets

echo.
echo ========================================
echo   3D Asset Organization Script
echo ========================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell not found!
    echo Please install PowerShell or run the .ps1 script manually.
    pause
    exit /b 1
)

REM Run the PowerShell script
echo Running asset organization script...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0organize-3d-assets.ps1"

echo.
echo ========================================
echo   Organization Complete
echo ========================================
echo.
echo Check the output above for results.
echo.

pause
