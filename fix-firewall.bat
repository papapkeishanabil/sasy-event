@echo off
echo ========================================
echo Opening Firewall for Port 8080...
echo ========================================
powershell -Command "New-NetFirewallRule -DisplayName 'SASIENALA HTTP Server' -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow" 2>nul
echo.
echo DONE! Now access from your mobile:
echo.
echo http://192.168.1.15:8080/
echo.
pause
