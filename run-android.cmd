@echo off
cd /d "%~dp0"

set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
  echo Android Studio and the Android SDK are not installed.
  echo Install Android Studio, API 36, and an emulator first.
  pause
  exit /b 1
)

set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"

if not exist node_modules (
  call npm.cmd install
  if errorlevel 1 goto error
)

call npm.cmd run android
if errorlevel 1 goto error
exit /b 0

:error
echo.
echo Fishing Logbook could not start on Android.
pause
exit /b 1
