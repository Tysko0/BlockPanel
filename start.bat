
@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0" || exit /b 1

title BlockPanel

set "ROOT=%~dp0"
set "LOG_DIR=%ROOT%logs"
set "SERVER_DIR=%ROOT%server\current"
set "SETUP_SCRIPT=%ROOT%scripts\start.bat"
set "BACKEND=%ROOT%scripts\mjs\backend.mjs"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%ROOT%server" mkdir "%ROOT%server"

call :step 10 "Preparation"
where node >nul 2>&1
if errorlevel 1 goto node_error

call :step 35 "Verification de l'installation"

if not exist "%SERVER_DIR%\server.jar" goto first_install
if not exist "%SERVER_DIR%\blockpanel.json" goto first_install

call :step 70 "Initialisation du serveur"
if not exist "%BACKEND%" goto backend_error

call :step 100 "Demarrage de BlockPanel"
cls
echo.
echo  BlockPanel
echo  ----------------------------------------
echo  Demarrage du serveur Minecraft...
echo.

node "%BACKEND%"
set "RESULT=!errorlevel!"

if not "!RESULT!"=="0" (
    echo.
    echo  Le serveur s'est arrete avec une erreur.
    echo  Consultez les messages ci-dessus.
    echo.
    pause
)

exit /b !RESULT!

:first_install
cls
echo.
echo  BlockPanel
echo  ----------------------------------------
echo  Premiere installation detectee.
echo.
call "%SETUP_SCRIPT%"
exit /b !errorlevel!

:node_error
cls
echo.
echo  BlockPanel - Erreur
echo  ----------------------------------------
echo  Node.js est absent ou inaccessible.
echo  Installez Node.js puis relancez BlockPanel.
echo.
pause
exit /b 1

:backend_error
cls
echo.
echo  BlockPanel - Erreur
echo  ----------------------------------------
echo  Le fichier backend.mjs est introuvable.
echo.
pause
exit /b 1

:step
cls
set "PERCENT=%~1"
set "LABEL=%~2"
set /a "FILLED=PERCENT/5"
set "BAR="

for /L %%I in (1,1,20) do (
    if %%I LEQ !FILLED! (
        set "BAR=!BAR!#"
    ) else (
        set "BAR=!BAR!-"
    )
)

echo.
echo  BlockPanel
echo  ----------------------------------------
echo  !LABEL!
echo.
echo  [!BAR!] !PERCENT!%%
echo.
exit /b 0
