@echo off
setlocal

cd /d "%~dp0"
set "NODE_EXE=G:\Codex\tools\nodejs\node.exe"
set "NPM_CMD=G:\Codex\tools\nodejs\npm.cmd"
set "NEXT_BIN=%~dp0node_modules\next\dist\bin\next"

if not exist "%NODE_EXE%" (
  echo Node runtime not found: %NODE_EXE%
  exit /b 1
)

if not exist "%NEXT_BIN%" (
  echo Dependencies are missing. Installing with npm ci...
  "%NPM_CMD%" ci --cache "G:\Codex\.npm-cache"
  if errorlevel 1 exit /b 1
)

if not exist "%~dp0.next\BUILD_ID" (
  echo Production build is missing. Running npm run build...
  "%NPM_CMD%" run build
  if errorlevel 1 exit /b 1
)

echo Starting Optima at http://localhost:3001
"%NODE_EXE%" "%NEXT_BIN%" start --port 3001
