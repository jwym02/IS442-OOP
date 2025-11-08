@echo off
setlocal enabledelayedexpansion

echo Going to frontend directory...
cd frontend

echo Installing frontend dependencies...
npm install
if errorlevel 1 (
  echo npm install failed. Exiting.
  exit /b 1
)

echo Building frontend...
npm run build
if errorlevel 1 (
  echo npm build failed. Exiting.
  exit /b 1
)

echo Copying frontend build files to backend static resources...
:: Adjust the source folder if your build output is different (e.g., dist)
xcopy /E /I /Y dist ..\backend\src\main\resources\static

echo Going to backend directory...
cd ..\backend

echo Running Maven clean package...
call mvnw.cmd -DskipTests clean package
if errorlevel 1 (
  echo Maven build failed. Exiting.
  exit /b 1
)

echo Build process completed successfully.