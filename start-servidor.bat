@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   ========================================
echo     LOLA - Tu armario digital
echo   ========================================
echo.
echo   Abriendo la app en el navegador...
echo   Direccion: http://localhost:5173
echo.
echo   Para DETENER el servidor: cierra esta ventana.
echo.
start "" http://localhost:5173
python -m http.server 5173 || py -m http.server 5173
