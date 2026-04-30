@echo off
cd /d "%~dp0"
echo Preparando Atelier Lumiere...
call npm run build
if errorlevel 1 (
  echo.
  echo No se pudo preparar la web. Revisa el mensaje anterior.
  pause
  exit /b 1
)
echo.
echo Web local lista en:
echo http://127.0.0.1:4173/
echo.
echo Deja esta ventana abierta mientras trabajas en la web.
node scripts\local-static-server.mjs dist 127.0.0.1 4173
pause
