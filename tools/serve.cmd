@echo off
setlocal
cd /d "%~dp0.."
set "JEKYLL_ENV=production"
call bundle exec jekyll serve --host 127.0.0.1 --port 4000 --livereload
exit /b %errorlevel%
