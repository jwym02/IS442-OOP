@echo off
setlocal

echo Starting backend server in the background...
:: Start jar in background
start "Backend" /B java -jar backend\target\clinic-system-1.0.0.jar

echo Starting queue display server in the background...
:: Start queue display in background
start "QueueDisplay" /B cmd /c "cd queue_display && npm run preview"

echo.
echo Both servers are now running.
echo Close this window or press Ctrl+C to stop both servers.
echo.

pause
