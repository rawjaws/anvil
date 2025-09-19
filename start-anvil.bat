@echo off
setlocal enabledelayedexpansion

REM Read version from package.json
for /f "tokens=*" %%i in ('powershell -Command "(Get-Content package.json | ConvertFrom-Json).version"') do set VERSION=%%i

echo ============================================
echo        Starting Anvil v%VERSION% - Level 1!
echo ============================================
echo.

REM Check if server dependencies need to be installed/updated
set NEED_SERVER_INSTALL=false
if not exist "node_modules" (
    echo Server node_modules not found...
    set NEED_SERVER_INSTALL=true
) else (
    REM Check if all dependencies from package.json are installed
    echo Checking for missing server dependencies...
    call npm ls --depth=0 --silent >nul 2>&1
    if !errorlevel! neq 0 (
        echo Missing server dependencies detected...
        set NEED_SERVER_INSTALL=true
    )
)

if "%NEED_SERVER_INSTALL%"=="true" (
    echo Installing/updating server dependencies...
    call npm install
    echo.
)

REM Check if client dependencies need to be installed/updated
set NEED_CLIENT_INSTALL=false
if not exist "client\node_modules" (
    echo Client node_modules not found...
    set NEED_CLIENT_INSTALL=true
) else (
    REM Check if all client dependencies from package.json are installed
    echo Checking for missing client dependencies...
    cd client
    call npm ls --depth=0 --silent >nul 2>&1
    if !errorlevel! neq 0 (
        echo Missing client dependencies detected...
        set NEED_CLIENT_INSTALL=true
    )
    cd ..
)

if "%NEED_CLIENT_INSTALL%"=="true" (
    echo Installing/updating client dependencies...
    cd client
    call npm install
    cd ..
    echo.
)

REM Check if dist directory exists, if not build the client
if not exist "dist" (
    echo Building React client application...
    cd client
    call npm run build
    cd ..
    echo.
)

echo Starting Anvil server...
echo.
echo Anvil will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ============================================
echo.

npm start