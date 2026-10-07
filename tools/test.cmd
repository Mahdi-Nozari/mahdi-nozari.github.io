@echo off
setlocal
cd /d "%~dp0.."
set "JEKYLL_ENV=production"
call bundle exec jekyll build
if errorlevel 1 exit /b 1
call bundle exec ruby tools/check-site.rb _site
if errorlevel 1 exit /b 1
python tools/check-presentation-assets.py _site
exit /b %errorlevel%
