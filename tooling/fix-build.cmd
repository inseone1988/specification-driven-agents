@echo off
echo 🔧 FIXING BUILD - Removing duplicate shebang
echo ============================================

echo.
echo Step 1: Cleaning dist directory...
if exist dist rmdir /s /q dist

echo.
echo Step 2: Running build...
call npx tsup

echo.
echo Step 3: Checking for duplicate shebang...
if exist dist\index.js (
    REM Check first line
    setlocal enabledelayedexpansion
    < dist\index.js (
        set /p firstLine=
        set /p secondLine=
    )
    
    echo First line: !firstLine!
    echo Second line: !secondLine!
    
    if "!firstLine!"=="#!/usr/bin/env node" (
        if "!secondLine!"=="#!/usr/bin/env node" (
            echo ❌ DUPLICATE SHEBANG DETECTED!
            echo.
            echo Fixing by removing first line...
            
            REM Create temp file without first line
            more +1 dist\index.js > dist\index.js.tmp
            move /y dist\index.js.tmp dist\index.js >nul
            
            echo ✅ Fixed duplicate shebang
        ) else (
            echo ✅ No duplicate shebang
        )
    )
)

echo.
if exist dist\index.js (
    echo ✅ BUILD FIXED!
    echo.
    echo 📊 File info:
    dir dist\index.js
    echo.
    echo 🚀 Test with:
    echo node dist\index.js --help
) else (
    echo ❌ BUILD FAILED
)

pause