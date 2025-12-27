# 神经谐音机 - English to Chinese Homophone Translator

一个基于AI的英文单词谐音翻译工具，可以将任何英文单词（包括代码、缩写、无意义字母组合）转换成搞笑/有趣的中文谐音。

## 功能特点

- 🎯 **精准谐音**：AI驱动的谐音生成，发音尽量接近原词
- 🎭 **搞笑有趣**：支持夸张、无厘头的谐音风格
- 🚀 **快速响应**：本地缓存机制，避免重复调用AI
- 📱 **易用界面**：提供Web界面，方便用户使用
- 🔧 **易于扩展**：模块化设计，便于更换AI服务

## 技术栈

- **后端**：Node.js, Express
- **AI服务**：阿里云百炼（默认），支持自定义
- **前端**：HTML, CSS, JavaScript
- **缓存**：文件缓存（JSON格式）
- **容器化**：Docker

## 快速开始

### 方式一：使用Docker（推荐）

#### 1. 拉取Docker镜像

```bash
docker pull mayozhayu/fxxkepl
```

#### 2. 运行Docker容器

```bash
docker run -p 3000:3000 -e API_KEY=your-api-key mayozhayu/fxxkepl
```

**参数说明**：
- `-p 3000:3000`：端口映射，将容器内的3000端口映射到主机的3000端口
- `-e API_KEY=your-api-key`：设置环境变量，配置你的AI服务API密钥
- 可以添加更多环境变量，如 `-e PORT=8080` 来修改服务端口

#### 3. 访问服务

打开浏览器访问 `http://localhost:3000`

### 方式二：本地运行

#### 1. 克隆项目

```bash
git clone <repository-url>
cd fxxkEPL
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置API密钥

通过环境变量设置API密钥：

**Windows (PowerShell)**：
```powershell
$env:API_KEY='your-api-key'
```

**Windows (CMD)**：
```cmd
set API_KEY=your-api-key
```

**Linux/Mac**：
```bash
export API_KEY=your-api-key
```

首次运行时，API密钥会自动保存到 `config.json` 文件中，后续启动无需再次设置。

#### 4. 启动服务

```bash
node index.js
```

服务将在端口 3000 启动，你可以通过 `http://localhost:3000` 访问Web界面。

## 配置说明

### AI服务配置

在 `ai-service.js` 中，你可以：
- 更换AI服务提供商（如OpenAI、百度文心一言等）
- 调整Prompt模板以改变谐音生成风格
- 修改模型名称

### 端口配置

通过环境变量 `PORT` 配置服务端口：

```bash
export PORT=8080  # Linux/Mac
set PORT=8080     # Windows CMD
$env:PORT=8080    # Windows PowerShell
```

或在 `index.js` 中直接修改默认端口：

```javascript
const PORT = process.env.PORT || 3000; // 默认端口3000
```

## API接口

### POST /api/main

**请求参数**：
```json
{
  "message": "Hello World! This is a test."
}
```

**响应示例**：
```json
{
  "success": true,
  "timestamp": "2025-12-25T12:00:00.000Z",
  "originalArticle": "Hello World! This is a test.",
  "originalWords": ["Hello", "World", "This", "is", "a", "test"],
  "translatedWords": ["哈喽", "沃得", "里斯", "伊斯", "额", "泰斯特"],
  "assembledResult": "哈喽 沃得! 里斯 伊斯 额 泰斯特."
}
```

## 使用示例

### Web界面

1. 打开 `http://localhost:3000`
2. 在输入框中输入英文文本
3. 点击"开始翻译"按钮
4. 查看翻译结果

### API调用

```bash
curl -X POST http://localhost:3000/api/main \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World!"}'
```

## 目录结构

```
├── ai-service.js      # AI服务模块
├── cache.json         # 翻译缓存文件（自动生成）
├── config.json        # 配置文件（自动生成）
├── index.js           # 主服务器文件
├── node_modules/      # 依赖包（自动安装）
├── package.json       # 项目配置
├── public/            # 静态文件
│   └── index.html     # Web界面
└── README.md          # 项目说明文档
```

## 缓存机制

系统采用本地文件缓存（`cache.json`），当翻译过的单词再次出现时，会直接从缓存中获取结果，避免重复调用AI服务，提高响应速度并减少API调用次数。

## 自定义AI服务

你可以轻松更换AI服务提供商，只需修改 `ai-service.js` 中的 `callRealAI` 函数即可。例如：

```javascript
// 使用OpenAI GPT
async function callRealAI(words) {
    const prompt = "Your prompt here...";
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }]
        },
        {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        }
    );
    // 处理响应...
}
```

## Git上传说明

项目已配置 `.gitignore` 文件，自动排除以下不必要的文件：

- `node_modules/`：依赖包，用户可通过 `npm install` 自动安装
- `config.json`：配置文件，包含API密钥等敏感信息
- `cache.json`：缓存文件，自动生成且会定期更新
- `Dockerfile`：Docker构建文件
- `package-lock.json`：依赖锁定文件
- IDE配置文件和临时文件

## 注意事项

- 确保你的API密钥有效且有足够的调用额度
- 首次运行时，API密钥会自动保存到 `config.json` 文件中
- 缓存文件 `cache.json` 会自动创建和更新
- 建议定期备份配置和缓存文件，避免数据丢失
- Docker容器内的配置和缓存文件在容器重启后会丢失，如需持久化请使用挂载卷

**享受翻译的乐趣！** 🎉