@echo off
setlocal
title Shree Ram Vidhya Mandir School - Website

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
 echo Node.js was not found. Please install Node.js LTS.
 pause
 exit /b 1
)

if not exist "package.json" (
 echo package.json is missing. Please use the complete ZIP.
 pause
 exit /b 1
)

if not exist "node_modules\express" (
 echo Installing website packages...
 call npm install
 if errorlevel 1 (
   echo npm install failed.
   pause
   exit /b 1
 )
)

echo.
echo Starting SRVM website...
echo Website : http://localhost:5000/
echo Admin   : http://localhost:5000/admin/
echo.
start "" "http://localhost:5000/"
npm start
pause
endlocal
