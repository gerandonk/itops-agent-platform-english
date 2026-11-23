@echo off
if /I "%1"=="--version" (echo 10.9.0 & exit /b 0)
if /I "%1"=="-v" (echo 10.9.0 & exit /b 0)
if /I "%1"=="version" (echo 10.9.0 & exit /b 0)
if /I "%1"=="--help" (echo npm shim: build via docker compose & exit /b 0)
docker compose build
exit /b %ERRORLEVEL%
