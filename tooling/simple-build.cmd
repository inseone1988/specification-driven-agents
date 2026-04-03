@echo off
echo 🔨 Simple Build Script for spec-driven-agents
echo =============================================

echo.
echo Step 1: Checking if npm is available...
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found in PATH
    pause
    exit /b 1
)

echo ✅ npm is available

echo.
echo Step 2: Checking package.json...
if not exist "package.json" (
    echo ❌ package.json not found
    pause
    exit /b 1
)

echo ✅ package.json found

echo.
echo Step 3: Installing dependencies if needed...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
) else (
    echo ✅ node_modules exists
)

echo.
echo Step 4: Checking tsup...
npx tsup --version >nul 2>&1
if errorlevel 1 (
    echo Installing tsup...
    call npm install --save-dev tsup
) else (
    echo ✅ tsup is available
)

echo.
echo Step 5: Running build...
call npx tsup

echo.
if exist "dist\index.js" (
    echo ✅ BUILD SUCCESSFUL!
    echo.
    echo 📊 Build output:
    dir dist\index.js
    echo.
    echo 🚀 Next steps:
    echo 1. Test: node dist\index.js --help
    echo 2. Install: npm install -g .
    echo 3. Use: sda generate domain test --force
) else (
    echo ❌ BUILD FAILED - dist\index.js not created
)

pause