
@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0\.." || exit /b 1

title BlockPanel - Installation

set "ROOT=%CD%"
set "LOG_DIR=%ROOT%\logs"
set "SETUP=%ROOT%\scripts\mjs\setup.mjs"
set "BACKEND=%ROOT%\scripts\mjs\backend.mjs"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

call :step 10 "Verification de Node.js"
where node >nul 2>&1
if errorlevel 1 goto node_error

call :step 30 "Verification des fichiers"
if not exist "%SETUP%" goto setup_error
if not exist "%BACKEND%" goto backend_error

call :step 50 "Preparation de l'installation"
if not exist "%ROOT%\server" mkdir "%ROOT%\server"
if not exist "%ROOT%\server\current" mkdir "%ROOT%\server\current"

call :step 70 "Installation du serveur Minecraft"
node "%SETUP%"
if errorlevel 1 goto setup_failed

if not exist "%ROOT%\server\current\server.jar" goto jar_error
if not exist "%ROOT%\server\current\blockpanel.json" goto config_error

call :step 100 "Installation terminee"
cls
echo.
echo  BlockPanel
echo  ----------------------------------------
echo  Installation terminee.
echo  Demarrage du serveur Minecraft...
echo.

node "%BACKEND%"
set "RESULT=!errorlevel!"

if not "!RESULT!"=="0" (
    echo.
    echo  Le serveur s'est arrete avec une erreur.
    echo.
    pause
)

exit /b !RESULT!

:node_error
set "ERROR=Node.js est absent ou inaccessible."
goto fail

:setup_error
set "ERROR=Le fichier setup.mjs est introuvable."
goto fail

:backend_error
set "ERROR=Le fichier backend.mjs est introuvable."
goto fail

:setup_failed
set "ERROR=L'installation a echoue. Consultez les messages ci-dessus."
goto fail

:jar_error
set "ERROR=Le fichier server.jar n'a pas ete cree."
goto fail

:config_error
set "ERROR=Le fichier blockpanel.json n'a pas ete cree."
goto fail

:fail
cls
echo.
echo  BlockPanel - Erreur
echo  ----------------------------------------
echo  !ERROR!
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
echo  BlockPanel - Installation
echo  ----------------------------------------
echo  !LABEL!
echo.
echo  [!BAR!] !PERCENT!%%
echo.
exit /b 0
