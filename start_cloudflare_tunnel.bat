@echo off
echo ========================================================
echo  NRI Digital Library - Cloudflare HTTPS Tunnel
echo  Exposes Laptop Book Server over secure HTTPS
echo ========================================================
echo  Target: http://localhost:8000
echo ========================================================
if exist cloudflared.exe (
    cloudflared.exe tunnel --url http://localhost:8000
) else (
    echo [ERROR] cloudflared.exe not found in project folder!
)
pause
