@echo off
cd /d "%~dp0"
echo Iniciando STREATY FIGHT 2 - TURBO BRASIL...
start "" http://localhost:8765/index.html
python -m http.server 8765
