@echo off
setlocal enabledelayedexpansion

echo Going to frontend directory...
cd frontend

echo Installing frontend dependencies...
npm install
if errorlevel 1 (
  echo npm install failed for frontend. Exiting.
  exit /b 1
)

echo Building frontend...
npm run build
if errorlevel 1 (
  echo npm build failed for frontend. Exiting.
  exit /b 1
)

echo Copying frontend build files to backend static resources...
xcopy /E /I /Y dist ..\backend\src\main\resources\static
if errorlevel 1 (
  echo xcopy failed for frontend. Exiting.
  exit /b 1
)

echo Going to queue_display directory...
cd ..\queue_display

echo Installing queue_display dependencies...
npm install
if errorlevel 1 (
  echo npm install failed for queue_display. Exiting.
  exit /b 1
)

echo Building queue display...
npm run build
if errorlevel 1 (
  echo npm build failed for queue_display. Exiting.
  exit /b 1
)

echo Going to backend directory...
cd ..\backend

echo Running Maven clean package...
call mvnw.cmd -DskipTests clean package
if errorlevel 1 (
  echo Maven build failed. Exiting.
  exit /b 1
)

echo Build process completed successfully.