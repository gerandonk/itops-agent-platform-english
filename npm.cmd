@echo off
if /I "%1"=="--version" (echo 10.9.0 & exit /b 0)
if /I "%1"=="-v" (echo 10.9.0 & exit /b 0)
if /I "%1"=="version" (echo 10.9.0 & exit /b 0)
if /I "%1"=="--help" (echo npm shim: build via docker compose & exit /b 0)
if /I "%1"=="run" (
  if /I "%2"=="build" (docker compose build & exit /b %ERRORLEVEL%)
  if /I "%2"=="build:backend" (docker compose build backend & exit /b %ERRORLEVEL%)
  if /I "%2"=="build:frontend" (docker compose build frontend & exit /b %ERRORLEVEL%)
)
docker compose build
exit /b %ERRORLEVEL%
