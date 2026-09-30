@echo off
title TrendPulse 360 - 1-Click Auto Updater
cd /d "I:\Agent\Website\News"

echo ============================================================
echo   TrendPulse 360 - Fetching Worldwide News & Auto-Deploying
echo ============================================================

echo [1/2] Fetching latest trending news across all categories...
python auto_updater.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to fetch news. Please check internet connection.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Deploying fresh news & sitemap to Firebase Hosting...
call firebase.cmd deploy --only hosting
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firebase deploy failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ============================================================
echo   SUCCESS! Your news website has been updated and is live at:
echo   https://trendpulse-live.web.app
echo ============================================================
timeout /t 5
