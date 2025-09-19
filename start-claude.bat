@echo off
echo Setting PowerShell execution policy for Claude Code...
powershell -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
if %errorlevel% equ 0 (
    echo Policy updated successfully!
    echo Starting Claude Code...
    claude
) else (
    echo Failed to update policy. You may need to run this as Administrator.
    pause
)