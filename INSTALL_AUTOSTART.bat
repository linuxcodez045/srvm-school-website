@echo off
setlocal
cd /d "%~dp0"

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo Installing SRVM automatic startup...
copy /Y "SRVM_AUTO_START.vbs" "%STARTUP%\SRVM_AUTO_START.vbs" >nul

if errorlevel 1 (
    echo.
    echo Could not install automatic startup.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo SRVM automatic startup is now installed.
echo ==========================================
echo.
echo From now on, after you sign in to Windows,
echo the school website server will start automatically
echo and the website will open in your browser.
echo.
echo You do NOT need to run START_WEBSITE.bat every time.
echo.
echo You only need to run this installer ONCE.
echo.
pause
