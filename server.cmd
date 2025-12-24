@echo off
chcp 65001 >nul

:menu
echo.  
echo ========================================
echo          服务器管理工具
echo ========================================
echo.  
echo 1. 启动服务器
echo 2. 停止服务器
echo 3. 查看服务器状态
echo 4. 退出
echo.  
set /p choice=请选择操作 (1-4): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto status
if "%choice%"=="4" goto exit

echo 无效的选择，请重新输入！
echo.  
goto menu

:start
echo 正在启动服务器...
echo.  
start "Node.js Server" /B node index.js

echo 等待服务器启动...
timeout /t 2 /nobreak >nul

call :status
echo.  
echo 服务器已启动！
echo 访问地址: http://localhost:3000
echo API端点: http://localhost:3000/api/main
goto menu

:stop
echo 正在停止服务器...
echo.  
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv /nh') do (
    set "pid=%%~i"
    taskkill /pid %pid% /f >nul 2>&1
    if %errorlevel%==0 (
        echo 成功停止进程 %pid%
    ) else (
        echo 停止进程 %pid% 失败
    )
)

echo.  
echo 服务器已停止！
goto menu

:status
echo 服务器状态:
echo.  
tasklist /fi "imagename eq node.exe" /v | findstr /i "node"
if %errorlevel%==0 (
    echo.  
    echo ✅ 服务器正在运行中
    echo 访问地址: http://localhost:3000
) else (
    echo.  
    echo ❌ 服务器未运行
)
goto :eof

:exit
echo 感谢使用服务器管理工具！
echo.  
exit