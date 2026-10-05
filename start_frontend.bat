@echo off
echo ========================================================
echo Starting Digital Library Frontend Portal...
echo URL: http://localhost:3000
echo ========================================================
npx.cmd serve . -p 3000
if %errorlevel% neq 0 (
  echo Falling back to Python static server on port 3000...
  python -m http.server 3000
)
pause
