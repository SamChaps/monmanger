@echo off
setlocal
cd /d "%~dp0"
py -3 tools\recipe_importer\app.py
if errorlevel 1 pause