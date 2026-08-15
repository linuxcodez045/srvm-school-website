@echo off
setlocal
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
del /Q "%STARTUP%\SRVM_AUTO_START.vbs" 2>nul
echo SRVM automatic startup has been removed.
pause
