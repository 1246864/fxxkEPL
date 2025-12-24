# 服务器管理脚本

本项目提供了两个方便的脚本，用于快速启动、停止和管理服务器。

## 1. Windows批处理脚本 (server.cmd)

适用于Windows系统，通过命令行界面管理服务器。

### 使用方法：

1. **双击运行**：直接双击 `server.cmd` 文件即可打开管理界面
2. **命令行运行**：
   ```bash
   server.cmd
   ```

### 功能：
- **启动服务器**：启动Node.js服务器
- **停止服务器**：停止所有Node.js进程
- **查看状态**：检查服务器是否正在运行
- **退出**：关闭管理工具

## 2. Linux/SSH Shell脚本 (server.sh)

适用于Linux系统或SSH远程连接环境。

### 使用方法：

1. **添加执行权限**（首次使用）：
   ```bash
   chmod +x server.sh
   ```

2. **运行脚本**：
   ```bash
   ./server.sh
   ```

### 功能：
- **启动服务器**：在后台启动Node.js服务器，日志输出到`server.log`
- **停止服务器**：停止所有Node.js进程
- **查看状态**：显示服务器运行状态和进程ID
- **退出**：关闭管理工具

## 3. 手动操作命令

### 启动服务器：
```bash
# Windows
node index.js

# Linux
node index.js &
```

### 停止服务器：
```bash
# Windows
Ctrl + C  # 直接运行时
或
Stop-Process -Name node -Force  # PowerShell

# Linux
pkill node
或
kill $(pgrep node)
```

### 查看服务器状态：
```bash
# Windows
tasklist | findstr node

# Linux
pgrep -x node
```

## 4. 服务器信息

- **默认端口**：3000
- **访问地址**：http://localhost:3000
- **API端点**：http://localhost:3000/api/main
- **日志文件**：server.log（仅Linux脚本使用）

## 注意事项

1. **Windows脚本**：
   - 需要安装Node.js
   - 直接双击即可使用

2. **Linux脚本**：
   - 需要安装Node.js
   - 首次使用需要添加执行权限
   - 建议在项目根目录下运行

3. **停止服务器**：
   - 脚本会停止所有Node.js进程
   - 如果有其他Node.js应用在运行，请谨慎使用

4. **后台运行**：
   - Linux脚本会将服务器输出重定向到server.log文件
   - 可以使用`tail -f server.log`查看实时日志

## 更新日志

- v1.0.0: 初始版本，包含基本的启动、停止和状态检查功能
- v1.1.0: 增加了友好的命令行界面和详细的状态信息

---

**使用愉快！** 🎉