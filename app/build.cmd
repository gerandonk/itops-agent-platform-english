@echo off
set "PATH=%PATH%;%~dp0"
cd /d "%~dp0"
docker compose build
exit /b %ERRORLEVEL%
