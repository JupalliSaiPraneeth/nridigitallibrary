@echo off
echo ========================================================
echo  NRI Digital Library - Laptop Book Server API
echo ========================================================
echo  Laptop IP:      192.168.0.5
echo  Port:           8000
echo  Local URL:      http://localhost:8000
echo  Wi-Fi LAN URL:  http://192.168.0.5:8000
echo  Book Storage:   C:\Users\jupal\Downloads\books
echo ========================================================
echo  Health API:     http://192.168.0.5:8000/api/health
echo  Catalog API:    http://192.168.0.5:8000/api/books
echo ========================================================
node server.js
pause
