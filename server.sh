#!/bin/bash

# 服务器管理脚本

# 定义颜色
green="\033[0;32m"
red="\033[0;31m"
yellow="\033[1;33m"
blue="\033[0;34m"
reset="\033[0m"

# 显示菜单
show_menu() {
    echo -e "\n${blue}=======================================${reset}"
    echo -e "${green}          服务器管理工具${reset}"
    echo -e "${blue}=======================================${reset}"
    echo -e "\n${yellow}1. 启动服务器${reset}"
    echo -e "${yellow}2. 停止服务器${reset}"
    echo -e "${yellow}3. 查看服务器状态${reset}"
    echo -e "${yellow}4. 退出${reset}"
    echo -e "\n"
}

# 启动服务器
start_server() {
    echo -e "${green}正在启动服务器...${reset}"
    
    # 检查是否已有服务器在运行
    if pgrep -x "node" > /dev/null; then
        echo -e "${red}服务器已经在运行中！${reset}"
        return 1
    fi
    
    # 在后台启动服务器
    node index.js > server.log 2>&1 &
    
    echo -e "${green}等待服务器启动...${reset}"
    sleep 2
    
    # 检查启动状态
    if pgrep -x "node" > /dev/null; then
        echo -e "\n${green}✅ 服务器已成功启动！${reset}"
        echo -e "${blue}访问地址: http://localhost:3000${reset}"
        echo -e "${blue}API端点: http://localhost:3000/api/main${reset}"
    else
        echo -e "\n${red}❌ 服务器启动失败！${reset}"
        echo -e "${yellow}查看日志: tail -f server.log${reset}"
    fi
}

# 停止服务器
stop_server() {
    echo -e "${red}正在停止服务器...${reset}"
    
    # 查找并杀死所有node进程
    if pgrep -x "node" > /dev/null; then
        pkill -x "node"
        
        # 等待进程退出
        sleep 1
        
        if ! pgrep -x "node" > /dev/null; then
            echo -e "\n${green}✅ 服务器已成功停止！${reset}"
        else
            echo -e "\n${red}❌ 服务器停止失败，尝试强制停止...${reset}"
            pkill -9 -x "node"
            sleep 1
            
            if ! pgrep -x "node" > /dev/null; then
                echo -e "${green}✅ 服务器已强制停止！${reset}"
            else
                echo -e "${red}❌ 服务器无法停止！${reset}"
            fi
        fi
    else
        echo -e "\n${yellow}⚠️  服务器未在运行中！${reset}"
    fi
}

# 查看服务器状态
check_status() {
    echo -e "${blue}服务器状态:${reset}"
    echo -e "\n"
    
    if pgrep -x "node" > /dev/null; then
        echo -e "${green}✅ 服务器正在运行中${reset}"
        echo -e "${blue}进程ID: $(pgrep -x "node")${reset}"
        echo -e "${blue}访问地址: http://localhost:3000${reset}"
        echo -e "${blue}API端点: http://localhost:3000/api/main${reset}"
    else
        echo -e "${red}❌ 服务器未运行${reset}"
    fi
    
    echo -e "\n"
}

# 主程序
echo -e "${green}欢迎使用服务器管理工具！${reset}"

while true; do
    show_menu
    read -p "请选择操作 (1-4): " choice
    
    case $choice in
        1)
            start_server
            ;;
        2)
            stop_server
            ;;
        3)
            check_status
            ;;
        4)
            echo -e "\n${green}感谢使用服务器管理工具！${reset}"
            exit 0
            ;;
        *)
            echo -e "${red}无效的选择，请重新输入！${reset}"
            ;;
    esac
done