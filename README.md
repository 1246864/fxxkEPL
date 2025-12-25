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

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置AI服务

编辑 `ai-service.js` 文件，配置你的AI服务信息：

```javascript
const API_KEY = 'your-api-key'; // 替换为你的实际 API 密钥
const MODEL_NAME = 'your-model-name'; // 替换为你的实际模型名称
```

### 3. 启动服务

```bash
node index.js
```

服务将在端口 3000 启动，你可以通过 `http://localhost:3000` 访问Web界面。

## 配置说明

### AI服务配置

在 `ai-service.js` 中，你可以：
- 修改API密钥和模型名称
- 更换AI服务提供商（如OpenAI、百度文心一言等）
- 调整Prompt模板以改变谐音生成风格

### 端口配置

在 `index.js` 中，你可以修改服务端口：

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
├── cache.json         # 翻译缓存文件
├── index.js           # 主服务器文件
├── node_modules/      # 依赖包
├── package.json       # 项目配置
└── public/            # 静态文件
    └── index.html     # Web界面
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

## 注意事项

- 确保你的API密钥有效且有足够的调用额度
- 缓存文件 `cache.json` 会自动创建和更新
- 建议定期备份缓存文件，避免数据丢失

**享受翻译的乐趣！** 🎉