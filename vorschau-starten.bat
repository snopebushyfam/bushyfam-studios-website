@echo off
cd /d "%~dp0"
echo Baue die Seite...
node build\build.mjs || goto :err
echo Vorschau: http://localhost:8080
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8080"
cd dist
py -m http.server 8080 2>nul || python -m http.server 8080
goto :eof
:err
echo.
echo Build fehlgeschlagen. Ist Node.js installiert? (https://nodejs.org)
pause
