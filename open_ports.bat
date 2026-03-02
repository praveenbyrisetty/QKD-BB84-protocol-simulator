@echo off
echo Opening port 5000 for Flask backend...
netsh advfirewall firewall add rule name=Flask5000 dir=in action=allow protocol=TCP localport=5000
echo.
echo Opening port 5173 for Vite dev server...
netsh advfirewall firewall add rule name=Vite5173 dir=in action=allow protocol=TCP localport=5173
echo.
echo Done! You can close this window and scan the QR code again.
pause
