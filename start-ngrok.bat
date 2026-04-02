@echo off
echo ========================================
echo SASIENALA - Share to Mobile via Ngrok
echo ========================================
echo.
echo 1. Buka: https://dashboard.ngrok.com/signup
echo 2. Daftar gratis
echo 3. Copy authtoken dari dashboard
echo.
echo Kalau sudah punya authtoken, masukkan di bawah:
echo.
set /p TOKEN=Masukkan ngrok authtoken:
echo.
echo Adding authtoken...
ngrok config add-authtoken %TOKEN%
echo.
echo Starting tunnel...
ngrok http 8080
